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

export const usePautaData = (id: string, client = defaultSupabase) => {
  const queryClient = useQueryClient();
  // Buscar dados reais da pauta
  const { data: pauta, isLoading: pautaLoading, error: pautaError } = usePauta(id);

  // Buscar arquivos da pauta (antigo sistema)
  const {
    data: arquivosLegado = [],
    isLoading: arquivosLegadoLoading,
  } = useQuery({
    queryKey: ['pauta-arquivos', id],
    queryFn: async (): Promise<Tables<'pauta_arquivos'>[]> => {
      if (!id) return [];
      const { data, error } = await client
        .from('pauta_arquivos')
        .select('*')
        .eq('pauta_id', id)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Buscar versão ativa e seus blocos (novo sistema)
  const {
    data: blocosData,
    isLoading: blocosLoading,
  } = useQuery({
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

  // Converter blocos para formato de arquivos para compatibilidade
  const arquivosFromBlocos: Tables<'pauta_arquivos'>[] = (blocosData || []).flatMap((bloco, blocoIndex) =>
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
      }))
    )
  );

  // Combinar arquivos do sistema legado e novo
  const arquivos = arquivosLegado.length > 0 ? arquivosLegado : arquivosFromBlocos;

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

  const isLoading = pautaLoading || arquivosLegadoLoading || blocosLoading || comentariosLoading;
  const error = pautaError || comentariosError || null;

  // Realtime: manter comentários e arquivos atualizados
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pauta_arquivos', filter: `pauta_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pauta-arquivos', id] });
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
