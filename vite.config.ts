import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'pantryo-logo.png',
          'pantryo-logo.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'Pantryo',
          short_name: 'Pantryo',
          description: 'Smart Kitchen Food Inventory, Receipts & Meal Planning',
          theme_color: '#0E766E',
          background_color: '#FAF7EE',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'vite-suppress-hmr-errors',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                injectTo: 'head-prepend',
                children: `
                  (function() {
                    var _origError = console.error;
                    console.error = function() {
                      var a = arguments[0];
                      if (typeof a === 'string' && (a.indexOf('[vite]') !== -1 || a.indexOf('websocket') !== -1 || a.indexOf('WebSocket') !== -1)) return;
                      return _origError.apply(console, arguments);
                    };
                    var OriginalWS = window.WebSocket;
                    if (!OriginalWS) return;
                    window.WebSocket = function(url, protocols) {
                      var isViteHmr = false;
                      if (typeof protocols === 'string' && (protocols === 'vite-hmr' || protocols === 'vite-ping')) isViteHmr = true;
                      else if (Array.isArray(protocols) && (protocols.indexOf('vite-hmr') !== -1 || protocols.indexOf('vite-ping') !== -1)) isViteHmr = true;
                      else if (typeof url === 'string' && (url.indexOf('vite-hmr') !== -1 || url.indexOf('token=') !== -1)) isViteHmr = true;
                      if (!isViteHmr) return new OriginalWS(url, protocols);
                      var listeners = {};
                      var dummy = {
                        url: url,
                        protocol: Array.isArray(protocols) ? protocols[0] : (protocols || ''),
                        readyState: 1,
                        OPEN: 1,
                        CONNECTING: 0,
                        CLOSING: 2,
                        CLOSED: 3,
                        send: function() {},
                        close: function() { dummy.readyState = 3; },
                        addEventListener: function(event, fn) {
                          if (!listeners[event]) listeners[event] = [];
                          listeners[event].push(fn);
                          if (event === 'open') {
                            setTimeout(function() { try { fn({ type: 'open', target: dummy }); } catch(e) {} }, 0);
                          }
                        },
                        removeEventListener: function(event, fn) {
                          if (!listeners[event]) return;
                          listeners[event] = listeners[event].filter(function(cb) { return cb !== fn; });
                        }
                      };
                      return dummy;
                    };
                    window.WebSocket.prototype = OriginalWS.prototype;
                    window.WebSocket.CONNECTING = 0;
                    window.WebSocket.OPEN = 1;
                    window.WebSocket.CLOSING = 2;
                    window.WebSocket.CLOSED = 3;
                  })();
                `,
              },
            ];
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        react: path.resolve(import.meta.dirname, 'node_modules/react'),
        'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'lucide-react'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
