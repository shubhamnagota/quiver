/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { CSP, THEME_SCRIPT } from './csp';

/** Inlines the theme script, and adds the CSP meta tag to production builds (the dev server needs inline scripts for HMR). */
function quiverHtml(): Plugin {
  return {
    name: 'quiver-html',
    transformIndexHtml: (html, ctx) => {
      const out = html.replace('<!-- theme-script -->', `<script>${THEME_SCRIPT}</script>`);
      return ctx.server
        ? out
        : out.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    quiverHtml(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Quiver',
        short_name: 'Quiver',
        description: 'Quiver — a private dev and fintech toolbox by Shubham.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        categories: ['developer', 'finance', 'utilities', 'productivity'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'JWT decoder', url: '/t/jwt' },
          { name: 'JSON formatter', url: '/t/json' },
          { name: 'FX converter', url: '/t/fx' },
        ],
      },
      workbox: {
        // Precache every tool chunk so all non-network tools work offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'],
        globIgnores: ['og.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
