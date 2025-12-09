/**
 * Cliente Supabase para integração com o sistema MiraPauta
 * Este cliente é separado do cliente principal do AprovaArte
 */
import { createClient } from '@supabase/supabase-js';
import type { MirapautaDatabase } from './types';

const MIRAPAUTA_URL = import.meta.env.VITE_MIRAPAUTA_SUPABASE_URL as string | undefined;
const MIRAPAUTA_ANON_KEY = import.meta.env.VITE_MIRAPAUTA_SUPABASE_ANON_KEY as string | undefined;

// Cliente pode ser null se as credenciais não estiverem configuradas
export const mirapautaClient =
  MIRAPAUTA_URL && MIRAPAUTA_ANON_KEY
    ? createClient<MirapautaDatabase>(MIRAPAUTA_URL, MIRAPAUTA_ANON_KEY, {
        auth: {
          storage: localStorage,
          persistSession: false, // Não persistir sessão do MiraPauta
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Verifica se a integração com MiraPauta está configurada
 */
export const isMirapautaConfigured = (): boolean => {
  return Boolean(MIRAPAUTA_URL && MIRAPAUTA_ANON_KEY);
};

/**
 * Retorna informações sobre a configuração da integração
 */
export const getMirapautaConfig = () => ({
  isConfigured: isMirapautaConfigured(),
  url: MIRAPAUTA_URL ? MIRAPAUTA_URL.replace(/https?:\/\//, '').split('.')[0] : null,
});
