/**
 * Configuração e integração do Sentry para monitoramento de erros
 *
 * O Sentry captura erros em produção, rastreia performance e fornece
 * insights sobre a saúde da aplicação.
 *
 * @module lib/monitoring/sentry
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'unknown';

/**
 * Inicializa o Sentry
 * Deve ser chamado o mais cedo possível no ciclo de vida da aplicação
 *
 * @example
 * // src/main.tsx
 * import { initSentry } from '@/lib/monitoring/sentry';
 * initSentry();
 */
export const initSentry = () => {
  // Não inicializar em desenvolvimento ou testes
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log('[Sentry] Skipping initialization in', ENVIRONMENT);
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `approvalhub@${APP_VERSION}`,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mascara dados sensíveis em replays
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],

    // Amostragem de performance (10% em produção para reduzir custo)
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Session Replay (10% normal, 100% em caso de erro)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtragem de erros
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filtrar erros de extensões do navegador
      if (error instanceof Error) {
        if (error.message?.includes('chrome-extension://')) {
          return null;
        }
        if (error.message?.includes('moz-extension://')) {
          return null;
        }
      }

      // Filtrar erros de rede conhecidos/esperados
      if (error instanceof Error) {
        const ignoredErrors = [
          'timeout',
          'Network request failed',
          'Failed to fetch',
          'NetworkError',
          'cancelled',
        ];

        if (ignoredErrors.some((msg) => error.message?.toLowerCase().includes(msg.toLowerCase()))) {
          // Log localmente mas não envia para Sentry
          console.warn('[Sentry] Ignorando erro de rede:', error.message);
          return null;
        }
      }

      // Filtrar URLs de desenvolvimento
      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      return event;
    },

    // Ignorar certos erros por padrão
    ignoreErrors: [
      // Erros do browser/extensões
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Erros de loading de scripts (CDN issues)
      'Loading chunk',
      'ChunkLoadError',
      // Erros de cancelamento (esperados)
      'AbortError',
      'The operation was aborted',
    ],

    // Tags globais
    initialScope: {
      tags: {
        version: APP_VERSION,
        environment: ENVIRONMENT,
      },
    },

    // Configuração de breadcrumbs
    maxBreadcrumbs: 50,
    beforeBreadcrumb(breadcrumb) {
      // Não logar breadcrumbs de console.log em produção
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },

    // Privacidade: não enviar dados sensíveis
    sendDefaultPii: false,
  });

  console.log('[Sentry] Initialized successfully for', ENVIRONMENT);
};

// ============================================================================
// HELPERS PÚBLICOS
// ============================================================================

/**
 * Captura uma exception manualmente
 *
 * @example
 * try {
 *   dangerousOperation();
 * } catch (error) {
 *   captureException(error, { operation: 'dangerousOperation' });
 * }
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.error('[Sentry Mock] Exception:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
    tags: {
      source: 'manual',
    },
  });
};

/**
 * Captura uma mensagem (não é erro, mas informação importante)
 *
 * @example
 * captureMessage('Rate limit atingido', 'warning', { userId: '123' });
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>,
) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log(`[Sentry Mock] Message [${level}]:`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
    tags: {
      source: 'manual',
    },
  });
};

/**
 * Define informações do usuário para contexto de erros
 * Chamar após login
 *
 * @example
 * setUser({ id: user.id, email: user.email });
 *
 * // Ao fazer logout:
 * setUser(null);
 */
export const setUser = (user: { id: string; email?: string; username?: string } | null) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log('[Sentry Mock] User set:', user?.id);
    return;
  }

  Sentry.setUser(user);
};

/**
 * Adiciona contexto extra para próximos erros
 *
 * @example
 * setContext('pauta', { id: pautaId, status: 'aprovada' });
 */
export const setContext = (name: string, context: Record<string, any>) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log(`[Sentry Mock] Context [${name}]:`, context);
    return;
  }

  Sentry.setContext(name, context);
};

/**
 * Adiciona uma tag para categorização
 *
 * @example
 * setTag('feature', 'comentarios');
 */
export const setTag = (key: string, value: string) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log(`[Sentry Mock] Tag: ${key}=${value}`);
    return;
  }

  Sentry.setTag(key, value);
};

/**
 * Adiciona um breadcrumb manualmente
 *
 * @example
 * addBreadcrumb('Usuário clicou em aprovar', { pautaId });
 */
export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log('[Sentry Mock] Breadcrumb:', message, data);
    return;
  }

  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Captura feedback do usuário após erro
 * Útil para error boundaries
 *
 * @example
 * captureFeedback({
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 *   message: 'O botão de aprovar não funciona',
 *   associatedEventId: eventId,
 * });
 */
export const captureFeedback = (feedback: {
  name?: string;
  email?: string;
  message: string;
  associatedEventId?: string;
}) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log('[Sentry Mock] Feedback:', feedback);
    return;
  }

  Sentry.captureUserFeedback({
    name: feedback.name || 'Anonymous',
    email: feedback.email || 'no-email@unknown.com',
    comments: feedback.message,
    event_id: feedback.associatedEventId || Sentry.lastEventId() || '',
  });
};

/**
 * Inicia uma transação para monitorar performance
 *
 * @example
 * const transaction = startTransaction('upload-arquivo');
 * try {
 *   await uploadFile();
 *   transaction.finish();
 * } catch (error) {
 *   transaction.setStatus('internal_error');
 *   transaction.finish();
 *   throw error;
 * }
 */
export const startTransaction = (name: string, op = 'custom') => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    const start = Date.now();
    return {
      finish: () => {
        console.log(`[Sentry Mock] Transaction [${name}]: ${Date.now() - start}ms`);
      },
      setStatus: (status: string) => {
        console.log(`[Sentry Mock] Transaction [${name}] status:`, status);
      },
    };
  }

  return Sentry.startTransaction({ name, op });
};

/**
 * ErrorBoundary do Sentry (componente React)
 * Use como wrapper de rotas ou componentes críticos
 *
 * @example
 * import { SentryErrorBoundary } from '@/lib/monitoring/sentry';
 *
 * <SentryErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler do Sentry para monitorar performance de componentes
 *
 * @example
 * import { SentryProfiler } from '@/lib/monitoring/sentry';
 *
 * <SentryProfiler name="PautaCard">
 *   <PautaCard {...props} />
 * </SentryProfiler>
 */
export const SentryProfiler = Sentry.Profiler;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { SeverityLevel } from '@sentry/types';
