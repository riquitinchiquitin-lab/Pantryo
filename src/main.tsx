import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Service Worker management for PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Pantryo PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Pantryo PWA] Service Worker registration failed:', err);
        });
    });
  } else {
    // In dev mode / preview iframe, unregister any active service worker to prevent stale React chunk caching
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().then((success) => {
          if (success) {
            console.log('[Pantryo PWA] Unregistered dev service worker:', reg.scope);
          }
        });
      }
    });

    // Clear old cache storage entries if any
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith('pantryo')) {
            caches.delete(key);
          }
        });
      });
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
