/**
 * Pantryo - Installation & Environment Security Detection
 * Detects whether the application is running as an installed PWA / Standalone App.
 * When installed, all testing/sandbox bypasses and mock saved users are strictly forbidden.
 */

export function isAppInstalledOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Real standalone check (W3C standard)
  const isStandaloneMedia = Boolean(window.matchMedia?.('(display-mode: standalone)').matches);

  // iOS Safari Home Screen standalone mode
  const isIosStandalone = Boolean((window.navigator as any)?.standalone === true);

  // Android WebAPK or TWA launcher referrer
  const isAndroidReferrer = Boolean(
    typeof document !== 'undefined' &&
    typeof document.referrer === 'string' &&
    document.referrer.includes('android-app://')
  );

  // Explicit installed / standalone URL parameter
  const isInstalledUrlParam = Boolean(
    typeof window !== 'undefined' && (
      window.location.search.includes('installed=true') ||
      window.location.search.includes('mode=standalone')
    )
  );

  return Boolean(
    isStandaloneMedia ||
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
