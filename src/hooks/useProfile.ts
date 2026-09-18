import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

export type Papel = Database['public']['Enums']['papel_usuario'];

/** O perfil de quem está logado — papel, retrato e pendência de senha. */
export interface Perfil {
  id: string;
  nome: string;
  email: string | null;
  avatar_url: string | null;
  papel: Papel;
  senha_provisoria: boolean;
  ativo: boolean;
}

export const PERFIL_QUERY_KEY = ['perfil-atual'];

/**
 * Carrega o perfil da pessoa logada.
 *
 * O papel vem do banco a cada sessão, e não do token: quem perde o admin perde
 * ao recarregar, sem esperar o token expirar. E o que a tela decide com isso é
 * só o que ela mostra — quem manda é a política de acesso, do outro lado.
 */
export const useProfile = () => {
  const { user, loading: carregandoAuth } = useAuth();

  const consulta = useQuery({
    queryKey: [...PERFIL_QUERY_KEY, user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, avatar_url, papel, senha_provisoria, ativo')
        .eq('auth_user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    perfil: consulta.data ?? null,
    isAdmin: consulta.data?.papel === 'admin',
    // Enquanto a autenticação ou o perfil não chegaram, não dá para afirmar nada
    // sobre papel nem sobre senha pendente. Quem consome espera por isto.
    loading: carregandoAuth || (Boolean(user) && consulta.isLoading),
    error: consulta.error,
    refetch: consulta.refetch,
  };
};
