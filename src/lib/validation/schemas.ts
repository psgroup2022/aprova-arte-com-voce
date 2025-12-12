/**
 * Schemas de validação com Zod para ApprovalHub
 *
 * Centraliza todas as regras de validação do sistema.
 * Use estes schemas tanto no frontend quanto no backend (Edge Functions).
 *
 * @module lib/validation/schemas
 */

import { z } from 'zod';
import {
  COORDINATES,
  FILE_LIMITS,
  TEXT_LIMITS,
  PAUTA_STATUS,
  ALLOWED_MIME_TYPES,
  FILE_TYPES,
} from '@/config/constants';

// ============================================================================
// SCHEMAS AUXILIARES
// ============================================================================

/**
 * Schema: Coordenadas (0-100)
 */
export const coordenadasSchema = z.object({
  x: z
    .number()
    .int('Coordenada X deve ser inteira')
    .min(COORDINATES.MIN, `Coordenada X mínima: ${COORDINATES.MIN}`)
    .max(COORDINATES.MAX, `Coordenada X máxima: ${COORDINATES.MAX}`),
  y: z
    .number()
    .int('Coordenada Y deve ser inteira')
    .min(COORDINATES.MIN, `Coordenada Y mínima: ${COORDINATES.MIN}`)
    .max(COORDINATES.MAX, `Coordenada Y máxima: ${COORDINATES.MAX}`),
});

/**
 * Schema: UUID
 */
const uuidSchema = z.string().uuid('ID inválido');

/**
 * Schema: Data ISO 8601
 */
const dateTimeSchema = z.string().datetime('Data inválida');

// ============================================================================
// PAUTA SCHEMAS
// ============================================================================

/**
 * Schema: Criar Pauta
 */
export const createPautaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(TEXT_LIMITS.TITULO_MIN, `Título deve ter no mínimo ${TEXT_LIMITS.TITULO_MIN} caracteres`)
    .max(TEXT_LIMITS.TITULO_MAX, `Título deve ter no máximo ${TEXT_LIMITS.TITULO_MAX} caracteres`),

  descricao: z
    .string()
    .max(
      TEXT_LIMITS.DESCRICAO_MAX,
      `Descrição muito longa (máx: ${TEXT_LIMITS.DESCRICAO_MAX} caracteres)`,
    )
    .optional()
    .nullable(),

  cliente: z
    .string()
    .trim()
    .min(1, 'Cliente é obrigatório')
    .max(
      TEXT_LIMITS.CLIENTE_NOME_MAX,
      `Nome do cliente muito longo (máx: ${TEXT_LIMITS.CLIENTE_NOME_MAX})`,
    ),

  data_prazo: dateTimeSchema.optional().nullable(),

  observacoes: z
    .string()
    .max(
      TEXT_LIMITS.OBSERVACOES_MAX,
      `Observações muito longas (máx: ${TEXT_LIMITS.OBSERVACOES_MAX} caracteres)`,
    )
    .optional()
    .nullable(),

  status: z
    .enum([
      PAUTA_STATUS.RASCUNHO,
      PAUTA_STATUS.AGUARDANDO_APROVACAO,
      PAUTA_STATUS.APROVADA,
      PAUTA_STATUS.REJEITADA,
    ] as [string, ...string[]])
    .default(PAUTA_STATUS.AGUARDANDO_APROVACAO),
});

/**
 * Schema: Atualizar Pauta
 */
export const updatePautaSchema = createPautaSchema.partial();

/**
 * Schema: Aprovar/Rejeitar Pauta
 */
export const aprovacaoPautaSchema = z.object({
  status: z.enum([PAUTA_STATUS.APROVADA, PAUTA_STATUS.REJEITADA] as [string, ...string[]]),
  comentario: z
    .string()
    .max(TEXT_LIMITS.COMENTARIO_MAX, 'Comentário muito longo')
    .optional()
    .nullable(),
});

// ============================================================================
// COMENTÁRIO SCHEMAS
// ============================================================================

/**
 * Schema: Criar Comentário
 */
export const createComentarioSchema = z.object({
  pauta_id: uuidSchema,

  arquivo_id: z.string().uuid('ID de arquivo deve ser UUID válido').nullable(),

  comentario: z
    .string()
    .trim()
    .min(TEXT_LIMITS.COMENTARIO_MIN, 'Comentário não pode ser vazio')
    .max(
      TEXT_LIMITS.COMENTARIO_MAX,
      `Comentário muito longo (máx: ${TEXT_LIMITS.COMENTARIO_MAX} caracteres)`,
    ),

  x_coordenada: z.number().int().min(COORDINATES.MIN).max(COORDINATES.MAX),

  y_coordenada: z.number().int().min(COORDINATES.MIN).max(COORDINATES.MAX),

  criado_por: uuidSchema.nullable(),
});

/**
 * Schema: Atualizar Comentário
 */
export const updateComentarioSchema = z.object({
  comentario: z
    .string()
    .trim()
    .min(TEXT_LIMITS.COMENTARIO_MIN, 'Comentário não pode ser vazio')
    .max(TEXT_LIMITS.COMENTARIO_MAX, 'Comentário muito longo'),
});

/**
 * Schema: Marcar comentário como resolvido
 */
export const resolverComentarioSchema = z.object({
  resolvido: z.boolean(),
  resposta: z
    .string()
    .max(TEXT_LIMITS.COMENTARIO_MAX, 'Resposta muito longa')
    .optional()
    .nullable(),
});

// ============================================================================
// CLIENTE SCHEMAS
// ============================================================================

/**
 * Schema: Criar Cliente
 */
export const createClienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(TEXT_LIMITS.CLIENTE_NOME_MAX, 'Nome muito longo'),

  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),

  telefone: z
    .string()
    .regex(/^[\d\s()+-]+$/, 'Telefone inválido')
    .optional()
    .nullable()
    .or(z.literal('')),

  empresa: z
    .string()
    .max(100, 'Nome da empresa muito longo')
    .optional()
    .nullable()
    .or(z.literal('')),

  observacoes: z
    .string()
    .max(TEXT_LIMITS.OBSERVACOES_MAX, 'Observações muito longas')
    .optional()
    .nullable()
    .or(z.literal('')),
});

/**
 * Schema: Atualizar Cliente
 */
export const updateClienteSchema = createClienteSchema.partial();

// ============================================================================
// ARQUIVO SCHEMAS
// ============================================================================

/**
 * Schema: Validação de File (browser)
 */
export const fileSchema = z
  .instanceof(File, { message: 'Deve ser um arquivo válido' })
  .refine(
    (file) => file.size <= FILE_LIMITS.MAX_SIZE,
    `Arquivo muito grande (máximo: ${FILE_LIMITS.MAX_SIZE_LABEL})`,
  )
  .refine((file) => {
    const allAllowedTypes: string[] = [
      ...ALLOWED_MIME_TYPES.IMAGES,
      ...ALLOWED_MIME_TYPES.VIDEOS,
      ...ALLOWED_MIME_TYPES.DOCUMENTS,
    ];
    return allAllowedTypes.includes(file.type);
  }, 'Tipo de arquivo não permitido');

/**
 * Schema: Upload de Arquivo
 */
export const fileUploadSchema = z.object({
  file: fileSchema,
  pautaId: uuidSchema,
  ordem: z.number().int().min(0, 'Ordem inválida'),
});

/**
 * Schema: Metadados de Arquivo
 */
export const fileMetadataSchema = z.object({
  nome_arquivo: z.string().min(1, 'Nome de arquivo obrigatório'),
  tipo: z.enum([FILE_TYPES.IMAGE, FILE_TYPES.VIDEO, FILE_TYPES.DOCUMENT] as [string, ...string[]]),
  url: z.string().url('URL inválida'),
  tamanho: z
    .number()
    .int()
    .positive('Tamanho deve ser positivo')
    .max(FILE_LIMITS.MAX_SIZE, 'Arquivo muito grande'),
  ordem: z.number().int().min(0),
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

/**
 * Schema: Login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

/**
 * Schema: Signup
 */
export const signupSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida dados com schema e retorna resultado formatado
 *
 * @example
 * const result = validateSchema(createPautaSchema, formData);
 * if (!result.success) {
 *   console.error(result.errors);
 *   return;
 * }
 * const validData = result.data;
 */
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    return { success: false as const, errors };
  }

  return { success: true as const, data: result.data };
};

/**
 * Valida e lança erro se inválido
 * Use em Edge Functions onde throw é apropriado
 *
 * @example
 * const validData = validateOrThrow(createPautaSchema, req.body);
 */
export const validateOrThrow = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

/**
 * Extrai mensagens de erro em formato amigável
 *
 * @example
 * const errors = getValidationErrors(zodError);
 * // { titulo: 'Título muito curto', email: 'Email inválido' }
 */
export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
  });

  return errors;
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreatePautaInput = z.infer<typeof createPautaSchema>;
export type UpdatePautaInput = z.infer<typeof updatePautaSchema>;
export type AprovacaoPautaInput = z.infer<typeof aprovacaoPautaSchema>;

export type CreateComentarioInput = z.infer<typeof createComentarioSchema>;
export type UpdateComentarioInput = z.infer<typeof updateComentarioSchema>;
export type ResolverComentarioInput = z.infer<typeof resolverComentarioSchema>;

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type FileMetadataInput = z.infer<typeof fileMetadataSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
