import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as defaultSupabase } from '@/integrations/supabase/client';
import { usePauta } from '@/hooks/usePautas';
import type { Tables } from '@/integrations/supabase/types';
import { useEffect } from 'react';

interface BlocoComItens {
  id: string;
  tipo_material: string;
  ordem: number;
  status: string;
  itens: Array<{
    id: string;
    titulo: string | null;
    texto_conteudo: string | null;
    hashtags: string | null;
    ordem: number;
    arquivos: Array<{
      id: string;
      url: string;
      tipo: string;
      nome_arquivo: string;
    }>;
  }>;
}

/**
 * Um arquivo da pauta, achatado a partir dos blocos.
 *
 * Havia uma tabela `pauta_arquivos` — lista plana, anterior à estrutura de
 * blocos — e este hook lia as duas, preferindo a antiga quando tivesse linhas.
 * A baseline da Fase 1 removeu essa tabela; não há dado legado a preservar,
 * porque o projeto nunca rodou. Sobrou o formato, que as telas consomem.
 */
export interface ArquivoDaPauta {
  id: string;
  pauta_id: string;
  url: string;
  tipo: 'imagem' | 'video' | 'documento';
  nome_arquivo: string;
  ordem: number;
  tamanho: number | null;
  created_at: string;
}

export const usePautaData = (id: string, client = defaultSupabase) => {
  const queryClient = useQueryClient();
  // Buscar dados reais da pauta
  const { data: pauta, isLoading: pautaLoading, error: pautaError } = usePauta(id);

  // Buscar versão ativa e seus blocos
  const { data: blocosData, isLoading: blocosLoading } = useQuery({
    queryKey: ['pauta-blocos', id],
    queryFn: async (): Promise<BlocoComItens[]> => {
      if (!id) return [];

      // Buscar versão ativa da pauta
      const { data: versoes, error: versaoError } = await client
        .from('pauta_versoes')
        .select('id')
        .eq('pauta_id', id)
        .eq('ativa', true)
        .limit(1);

      if (versaoError) throw versaoError;
      if (!versoes || versoes.length === 0) return [];

      const versaoId = versoes[0].id;

      // Buscar blocos da versão
      const { data: blocos, error: blocosError } = await client
        .from('blocos_material')
        .select('*')
        .eq('versao_id', versaoId)
        .order('ordem', { ascending: true });

      if (blocosError) throw blocosError;
      if (!blocos || blocos.length === 0) return [];

      // Para cada bloco, buscar itens e arquivos
      const blocosComItens: BlocoComItens[] = [];

      for (const bloco of blocos) {
        const { data: itens, error: itensError } = await client
          .from('bloco_itens')
          .select('*')
          .eq('bloco_id', bloco.id)
          .order('ordem', { ascending: true });

        if (itensError) throw itensError;

        const itensComArquivos = [];
        for (const item of itens || []) {
          const { data: arquivos, error: arquivosError } = await client
            .from('bloco_arquivos')
            .select('*')
            .eq('item_id', item.id);

          if (arquivosError) throw arquivosError;

          itensComArquivos.push({
            ...item,
            arquivos: arquivos || [],
          });
        }

        blocosComItens.push({
          id: bloco.id,
          tipo_material: bloco.tipo_material,
          ordem: bloco.ordem,
          status: bloco.status,
          itens: itensComArquivos,
        });
      }

      return blocosComItens;
    },
    enabled: !!id,
  });

  // Achatar os blocos no formato que as telas consomem
  const arquivos: ArquivoDaPauta[] = (blocosData || []).flatMap((bloco, blocoIndex) =>
    bloco.itens.flatMap((item, itemIndex) =>
      item.arquivos.map((arquivo, arquivoIndex) => ({
        id: arquivo.id,
        pauta_id: id,
        url: arquivo.url,
        tipo: arquivo.tipo as 'imagem' | 'video' | 'documento',
        nome_arquivo: arquivo.nome_arquivo,
        ordem: blocoIndex * 100 + itemIndex * 10 + arquivoIndex,
        tamanho: null,
        created_at: new Date().toISOString(),
      })),
    ),
  );

  // Buscar comentários da pauta
  const {
    data: comentarios = [],
    isLoading: comentariosLoading,
    error: comentariosError,
  } = useQuery({
    queryKey: ['comentarios', id],
    queryFn: async (): Promise<Tables<'comentarios_pontuais'>[]> => {
      if (!id) return [];
      const { data, error } = await client
        .from('comentarios_pontuais')
        .select('*')
        .eq('pauta_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const isLoading = pautaLoading || blocosLoading || comentariosLoading;
  const error = pautaError || comentariosError || null;

  /*
   * Realtime só para comentários.
   *
   * Havia uma segunda inscrição, em `pauta_arquivos`, que morreu com a tabela.
   * Não a troquei por `bloco_arquivos` porque essa tabela não carrega
   * `pauta_id` — filtrar por pauta exigiria escutar as alterações de todas elas.
   * E a granularidade mudou: no desenho novo o material chega publicado de uma
   * vez pelo Mirador Team, então o evento que interessa é a versão virar ativa,
   * não um arquivo isolado aparecer. Fica para a Fase 3, que desenha a entrega.
   */
  useEffect(() => {
    if (!id) return;
    const channel = client
      .channel(`pauta-${id}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comentarios_pontuais',
          filter: `pauta_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comentarios', id] });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [id, queryClient, client]);

  return {
    pauta,
    arquivos,
    blocos: blocosData || [],
    comentarios,
    isLoading,
    error,
  };
};
