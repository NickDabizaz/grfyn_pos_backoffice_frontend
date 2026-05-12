import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions : { enabled: true },
      manifest   : {
        name            : 'Grfyn POS & ERP',
        short_name      : 'Grfyn POS',
        description     : 'Sistem POS dan ERP untuk toko',
        theme_color     : '#6366f1',
        background_color: '#f8f7f4',
        display         : 'standalone',
        start_url       : '/pos',
        icons           : [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache the app shell & static assets
        globPatterns    : ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching  : [
          {
            // Cache GET API reads for offline browsing (products, customers, stock)
            urlPattern  : /\/api\/(barang|customer|stok)/,
            handler     : 'NetworkFirst',
            options     : {
              cacheName          : 'api-reads',
              networkTimeoutSeconds: 5,
              expiration         : { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port : 3000,
    proxy: {
      '/api'    : { target: 'http://localhost:5000', changeOrigin: true },
      '/reports': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
