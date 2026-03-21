const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { VitePWA } = require('vite-plugin-pwa');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '匠心永驻 - AR古建筑体验',
        short_name: '古建筑AR',
        description: '中国古代建筑AR互动体验',
        theme_color: '#0A0A0F',
        background_color: '#0A0A0F',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ajax\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          },
          {
            urlPattern: /^https:\/\/modelviewer\.dev\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'model-viewer-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    // Electron将负责打开窗口，因此这里不再需要自动打开浏览器
    // open: true, 
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // 确保Vite能正确处理相对路径，这对于Electron加载本地文件至关重要
  base: './',
});
