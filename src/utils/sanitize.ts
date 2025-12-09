/**
 * Sanitização de inputs para prevenir XSS (Cross-Site Scripting)
 *
 * Usa DOMPurify para limpar HTML potencialmente perigoso de inputs do usuário.
 * SEMPRE sanitize user-generated content antes de salvar no banco ou exibir.
 *
 * @module utils/sanitize
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuração de sanitização padrão
 * Remove TODAS as tags HTML, mantendo apenas texto puro
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [], // Nenhuma tag permitida
  ALLOWED_ATTR: [], // Nenhum atributo permitido
  KEEP_CONTENT: true, // Mantém o conteúdo text(), removendo apenas tags
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Configuração para rich text (uso futuro)
 * Permite tags básicas de formatação
 */
const RICH_TEXT_CONFIG: DOMPurify.Config = {
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
 *
 * @param text - Texto a ser sanitizado
 * @param allowRichText - Se true, permite tags básicas de formatação
 * @returns Texto sanitizado e seguro
 *
 * @example
 * // Remove scripts maliciosos
 * sanitizeText('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 *
 * @example
 * // Mantém formatação básica se permitido
 * sanitizeText('<b>Bold</b> text', true)
 * // Returns: '<b>Bold</b> text'
 *
 * @example
 * // Remove atributos perigosos
 * sanitizeText('<img src=x onerror=alert(1)>')
 * // Returns: ''
 */
export const sanitizeText = (text: string, allowRichText = false): string => {
  if (!text || typeof text !== 'string') return '';

  const config = allowRichText ? RICH_TEXT_CONFIG : DEFAULT_CONFIG;
  return DOMPurify.sanitize(text, config).trim();
};

/**
 * Sanitiza um objeto recursivamente
 * Útil para sanitizar payloads completos antes de salvar
 *
 * @param obj - Objeto a ser sanitizado
 * @returns Objeto com todos os strings sanitizados
 *
 * @example
 * sanitizeObject({
 *   titulo: '<script>xss</script>Pauta',
 *   descricao: 'Normal text',
 *   metadata: { tag: '<b>Bold</b>' }
 * })
 * // Returns:
 * // {
 * //   titulo: 'Pauta',
 * //   descricao: 'Normal text',
 * //   metadata: { tag: 'Bold' }
 * // }
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : sanitizeObject(item),
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
};

/**
 * Valida se um texto contém HTML potencialmente perigoso
 * Útil para alertas ANTES de salvar
 *
 * @param text - Texto a ser validado
 * @returns true se contém HTML perigoso
 *
 * @example
 * containsDangerousHTML('<script>alert(1)</script>')
 * // Returns: true
 *
 * containsDangerousHTML('Normal text')
 * // Returns: false
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
 * Use apenas quando realmente precisar de rich text
 *
 * @param html - HTML a ser sanitizado
 * @returns HTML seguro com apenas tags permitidas
 *
 * @example
 * sanitizeHTML('<p>Safe</p><script>alert(1)</script>')
 * // Returns: '<p>Safe</p>'
 */
export const sanitizeHTML = (html: string): string => {
  return sanitizeText(html, true);
};

/**
 * Escape caracteres HTML para exibição segura
 * Use quando quiser MOSTRAR o HTML como texto, não renderizá-lo
 *
 * @param text - Texto a escapar
 * @returns Texto com caracteres HTML escapados
 *
 * @example
 * escapeHTML('<div>Test</div>')
 * // Returns: '&lt;div&gt;Test&lt;/div&gt;'
 */
export const escapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Unescape caracteres HTML
 * Reverso de escapeHTML
 *
 * @param text - Texto escapado
 * @returns Texto original
 *
 * @example
 * unescapeHTML('&lt;div&gt;Test&lt;/div&gt;')
 * // Returns: '<div>Test</div>'
 */
export const unescapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
};

/**
 * Sanitiza URL para prevenir javascript: e data: URIs
 *
 * @param url - URL a ser sanitizada
 * @returns URL segura ou string vazia se perigosa
 *
 * @example
 * sanitizeURL('javascript:alert(1)')
 * // Returns: ''
 *
 * sanitizeURL('https://example.com')
 * // Returns: 'https://example.com'
 */
export const sanitizeURL = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Bloquear protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
    return '';
  }

  // Permitir URLs relativas, http, https, mailto, tel
  return url.trim();
};

/**
 * Remove null bytes e caracteres de controle
 * Previne ataques de null byte poisoning
 *
 * @param text - Texto a limpar
 * @returns Texto sem caracteres de controle
 */
export const removeControlCharacters = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  // Remove null bytes e outros caracteres de controle
  return text.replace(/[\x00-\x1F\x7F]/g, '');
};

/**
 * Pipeline completo de sanitização
 * Aplica múltiplas camadas de sanitização
 *
 * @param text - Texto a ser sanitizado
 * @returns Texto completamente limpo e seguro
 *
 * @example
 * fullSanitize('<script>alert(1)</script>\x00Hidden')
 * // Returns: 'Hidden'
 */
export const fullSanitize = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;
  sanitized = removeControlCharacters(sanitized);
  sanitized = sanitizeText(sanitized);
  return sanitized;
};

// ============================================================================
// HOOKS DE INTEGRAÇÃO (uso em forms)
// ============================================================================

/**
 * Hook para usar em onChange de inputs
 * Sanitiza enquanto o usuário digita
 *
 * @example
 * const handleChange = (e) => {
 *   const value = sanitizeInput(e.target.value);
 *   setFormData({ ...formData, [e.target.name]: value });
 * };
 */
export const sanitizeInput = (value: string): string => {
  return sanitizeText(value);
};

/**
 * Sanitiza form data antes de submit
 *
 * @example
 * const handleSubmit = (data) => {
 *   const clean = sanitizeFormData(data);
 *   await createPauta(clean);
 * };
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  return sanitizeObject(data);
};
