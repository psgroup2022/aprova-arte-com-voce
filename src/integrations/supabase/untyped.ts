import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Cliente sem tipagem de schema.
 *
 * Alguns recursos (papel/senha provisória no perfil, funções de aprovação
 * pública) ainda não constam nos tipos gerados do banco. Este alias permite
 * usá-los sem quebrar a verificação de tipos do restante do sistema.
 */
export const supabaseUntyped = supabase as unknown as SupabaseClient;
