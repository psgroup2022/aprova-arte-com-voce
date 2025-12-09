/**
 * Constantes globais do ApprovalHub
 *
 * Centraliza todos os valores mágicos (magic numbers) e strings
 * hard-coded do sistema.
 *
 * @module config/constants
 */

// ============================================================================
// COORDENADAS E DIMENSÕES
// ============================================================================

/**
 * Sistema de coordenadas para comentários pontuais
 * Usa escala percentual 0-100 para independência de resolução
 */
export const COORDINATES = {
  MIN: 0,
  MAX: 100,
  /** Coordenadas padrão para comentários gerais (não pontuais) */
  DEFAULT: { x: 0, y: 0 },
} as const;

// ============================================================================
// ARQUIVOS E UPLOAD
// ============================================================================

/**
 * Tipos de arquivo suportados
 */
export const FILE_TYPES = {
  IMAGE: 'imagem',
  VIDEO: 'video',
  DOCUMENT: 'documento',
} as const;

/**
 * MIME types permitidos para upload
 */
export const ALLOWED_MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENTS: ['application/pdf'],
} as const;

/**
 * Limites de tamanho de arquivo
 */
export const FILE_LIMITS = {
  /** Tamanho máximo por arquivo: 10MB */
  MAX_SIZE: 10 * 1024 * 1024,
  /** Tamanho máximo legível: "10MB" */
  MAX_SIZE_LABEL: '10MB',
  /** Número máximo de arquivos por pauta */
  MAX_FILES_PER_PAUTA: 20,
} as const;

/**
 * Compressão de imagens
 */
export const IMAGE_COMPRESSION = {
  /** Tamanho máximo após compressão: 1MB */
  MAX_SIZE_MB: 1,
  /** Largura/altura máxima: 1920px */
  MAX_DIMENSION: 1920,
  /** Formato de saída: WebP (melhor compressão) */
  OUTPUT_FORMAT: 'image/webp',
  /** Qualidade de compressão (0-1) */
  QUALITY: 0.85,
} as const;

// ============================================================================
// STATUS E ESTADOS
// ============================================================================

/**
 * Status possíveis de uma pauta
 */
export const PAUTA_STATUS = {
  RASCUNHO: 'rascunho',
  AGUARDANDO_APROVACAO: 'aguardando_aprovacao',
  APROVADA: 'aprovada',
  REJEITADA: 'rejeitada',
} as const;

/**
 * Labels legíveis para status
 */
export const PAUTA_STATUS_LABELS: Record<string, string> = {
  [PAUTA_STATUS.RASCUNHO]: 'Rascunho',
  [PAUTA_STATUS.AGUARDANDO_APROVACAO]: 'Aguardando Aprovação',
  [PAUTA_STATUS.APROVADA]: 'Aprovada',
  [PAUTA_STATUS.REJEITADA]: 'Rejeitada',
};

/**
 * Cores para badges de status
 */
export const PAUTA_STATUS_COLORS: Record<string, string> = {
  [PAUTA_STATUS.RASCUNHO]: 'gray',
  [PAUTA_STATUS.AGUARDANDO_APROVACAO]: 'yellow',
  [PAUTA_STATUS.APROVADA]: 'green',
  [PAUTA_STATUS.REJEITADA]: 'red',
};

// ============================================================================
// VALIDAÇÃO DE TEXTOS
// ============================================================================

/**
 * Limites de caracteres para campos de texto
 */
export const TEXT_LIMITS = {
  TITULO_MIN: 3,
  TITULO_MAX: 200,
  DESCRICAO_MAX: 5000,
  COMENTARIO_MIN: 1,
  COMENTARIO_MAX: 1000,
  OBSERVACOES_MAX: 2000,
  CLIENTE_NOME_MAX: 100,
  TAG_MAX: 50,
} as const;

// ============================================================================
// PAGINAÇÃO E PERFORMANCE
// ============================================================================

/**
 * Configurações de paginação
 */
export const PAGINATION = {
  /** Itens por página padrão */
  DEFAULT_PAGE_SIZE: 20,
  /** Tamanhos de página disponíveis */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  /** Margem para infinite scroll (px antes do fim) */
  INFINITE_SCROLL_MARGIN: 200,
} as const;

/**
 * Cache e performance
 */
export const CACHE = {
  /** Tempo de cache de queries (ms) */
  STALE_TIME: 5 * 60 * 1000, // 5 minutos
  /** Tempo para garbage collection de cache (ms) */
  CACHE_TIME: 10 * 60 * 1000, // 10 minutos
  /** Número de tentativas em caso de erro */
  RETRY_COUNT: 3,
  /** Delay entre tentativas (ms) */
  RETRY_DELAY: 1000,
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Limites de taxa de requisições
 */
export const RATE_LIMITS = {
  /** Requisições por minuto para usuários autenticados */
  AUTHENTICATED_PER_MINUTE: 60,
  /** Requisições por minuto para usuários anônimos */
  ANONYMOUS_PER_MINUTE: 10,
  /** Intervalo da janela de rate limit (ms) */
  WINDOW_MS: 60 * 1000,
} as const;

// ============================================================================
// URLS E ROTAS
// ============================================================================

/**
 * Rotas da aplicação
 */
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  CRIAR_PAUTA: '/criar-pauta',
  VISUALIZAR_PAUTA: '/pauta/:id',
  AGENDA: '/agenda',
  MENSAGENS: '/mensagens',
  RELATORIOS: '/relatorios',
  EQUIPE: '/equipe',
  CONFIGURACOES: '/configuracoes',
} as const;

/**
 * Identificadores especiais
 */
export const SPECIAL_IDS = {
  /** ID para comentários gerais (não pontuais) */
  COMENTARIO_GERAL: 'geral',
} as const;

// ============================================================================
// DESENVOLVIMENTO
// ============================================================================

/**
 * Flags de feature (temporárias, remover quando implementado)
 */
export const FEATURE_FLAGS = {
  ENABLE_AGENDA: false,
  ENABLE_MENSAGENS: false,
  ENABLE_RELATORIOS: false,
  ENABLE_EQUIPE: false,
  ENABLE_ANALYTICS: false,
} as const;

/**
 * Ambiente e configuração
 */
export const ENV = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  IS_TEST: import.meta.env.MODE === 'test',
} as const;

// ============================================================================
// STORAGE
// ============================================================================

/**
 * Buckets do Supabase Storage
 */
export const STORAGE_BUCKETS = {
  PAUTA_ARQUIVOS: 'pauta-arquivos',
  AVATARS: 'avatars',
} as const;

// ============================================================================
// TIMING E DELAYS
// ============================================================================

/**
 * Delays e timeouts
 */
export const TIMING = {
  /** Debounce para busca (ms) */
  SEARCH_DEBOUNCE: 300,
  /** Debounce para real-time updates (ms) */
  REALTIME_DEBOUNCE: 500,
  /** Timeout para requisições (ms) */
  REQUEST_TIMEOUT: 30000, // 30 segundos
  /** Duração de toast notifications (ms) */
  TOAST_DURATION: 5000,
  /** Duração de toast de sucesso (ms) */
  TOAST_SUCCESS_DURATION: 3000,
} as const;

// ============================================================================
// MENSAGENS PADRÃO
// ============================================================================

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Verifique os campos destacados.',
  FILE_TOO_LARGE: `Arquivo muito grande. Máximo: ${FILE_LIMITS.MAX_SIZE_LABEL}`,
  FILE_TYPE_INVALID: 'Tipo de arquivo não permitido.',
} as const;

/**
 * Mensagens de sucesso padrão
 */
export const SUCCESS_MESSAGES = {
  PAUTA_CREATED: 'Pauta criada com sucesso!',
  PAUTA_UPDATED: 'Pauta atualizada com sucesso!',
  PAUTA_DELETED: 'Pauta excluída com sucesso!',
  COMENTARIO_ADDED: 'Comentário adicionado com sucesso!',
  COMENTARIO_UPDATED: 'Comentário atualizado com sucesso!',
  COMENTARIO_DELETED: 'Comentário excluído com sucesso!',
  CHANGES_SAVED: 'Alterações salvas com sucesso!',
} as const;

// ============================================================================
// TYPE EXPORTS (para TypeScript)
// ============================================================================

export type PautaStatus = (typeof PAUTA_STATUS)[keyof typeof PAUTA_STATUS];
export type FileType = (typeof FILE_TYPES)[keyof typeof FILE_TYPES];
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
