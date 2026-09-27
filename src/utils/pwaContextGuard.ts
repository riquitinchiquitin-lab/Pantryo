// Safely guard Navigator.prototype.getInstalledRelatedApps and navigator.getInstalledRelatedApps
// against DOMException: getInstalledRelatedApps() is only supported in top-level browsing contexts.

if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  try {
    const isTopContext = (): boolean => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    };

    // 1. Prototype level override
    const navProto =
      Object.getPrototypeOf(navigator) ||
      (typeof Navigator !== 'undefined' ? Navigator.prototype : null);

    if (navProto && 'getInstalledRelatedApps' in navProto) {
      const origProtoMethod = (navProto as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> }).getInstalledRelatedApps;
      Object.defineProperty(navProto, 'getInstalledRelatedApps', {
        value: function (this: unknown) {
          if (!isTopContext()) {
            return Promise.resolve([]);
          }
          try {
            return origProtoMethod.apply(this).catch(() => []);
          } catch {
            return Promise.resolve([]);
          }
        },
        configurable: true,
        writable: true,
      });
    }

    // 2. Instance level override
    if ('getInstalledRelatedApps' in navigator) {
      const origInstanceMethod = (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> }).getInstalledRelatedApps.bind(navigator);
      Object.defineProperty(navigator, 'getInstalledRelatedApps', {
        value: function () {
          if (!isTopContext()) {
            return Promise.resolve([]);
          }
          try {
            return origInstanceMethod().catch(() => []);
          } catch {
            return Promise.resolve([]);
          }
        },
        configurable: true,
        writable: true,
      });
    }
  } catch {
    // Ignore restricted environment errors
  }
}

export {};
