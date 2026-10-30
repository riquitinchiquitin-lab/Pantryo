/**
 * Global Authentication & API Fetch Interceptor
 * 
 * Automatically attaches valid session credentials (Bearer token and x-auth-token)
 * to all backend API requests, preventing unauthenticated access leaks.
 * Catches 401 Unauthorized responses to purge expired tokens and return to the login wall.
 */

export const AUTH_TOKEN_KEY = 'pantryo_auth_token';
export const ACTIVE_USER_ID_KEY = 'pantryo_active_user_id';

export function getAuthToken(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string, userId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
    }
  } catch (e) {
    console.error('[Pantryo Auth] Failed to store auth token:', e);
  }
}

export function clearAuthSession(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ACTIVE_USER_ID_KEY);
    }
  } catch (e) {
    console.error('[Pantryo Auth] Failed to clear auth session:', e);
  }
}

// Public auth endpoints that shouldn't trigger global logout when returning 401
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/status',
  '/auth/public-members',
  '/auth/setup-admin',
  '/auth/fido2',
];

// Reference the native fetch before overriding
const nativeFetch: typeof fetch = 
  typeof window !== 'undefined' && window.fetch
    ? window.fetch.bind(window)
    : typeof globalThis !== 'undefined' && globalThis.fetch
    ? globalThis.fetch.bind(globalThis)
    : fetch;

/**
 * Intercepted fetch function
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = typeof input === 'string' 
    ? input 
    : input instanceof URL 
    ? input.toString() 
    : (input as Request).url;

  const isApiRequest = typeof urlString === 'string' && urlString.includes('/api/');

  if (isApiRequest) {
    const token = getAuthToken();
    const options: RequestInit = init ? { ...init } : {};
    const headers = new Headers(options.headers || {});

    if (token) {
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('x-auth-token')) {
        headers.set('x-auth-token', token);
      }
    }

    options.headers = headers;
    const response = await nativeFetch(input, options);

    // Handle session expiration or token rejection
    if (response.status === 401) {
      const isPublicAuth = PUBLIC_AUTH_PATHS.some((path) => urlString.includes(path));
      if (!isPublicAuth) {
        console.warn('[Pantryo Auth] 401 Unauthorized received for protected endpoint:', urlString);
        clearAuthSession();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pantryo:unauthorized', { detail: { url: urlString } }));
        }
      }
    }

    return response;
  }

  return nativeFetch(input, init);
}

// Safely install interceptor onto window / globalThis without triggering getter-only assignment errors
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'fetch', {
      value: authFetch,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch (e1) {
    try {
      // Fallback 1: try defining on Window.prototype
      Object.defineProperty(Window.prototype, 'fetch', {
        value: authFetch,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch (e2) {
      try {
        // Fallback 2: standard property assignment
        (window as any).fetch = authFetch;
      } catch (e3) {
        console.warn('[Pantryo Auth] Safe fetch interception fallback notice:', e3);
      }
    }
  }
}
