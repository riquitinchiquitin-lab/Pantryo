import './utils/pwaContextGuard.ts';
import './utils/authInterceptor.ts';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('[Pantryo PWA] Service worker active on scope:', reg.scope);

      // Periodically check for SW updates (every 45 seconds)
      setInterval(() => {
        reg.update().catch((err) => console.debug('[Pantryo PWA] SW periodic update check:', err));
      }, 45 * 1000);

      // Also check on tab focus
      window.addEventListener('focus', () => {
        reg.update().catch(() => {});
      });
    })
    .catch((err) => {
      console.warn('[Pantryo PWA] Service worker registration note:', err);
    });

  // Automatically refresh when a new service worker takes control (seamless update)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[Pantryo PWA] New service worker took control. Reloading for latest version...');
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
