import { useEffect, useState } from 'react';
import { isAppInstalledOrStandalone } from '../utils/installStatus';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global capture to ensure the event isn't lost if fired before React component mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the default browser mini-infobar so our custom install UI can control the prompt
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
    console.log('[Pantryo PWA] beforeinstallprompt event captured and deferred');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[Pantryo PWA] App was successfully installed!');
    try {
      localStorage.setItem('pantryo_pwa_installed', 'true');
    } catch (_) {}
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isAppInstalledOrStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  });

  useEffect(() => {
    const checkInstalled = () => {
      setIsInstalled(isAppInstalledOrStandalone());
    };

    checkInstalled();

    const promptListener = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };
    promptListeners.add(promptListener);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem('pantryo_pwa_installed', 'true');
      } catch (_) {}
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
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          try {
            localStorage.setItem('pantryo_pwa_installed', 'true');
          } catch (_) {}
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          return true;
        }
        return false;
      } catch (e) {
        console.warn('[Pantryo PWA] Native install prompt error:', e);
      }
    }

    return false;
  };

  return {
    isInstallable: Boolean((deferredPrompt || globalDeferredPrompt) && !isInstalled),
    isInstalled,
    isIOS,
    install,
  };
}
