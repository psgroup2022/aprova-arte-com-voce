/**
 * Sistema de logging centralizado para ApprovalHub
 *
 * Em desenvolvimento: Log no console para debug
 * Em produção: Envia erros para Sentry, silencia debug/info
 * Em testes: Não loga nada
 *
 * @example
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('Calculando coordenadas', { x, y });
 * logger.info('Pauta criada', { pautaId });
 * logger.warn('Upload demorado', { duration });
 * logger.error('Falha no upload', error, { fileSize });
 */

import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test' || (import.meta.env as { VITEST?: boolean })?.VITEST;

/**
 * Classe Logger - Centraliza todo logging da aplicação
 */
class Logger {
  /**
   * Método interno de log
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    // Em testes, não logar nada para não poluir output
    if (isTest) return;

    const timestamp = new Date().toISOString();

    // Desenvolvimento: console colorido
    if (isDevelopment) {
      const styles = {
        debug: 'color: #888',
        info: 'color: #0066cc',
        warn: 'color: #ff9900',
        error: 'color: #cc0000; font-weight: bold',
      };

      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';

      console[consoleMethod](
        `%c[${timestamp}] [${level.toUpperCase()}] ${message}`,
        styles[level],
        context || '',
      );
      return;
    }

    // Produção: Sentry apenas para erros e warnings
    if (level === 'error') {
      Sentry.captureException(new Error(message), {
        level: 'error',
        extra: context,
        tags: {
          source: 'logger',
        },
      });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
        tags: {
          source: 'logger',
        },
      });
    }
    // Debug e info são silenciados em produção
  }

  /**
   * Log de debug - Apenas desenvolvimento
   * Use para logs detalhados de desenvolvimento
   *
   * @example
   * logger.debug('Clique detectado', { x: 150, y: 200 });
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  /**
   * Log de informação - Apenas desenvolvimento
   * Use para eventos importantes mas não críticos
   *
   * @example
   * logger.info('Upload iniciado', { fileName: 'image.jpg' });
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Log de warning - Desenvolvimento + Sentry
   * Use para situações anormais mas recuperáveis
   *
   * @example
   * logger.warn('API lenta', { duration: 5000 });
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Log de erro - Desenvolvimento + Sentry
   * Use para erros que precisam atenção
   *
   * @example
   * logger.error('Falha no upload', error, { fileSize: 1024000 });
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
    });
  }

  /**
   * Log de performance - Mede tempo de execução
   *
   * @example
   * const end = logger.startTimer('Query de pautas');
   * // ... código ...
   * end(); // Log: "Query de pautas completada em 234ms"
   */
  startTimer(label: string) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} completado`, { durationMs: duration.toFixed(2) });
    };
  }

  /**
   * Agrupa logs relacionados
   *
   * @example
   * logger.group('Upload de arquivos', () => {
   *   logger.info('Arquivo 1 uploaded');
   *   logger.info('Arquivo 2 uploaded');
   * });
   */
  group(label: string, callback: () => void) {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }
}

// Singleton
export const logger = new Logger();

/**
 * Helper: Substituir console.log por logger
 *
 * ANTES:
 * console.log('Enviando comentário:', newComment);
 * console.error('Erro:', error);
 *
 * DEPOIS:
 * logger.debug('Enviando comentário', { newComment });
 * logger.error('Erro ao enviar', error);
 */
