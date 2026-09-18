import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // O CSP do dev precisa conhecer o Supabase que este ambiente usa. Fixar
  // `*.supabase.co` impedia rodar contra o Supabase local: o navegador recusava
  // a conexão antes de ela sair. Sai daqui, não de uma lista escrita à mão.
  const env = loadEnv(mode, process.cwd(), '');
  const supabase = env.VITE_SUPABASE_URL?.trim() || '';
  const local = supabase.startsWith('http://');

  const origens = (protocolo: 'http' | 'ws') => {
    const remoto = protocolo === 'http' ? 'https://*.supabase.co' : 'wss://*.supabase.co';
    if (!supabase) return remoto;
    const proprio = protocolo === 'ws' ? supabase.replace(/^http/, 'ws') : supabase;
    return [remoto, proprio].join(' ');
  };

  return {
    server: {
      host: '::',
      port: 8080,
      headers: {
        // Content Security Policy (CSP) - Previne XSS
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval necessário para Vite HMR em dev
          "style-src 'self' 'unsafe-inline'", // unsafe-inline necessário para styled components
          // Avatares e artes vêm do storage do Supabase. No local ele fala http,
          // então a origem precisa entrar explicitamente.
          `img-src 'self' data: https: blob:${local ? ` ${supabase}` : ''}`,
          "font-src 'self' data:",
          `connect-src 'self' ${origens('http')} ${origens('ws')} https://*.sentry.io`, // API e WebSocket
          `media-src 'self' blob: https:${local ? ` ${supabase}` : ''}`, // Vídeos
          "object-src 'none'", // Bloquear plugins (Flash, etc)
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'", // Prevenir clickjacking
          // Contra um Supabase local (http), esta diretiva reescreveria a URL para
          // https e a conexão morreria. Continua valendo em qualquer alvo https.
          ...(local ? [] : ['upgrade-insecure-requests']),
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
  };
});
