/**
 * Pantryo - Installation & Environment Security Detection
 * Detects whether the application is running as an installed PWA / Standalone App.
 * When installed, all testing/sandbox bypasses and mock saved users are strictly forbidden.
 */

export function isAppInstalledOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const isMinimalUi = window.matchMedia?.('(display-mode: minimal-ui)').matches;
  const isFullscreen = window.matchMedia?.('(display-mode: fullscreen)').matches;
  const isIosStandalone = (window.navigator as any)?.standalone === true;
  const isAndroidReferrer = typeof document !== 'undefined' && document.referrer?.includes('android-app://');
  const isInstalledUrlParam = typeof window !== 'undefined' && (
    window.location.search.includes('installed=true') ||
    window.location.search.includes('mode=standalone')
  );

  return Boolean(
    isStandaloneMedia ||
    isMinimalUi ||
    isFullscreen ||
    isIosStandalone ||
    isAndroidReferrer ||
    isInstalledUrlParam
  );
}

/**
 * Returns true ONLY if running inside a development test iframe and NOT installed.
 * When installed, this always returns false, completely removing any testing bypass.
 */
export function canUseSandboxBypass(isInstalledProp?: boolean): boolean {
  if (isInstalledProp) return false;
  if (isAppInstalledOrStandalone()) return false;
  if (typeof window === 'undefined') return false;

  // Must strictly be inside a sandboxed iframe
  const isInsideIframe = window.self !== window.top;
  return isInsideIframe;
}
