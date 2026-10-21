import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../utils/i18n';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  message: string;
  duration?: number; // ms, default 3500
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ComponentType<{ className?: string }>;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: (value: boolean) => void;
}

export interface AlertToastContextValue {
  showToast: (options: ToastOptions | string, type?: ToastType) => string;
  dismissToast: (id: string) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
  showAlert: (message: string, type?: ToastType) => void;
}

const AlertToastContext = createContext<AlertToastContextValue | null>(null);

export const AlertToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'info'): string => {
      const opts: ToastOptions =
        typeof options === 'string'
          ? { message: options, type }
          : { type: options.type || type, ...options };

      const id = opts.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = opts.duration ?? 3500;

      const newToast: ToastItem = {
        ...opts,
        id,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Keep at most 3 active toasts at once to prevent screen clutter
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered.slice(-2), newToast];
      });

      if (duration > 0) {
        if (toastTimeoutsRef.current.has(id)) {
          clearTimeout(toastTimeoutsRef.current.get(id));
        }
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        toastTimeoutsRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const showAlert = useCallback(
    (message: string, type: ToastType = 'info') => {
      showToast({ message, type });
    },
    [showToast]
  );

  const confirmAction = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          ...options,
          isOpen: true,
          resolve: (val: boolean) => {
            setConfirmState(null);
            resolve(val);
          },
        });
      });
    },
    []
  );

  // Keyboard shortcut listener for active confirmation sheet
  useEffect(() => {
    if (!confirmState?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        confirmState.resolve(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmState.resolve(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState]);

  // Global override for window.alert and window.confirm to guarantee zero browser popups
  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (msg?: any) => {
      showToast(String(msg || ''), 'warning');
    };

    window.confirm = (msg?: string) => {
      console.warn('[Pantryo] Native window.confirm intercepted to prevent popup:', msg);
      showToast(String(msg || ''), 'warning');
      return false; // prevent blocking modal
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, [showToast]);

  return (
    <AlertToastContext.Provider value={{ showToast, dismissToast, confirmAction, showAlert }}>
      {children}

      {/* 1. Bottom Floating Toasts (Auto-Dismissing, Touch-Safe) */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-20 sm:bottom-6 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4 space-y-2 pb-[env(safe-area-inset-bottom,0px)]"
      >
        {toasts.map((toast) => {
          const type = toast.type || 'info';

          const typeStyles = {
            success: 'bg-[#0D3B37] text-white border-teal-500/30',
            error: 'bg-[#3E1114] text-white border-rose-500/30',
            warning: 'bg-[#3B2609] text-white border-amber-500/30',
            info: 'bg-[#122A36] text-white border-sky-500/30',
          }[type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            warning: 'text-amber-400',
            info: 'text-sky-400',
          }[type];

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto max-w-md w-full rounded-2xl p-3.5 sm:p-4 border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all transform animate-in fade-in slide-in-from-bottom-3 duration-200 select-none ${typeStyles}`}
            >
              <div className="shrink-0">
                <IconComponent className={`w-5 h-5 ${iconColor}`} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold leading-tight text-white/95 break-words">
                  {toast.message}
                </p>
              </div>

              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
                >
                  {toast.actionLabel}
                </button>
              )}

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 shrink-0 cursor-pointer transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. Embedded In-App Bottom Sheet Confirmation (No Native Popups) */}
      {confirmState?.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          {/* Blurred Backdrop */}
          <div
            onClick={() => confirmState.resolve(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Sheet Card */}
          <div className="relative w-full max-w-md bg-white text-slate-900 rounded-t-[32px] sm:rounded-3xl border-t sm:border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 z-10 animate-in slide-in-from-bottom-6 duration-200 pb-[max(1.75rem,env(safe-area-inset-bottom,0px))]">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-2 mb-1 sm:hidden" />

            <div className="flex items-start gap-4">
              {/* Icon badge */}
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmState.variant === 'danger'
                    ? 'bg-rose-100 text-rose-700'
                    : confirmState.variant === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {confirmState.icon ? (
                  <confirmState.icon className="w-5 h-5 stroke-[2.2]" />
                ) : confirmState.variant === 'danger' ? (
                  <Trash2 className="w-5 h-5 stroke-[2.2]" />
                ) : confirmState.variant === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                ) : (
                  <Info className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>

              {/* Title & Description */}
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-snug">
                  {confirmState.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
              >
                {confirmState.cancelLabel || (lang === 'FR' ? 'Annuler' : 'Cancel')}
              </button>

              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-98 shadow-sm cursor-pointer text-center ${
                  confirmState.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : confirmState.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-teal-800 hover:bg-teal-900 text-white'
                }`}
              >
                {confirmState.confirmLabel ||
                  (confirmState.variant === 'danger'
                    ? lang === 'FR'
                      ? 'Supprimer'
                      : 'Delete'
                    : lang === 'FR'
                    ? 'Confirmer'
                    : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertToastContext.Provider>
  );
};

export const useAlertToast = (): AlertToastContextValue => {
  const context = useContext(AlertToastContext);
  if (!context) {
    throw new Error('useAlertToast must be used within an AlertToastProvider');
  }
  return context;
};
