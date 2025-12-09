/**
 * Sanitização de inputs para prevenir XSS (Cross-Site Scripting)
 *
 * Usa DOMPurify para limpar HTML potencialmente perigoso de inputs do usuário.
 * SEMPRE sanitize user-generated content antes de salvar no banco ou exibir.
 *
 * @module utils/sanitize
 */

import DOMPurify from 'isomorphic-dompurify';

interface SanitizeConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  KEEP_CONTENT: boolean;
  RETURN_DOM: boolean;
  RETURN_DOM_FRAGMENT: boolean;
  ALLOWED_URI_REGEXP?: RegExp;
}

/**
 * Configuração de sanitização padrão
 * Remove TODAS as tags HTML, mantendo apenas texto puro
 */
const DEFAULT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Configuração para rich text (uso futuro)
 * Permite tags básicas de formatação
 */
const RICH_TEXT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitiza texto para prevenir XSS
 * Remove todas as tags HTML por padrão
 */
export const sanitizeText = (text: string, allowRichText = false): string => {
  if (!text || typeof text !== 'string') return '';

  const config = allowRichText ? RICH_TEXT_CONFIG : DEFAULT_CONFIG;
  const result = DOMPurify.sanitize(text, config);
  return typeof result === 'string' ? result.trim() : String(result).trim();
};

/**
 * Sanitiza um objeto recursivamente
 * Útil para sanitizar payloads completos antes de salvar
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : sanitizeObject(item as Record<string, unknown>),
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
};

/**
 * Valida se um texto contém HTML potencialmente perigoso
 */
export const containsDangerousHTML = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;

  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /onmouseover=/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(text));
};

/**
 * Sanitiza HTML mantendo formatação segura
 */
export const sanitizeHTML = (html: string): string => {
  return sanitizeText(html, true);
};

/**
 * Escape caracteres HTML para exibição segura
 */
export const escapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Unescape caracteres HTML
 */
export const unescapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
};

/**
 * Sanitiza URL para prevenir javascript: e data: URIs
 */
export const sanitizeURL = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
    return '';
  }

  return url.trim();
};

/**
 * Remove null bytes e caracteres de controle
 */
export const removeControlCharacters = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  return text.replace(/[\x00-\x1F\x7F]/g, '');
};

/**
 * Pipeline completo de sanitização
 */
export const fullSanitize = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;
  sanitized = removeControlCharacters(sanitized);
  sanitized = sanitizeText(sanitized);
  return sanitized;
};

/**
 * Hook para usar em onChange de inputs
 */
export const sanitizeInput = (value: string): string => {
  return sanitizeText(value);
};

/**
 * Sanitiza form data antes de submit
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(data: T): T => {
  return sanitizeObject(data);
};
