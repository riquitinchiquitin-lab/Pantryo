import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global capture to ensure the event isn't lost if fired before React component mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // IMPORTANT: Do NOT call e.preventDefault() so the browser's native "Add to home screen"
    // or "Install App" omnibox prompt / banner is NEVER suppressed by the browser!
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
    console.log('[Pantryo PWA] beforeinstallprompt event captured and enabled for native & custom install');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[Pantryo PWA] App was successfully installed!');
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  });

  useEffect(() => {
    const checkInstalled = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    checkInstalled();

    const promptListener = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };
    promptListeners.add(promptListener);

    const handleBeforeInstallPrompt = (e: Event) => {
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      promptListeners.delete(promptListener);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    // 1. Try official PWABuilder web component if present
    const pwaInstallEl = document.querySelector('pwa-install') as (HTMLElement & { openPrompt?: () => void; isInstallAvailable?: boolean }) | null;
    if (pwaInstallEl && typeof pwaInstallEl.openPrompt === 'function') {
      try {
        pwaInstallEl.openPrompt();
        return true;
      } catch (err) {
        console.warn('[Pantryo PWA] pwa-install openPrompt note:', err);
      }
    }

    // 2. Try captured beforeinstallprompt event
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          return true;
        }
      } catch (e) {
        console.warn('[Pantryo PWA] Install prompt execution note:', e);
      }
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
