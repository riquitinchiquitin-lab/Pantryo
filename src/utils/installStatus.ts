/**
 * Pantryo - Installation & Environment Security Detection
 * Detects whether the application is running as an installed PWA / Standalone App.
 * When installed, all testing/sandbox bypasses and mock saved users are strictly forbidden.
 */

export function isAppInstalledOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Real standalone check (W3C standard display modes)
  const isStandaloneMedia = Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches
  );

  // iOS Safari Home Screen standalone mode
  const isIosStandalone = Boolean((window.navigator as any)?.standalone === true);

  // Android WebAPK or TWA launcher referrer
  const isAndroidReferrer = Boolean(
    typeof document !== 'undefined' &&
    typeof document.referrer === 'string' &&
    (document.referrer.includes('android-app://') || document.referrer.includes('app-installed'))
  );

  // Explicit installed / standalone URL parameter or hash
  const isInstalledUrlParam = Boolean(
    typeof window !== 'undefined' && (
      window.location.search.includes('installed=true') ||
      window.location.search.includes('mode=standalone') ||
      window.location.hash.includes('installed=true') ||
      window.location.hash.includes('standalone')
    )
  );

  // Cached PWA installed state
  let isLocalStorageInstalled = false;
  try {
    isLocalStorageInstalled = localStorage.getItem('pantryo_pwa_installed') === 'true';
  } catch (_) {}

  // If detected via query param or standalone media, cache to localStorage
  if (isStandaloneMedia || isIosStandalone || isAndroidReferrer || isInstalledUrlParam) {
    try {
      localStorage.setItem('pantryo_pwa_installed', 'true');
    } catch (_) {}
    return true;
  }

  return Boolean(isLocalStorageInstalled);
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
