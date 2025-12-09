import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    headers: {
      // Content Security Policy (CSP) - Previne XSS
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval necessário para Vite HMR em dev
        "style-src 'self' 'unsafe-inline'", // unsafe-inline necessário para styled components
        "img-src 'self' data: https: blob:", // Permitir imagens de data URIs, HTTPS e blobs
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io", // API e WebSocket
        "media-src 'self' blob: https:", // Vídeos
        "object-src 'none'", // Bloquear plugins (Flash, etc)
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'", // Prevenir clickjacking
        "upgrade-insecure-requests",
      ].join('; '),

      // Prevenir MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Prevenir clickjacking
      'X-Frame-Options': 'DENY',

      // XSS Protection (legado, mas não faz mal)
      'X-XSS-Protection': '1; mode=block',

      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions Policy (antiga Feature Policy)
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Security: Remove console.log em produção
    minify: mode === 'production' ? 'terser' : false,
    terserOptions:
      mode === 'production'
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,

    // Rollup options para melhor code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks grandes
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
}));
