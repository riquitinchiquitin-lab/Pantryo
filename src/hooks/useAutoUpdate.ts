import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoUpdateOptions {
  /**
   * Callback fired when dataVersion increments on the server
   * (e.g. inventory items added/updated/deleted from another device or background sync)
   */
  onDataMutated?: () => void;
  /**
   * Set to true if a critical interactive modal is open or the user is actively inputting data.
   * Auto-reload will wait until the modal closes before triggering.
   */
  isUserBusy?: boolean;
  /**
   * Polling interval in milliseconds (default: 20000ms = 20s)
   */
  checkIntervalMs?: number;
}

export interface AutoUpdateStatus {
  currentBuildId: string | null;
  serverBuildId: string | null;
  dataVersion: number | null;
  updateAvailable: boolean;
  isReloading: boolean;
  lastChecked: Date | null;
  applyUpdateNow: () => void;
  checkForUpdates: () => Promise<void>;
}

export function useAutoUpdate({
  onDataMutated,
  isUserBusy = false,
  checkIntervalMs = 20000,
}: AutoUpdateOptions = {}): AutoUpdateStatus {
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<number | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const initialBuildIdRef = useRef<string | null>(null);
  const lastDataVersionRef = useRef<number | null>(null);
  const updateAvailableRef = useRef<boolean>(false);
  const isUserBusyRef = useRef<boolean>(isUserBusy);
  const isCheckingRef = useRef<boolean>(false);

  // Keep ref up to date
  isUserBusyRef.current = isUserBusy;

  /**
   * Purges browser service worker and cache storage, then reloads the page
   */
  const applyUpdateNow = useCallback(() => {
    if (isReloading) return;
    setIsReloading(true);
    console.log('[Pantryo AutoUpdate] Purging caches and reloading to apply latest server version...');

    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'PURGE_CACHE' });
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
    } catch (_) {}

    // Short timeout to allow cache deletion promises to start before reload
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }, [isReloading]);

  /**
   * Check /api/version for code changes or database mutations
   */
  const checkForUpdates = useCallback(async () => {
    if (isCheckingRef.current || isReloading) return;
    isCheckingRef.current = true;

    try {
      const ts = Date.now();
      const res = await fetch(`/api/version?_ts=${ts}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) {
        // Fallback endpoint
        const fbRes = await fetch(`/api/v1/system/version?_ts=${ts}`, {
          cache: 'no-store',
        });
        if (!fbRes.ok) return;
        var data = await fbRes.json();
      } else {
        var data = await res.json();
      }

      setLastChecked(new Date());

      if (!data || !data.buildId) return;

      const serverBuild: string = data.buildId;
      const serverDataVer: number = typeof data.dataVersion === 'number' ? data.dataVersion : 0;

      setServerBuildId(serverBuild);

      // First run: record initial build and dataVersion
      if (!initialBuildIdRef.current) {
        initialBuildIdRef.current = serverBuild;
        setCurrentBuildId(serverBuild);
        lastDataVersionRef.current = serverDataVer;
        setDataVersion(serverDataVer);
        return;
      }

      // Check for code / build update
      if (serverBuild !== initialBuildIdRef.current) {
        console.log(`[Pantryo AutoUpdate] New server build detected! Current: ${initialBuildIdRef.current}, Server: ${serverBuild}`);
        setUpdateAvailable(true);
        updateAvailableRef.current = true;

        // If user is not currently in a modal or editing, trigger auto-reload immediately!
        if (!isUserBusyRef.current) {
          applyUpdateNow();
        }
        return;
      }

      // Check for data mutation (inventory / meals changed)
      if (lastDataVersionRef.current !== null && serverDataVer > lastDataVersionRef.current) {
        console.log(`[Pantryo AutoUpdate] Server data mutation detected (v${lastDataVersionRef.current} -> v${serverDataVer}). Syncing state...`);
        lastDataVersionRef.current = serverDataVer;
        setDataVersion(serverDataVer);
        if (onDataMutated) {
          onDataMutated();
        }
      }
    } catch (err) {
      console.debug('[Pantryo AutoUpdate] Server poll notice:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [applyUpdateNow, isReloading, onDataMutated]);

  // Initial check on mount
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Background interval polling
  useEffect(() => {
    const timer = setInterval(() => {
      checkForUpdates();
    }, Math.max(10000, checkIntervalMs));

    return () => clearInterval(timer);
  }, [checkForUpdates, checkIntervalMs]);

  // Check whenever window regains focus, visibility changes, or network reconnects
  useEffect(() => {
    const handleFocus = () => checkForUpdates();
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    const handleOnline = () => checkForUpdates();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdates]);

  // If an update was detected while user was busy, trigger reload once they finish
  useEffect(() => {
    if (!isUserBusy && updateAvailableRef.current && !isReloading) {
      console.log('[Pantryo AutoUpdate] User is no longer busy. Executing queued update reload...');
      applyUpdateNow();
    }
  }, [isUserBusy, isReloading, applyUpdateNow]);

  return {
    currentBuildId,
    serverBuildId,
    dataVersion,
    updateAvailable,
    isReloading,
    lastChecked,
    applyUpdateNow,
    checkForUpdates,
  };
}
