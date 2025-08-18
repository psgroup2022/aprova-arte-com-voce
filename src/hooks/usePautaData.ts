import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as defaultSupabase } from '@/integrations/supabase/client';
import { usePauta } from '@/hooks/usePautas';
import type { Tables } from '@/integrations/supabase/types';
import { useEffect } from 'react';

export const usePautaData = (id: string, client = defaultSupabase) => {
  const queryClient = useQueryClient();
  // Buscar dados reais da pauta
  const { data: pauta, isLoading: pautaLoading, error: pautaError } = usePauta(id);

  // Buscar arquivos da pauta
  const {
    data: arquivos = [],
    isLoading: arquivosLoading,
    error: arquivosError,
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

  const isLoading = pautaLoading || arquivosLoading || comentariosLoading;
  const error = pautaError || arquivosError || comentariosError || null;

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
    comentarios,
    isLoading,
    error,
  };
};
