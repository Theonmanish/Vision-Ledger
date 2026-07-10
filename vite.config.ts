import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'

const PWA_ICONS = [
  { src: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
  { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
  { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
  { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
  { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
  { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  {
    src: '/icons/icon-maskable-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
] as const

// https://vite.dev/config/
export default defineConfig((): UserConfig => ({
  plugins: [
    react(),
    tailwindcss(),
    svgr({
      svgrOptions: {
        exportType: 'named',
        namedExport: 'ReactComponent',
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: '**/*.svg?react',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg',
        'logo.svg',
        'offline.html',
        'icons/*.png',
        'icons/app-icon.svg',
      ],
      manifest: {
        name: 'VisionLedger — Proof of Reality',
        short_name: 'VisionLedger',
        description: 'Proof of Reality in an AI-Generated World',
        theme_color: '#09090B',
        background_color: '#09090B',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity', 'utilities'],
        icons: [...PWA_ICONS],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    allowedHosts: true,
    hmr: false,
  },
}))
