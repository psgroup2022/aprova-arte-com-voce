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
 */
export const initSentry = () => {
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

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],

    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof Error) {
        if (error.message?.includes('chrome-extension://')) {
          return null;
        }
        if (error.message?.includes('moz-extension://')) {
          return null;
        }
      }

      if (error instanceof Error) {
        const ignoredErrors = [
          'timeout',
          'Network request failed',
          'Failed to fetch',
          'NetworkError',
          'cancelled',
        ];

        if (ignoredErrors.some((msg) => error.message?.toLowerCase().includes(msg.toLowerCase()))) {
          console.warn('[Sentry] Ignorando erro de rede:', error.message);
          return null;
        }
      }

      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      return event;
    },

    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Loading chunk',
      'ChunkLoadError',
      'AbortError',
      'The operation was aborted',
    ],

    initialScope: {
      tags: {
        version: APP_VERSION,
        environment: ENVIRONMENT,
      },
    },

    maxBreadcrumbs: 50,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },

    sendDefaultPii: false,
  });

  console.log('[Sentry] Initialized successfully for', ENVIRONMENT);
};

export const captureException = (error: Error, context?: Record<string, unknown>) => {
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

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>,
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

export const setUser = (user: { id: string; email?: string; username?: string } | null) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log('[Sentry Mock] User set:', user?.id);
    return;
  }

  Sentry.setUser(user);
};

export const setContext = (name: string, context: Record<string, unknown>) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log(`[Sentry Mock] Context [${name}]:`, context);
    return;
  }

  Sentry.setContext(name, context);
};

export const setTag = (key: string, value: string) => {
  if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
    console.log(`[Sentry Mock] Tag: ${key}=${value}`);
    return;
  }

  Sentry.setTag(key, value);
};

export const addBreadcrumb = (message: string, data?: Record<string, unknown>) => {
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

  Sentry.captureFeedback({
    name: feedback.name || 'Anonymous',
    email: feedback.email || 'no-email@unknown.com',
    message: feedback.message,
    associatedEventId: feedback.associatedEventId || Sentry.lastEventId() || '',
  });
};

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

  return Sentry.startSpan({ name, op }, () => ({
    finish: () => {},
    setStatus: () => {},
  }));
};

export const SentryErrorBoundary = Sentry.ErrorBoundary;
export const SentryProfiler = Sentry.Profiler;

export type SeverityLevel = Sentry.SeverityLevel;
