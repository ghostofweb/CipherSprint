import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

// Link previews (LinkedIn, X, Slack) need absolute image URLs. On Vercel the
// production domain is known at build time; SITE_URL overrides it.
const siteUrl = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/$/, '');
const absoluteSocialImage = {
  name: 'absolute-social-image',
  transformIndexHtml(html: string) {
    if (!siteUrl) return html;
    return html
      .replaceAll('content="/brand/og-image-1200x630.png"', `content="${siteUrl}/brand/og-image-1200x630.png"`)
      .replace('<meta property="og:type"', `<meta property="og:url" content="${siteUrl}/" />
    <meta property="og:type"`);
  },
};

export default defineConfig({
  plugins: [
    svgr(),
    react(),
    absoluteSocialImage,
    // Offline support: the app shell, fonts and word lists are cached, so the
    // solo typing test runs with no connection. public/manifest.json stays the
    // manifest; the plugin only adds the service worker.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: they change far less often than app code, so
        // returning visitors keep them cached across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
