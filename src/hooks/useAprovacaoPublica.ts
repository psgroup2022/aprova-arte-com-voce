import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as defaultSupabase } from '@/integrations/supabase/client';
import type { PautaPublica } from '@/types/aprovacao-publica';

/**
 * A pauta vista pelo cliente, sem login.
 *
 * Tudo passa por três funções `security definer`. O cliente não tem permissão
 * em tabela nenhuma — o token do link é a credencial, e cada função confere o
 * token antes de devolver ou gravar qualquer coisa. Medido: como `anon`,
 * `select * from pautas` responde "permission denied for table pautas".
 *
 * As duas funções de escrita devolvem a pauta já atualizada. Por isso a
 * resposta vai direto para o cache em vez de disparar uma nova busca: menos
 * uma ida ao servidor, e o que aparece na tela é o que o banco gravou, não um
 * palpite otimista que pode divergir das regras dele.
 */

export const chaveAprovacaoPublica = (token: string) => ['aprovacao-publica', token];

type Cliente = typeof defaultSupabase;

export const useAprovacaoPublica = (token: string, client: Cliente = defaultSupabase) => {
  const queryClient = useQueryClient();
  const chave = chaveAprovacaoPublica(token);

  const consulta = useQuery({
    queryKey: chave,
    queryFn: async (): Promise<PautaPublica | null> => {
      const { data, error } = await (client.rpc as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)('pauta_publica', { p_token: token });
      if (error) throw error as Error;
      // Token desconhecido, curto demais ou pauta sem versão ativa: a função
      // devolve nulo, não erro. Link inválido não é falha de rede.
      return (data as unknown as PautaPublica | null) ?? null;
    },
    enabled: Boolean(token),
    // Link errado não melhora com insistência, e cada tentativa é uma consulta
    // por token na porta de entrada pública.
    retry: false,
  });

  const guardar = (nova: unknown) => {
    queryClient.setQueryData(chave, (nova as PautaPublica | null) ?? null);
  };

  const decidir = useMutation({
    mutationFn: async (args: {
      blocoId: string;
      status: 'aprovada' | 'reprovada';
      nota?: string;
      por: string;
    }) => {
      const { data, error } = await (client.rpc as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)('decidir_bloco', {
        p_token: token,
        p_bloco_id: args.blocoId,
        p_status: args.status,
        // O banco faz `nullif(trim(...), '')`, então string vazia vira nulo lá.
        p_nota: args.nota ?? '',
        p_por: args.por,
      });
      if (error) throw error as Error;
      return data;
    },
    onSuccess: guardar,
  });

  const comentar = useMutation({
    mutationFn: async (args: {
      blocoId: string;
      arquivoId: string;
      x: number;
      y: number;
      texto: string;
      por: string;
    }) => {
      const { data, error } = await (client.rpc as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)('comentar_bloco', {
        p_token: token,
        p_bloco_id: args.blocoId,
        p_arquivo_id: args.arquivoId,
        p_x: Math.round(args.x),
        p_y: Math.round(args.y),
        p_texto: args.texto,
        p_por: args.por,
      });
      if (error) throw error as Error;
      return data;
    },
    onSuccess: guardar,
  });

  /**
   * "Terminei de revisar."
   *
   * Sem isto o cliente decide peça a peça e não sabe se já pode fechar a aba —
   * e a Mirador não sabe se ele acabou ou só parou no meio. O banco recusa
   * entregar com peça pendente, que é a condição do step-12.
   */
  const enviarRevisao = useMutation({
    mutationFn: async (args: { por: string }) => {
      const { data, error } = await (client.rpc as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)('enviar_revisao', {
        p_token: token,
        p_por: args.por,
      });
      if (error) throw error as Error;
      return data;
    },
    onSuccess: guardar,
  });

  const pecas = consulta.data?.pecas ?? [];
  const decididas = pecas.filter((p) => p.decisao !== 'pendente').length;

  return {
    pauta: consulta.data?.pauta ?? null,
    pecas,
    /** Nulo só depois de carregar: aí significa link que não abre nada. */
    linkInvalido: !consulta.isLoading && !consulta.isError && consulta.data === null,
    decididas,
    total: pecas.length,
    /** O ciclo só segue quando não sobra peça pendente — condição do step-12. */
    completa: pecas.length > 0 && decididas === pecas.length,
    carregando: consulta.isLoading,
    erro: consulta.error,
    /** A revisão foi entregue e nada mudou depois dela. */
    entregue: Boolean(consulta.data?.pauta.revisao_enviada_em),
    entreguePor: consulta.data?.pauta.revisao_enviada_por ?? '',
    decidir,
    comentar,
    enviarRevisao,
  };
};
