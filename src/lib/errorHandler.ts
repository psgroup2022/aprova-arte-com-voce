/**
 * Error Handler Centralizado
 *
 * Padroniza o tratamento de erros em toda a aplicação,
 * garantindo que todos os erros sejam logados corretamente
 * e exibidos de forma consistente ao usuário.
 *
 * @module lib/errorHandler
 */

import { captureException } from '@/lib/monitoring/sentry';
import { logger } from '@/utils/logger';
import { PostgrestError } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { ERROR_MESSAGES } from '@/config/constants';

// ============================================================================
// TIPOS DE ERROS
// ============================================================================

/**
 * Categorias de erros para tratamento específico
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  NETWORK = 'network',
  DATABASE = 'database',
  FILE_UPLOAD = 'file_upload',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

/**
 * Severidade do erro para priorização
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Erro estruturado com informações padronizadas
 */
export interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  shouldNotify: boolean;
}

// ============================================================================
// DETECÇÃO E CLASSIFICAÇÃO DE ERROS
// ============================================================================

/**
 * Detecta categoria do erro baseado em sua estrutura
 */
export const detectErrorCategory = (error: any): ErrorCategory => {
  // Erros de validação (Zod)
  if (error instanceof ZodError) {
    return ErrorCategory.VALIDATION;
  }

  // Erros do Supabase/PostgreSQL
  if (isPostgrestError(error)) {
    const code = error.code;

    // Códigos de autenticação/autorização
    if (code === 'PGRST301' || code === '401') {
      return ErrorCategory.AUTHENTICATION;
    }

    if (code === 'PGRST116' || code === '403' || code?.includes('policy')) {
      return ErrorCategory.AUTHORIZATION;
    }

    // Not found
    if (code === 'PGRST116' || code === '404') {
      return ErrorCategory.NOT_FOUND;
    }

    // Constraint violations
    if (code?.includes('23505') || code?.includes('unique_violation')) {
      return ErrorCategory.VALIDATION;
    }

    return ErrorCategory.DATABASE;
  }

  // Erros de rede
  if (
    error instanceof TypeError &&
    (error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('Failed to fetch'))
  ) {
    return ErrorCategory.NETWORK;
  }

  // Erros de timeout
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }

  // Rate limiting
  if (error?.status === 429 || error?.message?.includes('rate limit')) {
    return ErrorCategory.RATE_LIMIT;
  }

  // File upload errors
  if (error?.message?.includes('file') || error?.message?.includes('upload')) {
    return ErrorCategory.FILE_UPLOAD;
  }

  return ErrorCategory.UNKNOWN;
};

/**
 * Detecta severidade baseado na categoria
 */
export const detectErrorSeverity = (category: ErrorCategory): ErrorSeverity => {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.DATABASE:
      return ErrorSeverity.CRITICAL;

    case ErrorCategory.AUTHORIZATION:
    case ErrorCategory.FILE_UPLOAD:
      return ErrorSeverity.HIGH;

    case ErrorCategory.NETWORK:
    case ErrorCategory.NOT_FOUND:
    case ErrorCategory.RATE_LIMIT:
      return ErrorSeverity.MEDIUM;

    case ErrorCategory.VALIDATION:
    default:
      return ErrorSeverity.LOW;
  }
};

/**
 * Extrai mensagem amigável para o usuário
 */
export const getUserMessage = (error: any, category: ErrorCategory): string => {
  switch (category) {
    case ErrorCategory.VALIDATION:
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return firstError.message;
      }
      return ERROR_MESSAGES.VALIDATION;

    case ErrorCategory.AUTHENTICATION:
      return ERROR_MESSAGES.UNAUTHORIZED;

    case ErrorCategory.AUTHORIZATION:
      return ERROR_MESSAGES.UNAUTHORIZED;

    case ErrorCategory.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;

    case ErrorCategory.NETWORK:
      return ERROR_MESSAGES.NETWORK;

    case ErrorCategory.DATABASE:
      if (isPostgrestError(error)) {
        // Traduzir erros comuns do PostgreSQL
        if (error.message?.includes('duplicate key')) {
          return 'Este registro já existe.';
        }
        if (error.message?.includes('foreign key')) {
          return 'Não é possível excluir este registro pois está sendo usado.';
        }
      }
      return 'Erro ao processar requisição no banco de dados.';

    case ErrorCategory.FILE_UPLOAD:
      return ERROR_MESSAGES.FILE_TYPE_INVALID;

    case ErrorCategory.RATE_LIMIT:
      return 'Muitas requisições. Aguarde um momento e tente novamente.';

    default:
      return ERROR_MESSAGES.GENERIC;
  }
};

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

/**
 * Processa erro e retorna estrutura padronizada
 *
 * @example
 * try {
 *   await createPauta(data);
 * } catch (error) {
 *   const appError = handleError(error, { operation: 'createPauta' });
 *   toast({ title: appError.userMessage, variant: 'destructive' });
 * }
 */
export const handleError = (error: any, context?: Record<string, any>): AppError => {
  const category = detectErrorCategory(error);
  const severity = detectErrorSeverity(category);
  const userMessage = getUserMessage(error, category);

  const appError: AppError = {
    category,
    severity,
    message: error?.message || String(error),
    userMessage,
    originalError: error instanceof Error ? error : undefined,
    context,
    timestamp: new Date(),
    shouldNotify: severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH,
  };

  // Log local
  logger.error(
    `[${category.toUpperCase()}] ${appError.message}`,
    error,
    {
      ...context,
      category,
      severity,
    },
  );

  // Enviar para Sentry se crítico/alto
  if (appError.shouldNotify && error instanceof Error) {
    captureException(error, {
      ...context,
      category,
      severity,
      userMessage,
    });
  }

  return appError;
};

/**
 * Handler específico para mutations do React Query
 *
 * @example
 * const mutation = useMutation({
 *   mutationFn: createPauta,
 *   onError: (error) => handleMutationError(error, toast, { operation: 'createPauta' }),
 * });
 */
export const handleMutationError = (
  error: any,
  toast: (options: { title: string; description?: string; variant?: 'destructive' }) => void,
  context?: Record<string, any>,
): AppError => {
  const appError = handleError(error, context);

  toast({
    title: 'Erro',
    description: appError.userMessage,
    variant: 'destructive',
  });

  return appError;
};

/**
 * Handler específico para queries do React Query
 */
export const handleQueryError = (
  error: any,
  context?: Record<string, any>,
): AppError => {
  return handleError(error, {
    ...context,
    type: 'query',
  });
};

/**
 * Handler para erros assíncronos não capturados
 * Use em try/catch de operações async
 */
export const handleAsyncError = async <T>(
  fn: () => Promise<T>,
  context?: Record<string, any>,
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const appError = handleError(error, context);
    return { error: appError };
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica se é erro do Postgrest/Supabase
 */
export const isPostgrestError = (error: any): error is PostgrestError => {
  return (
    error &&
    typeof error === 'object' &&
    ('code' in error || 'details' in error || 'hint' in error)
  );
};

/**
 * Verifica se é erro de autenticação
 */
export const isAuthError = (error: any): boolean => {
  return detectErrorCategory(error) === ErrorCategory.AUTHENTICATION;
};

/**
 * Verifica se é erro de validação
 */
export const isValidationError = (error: any): boolean => {
  return detectErrorCategory(error) === ErrorCategory.VALIDATION;
};

/**
 * Verifica se é erro de rede
 */
export const isNetworkError = (error: any): boolean => {
  return detectErrorCategory(error) === ErrorCategory.NETWORK;
};

/**
 * Extrai informações detalhadas do erro para debugging
 */
export const getErrorDetails = (error: any): Record<string, any> => {
  const details: Record<string, any> = {
    message: error?.message || String(error),
    name: error?.name,
    stack: error?.stack,
  };

  // Adicionar campos específicos do Postgrest
  if (isPostgrestError(error)) {
    details.code = error.code;
    details.details = error.details;
    details.hint = error.hint;
  }

  // Adicionar campos do Zod
  if (error instanceof ZodError) {
    details.zodErrors = error.errors;
  }

  return details;
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Verifica se erro é recuperável (vale a pena retry)
 */
export const isRetryableError = (error: any): boolean => {
  const category = detectErrorCategory(error);

  return (
    category === ErrorCategory.NETWORK ||
    category === ErrorCategory.RATE_LIMIT ||
    (isPostgrestError(error) && error.code === '500')
  );
};

/**
 * Calcula delay para retry com exponential backoff
 */
export const getRetryDelay = (attemptNumber: number, baseDelay = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 10000);
};
