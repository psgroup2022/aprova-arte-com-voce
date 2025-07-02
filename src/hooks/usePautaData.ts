import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePauta } from "@/hooks/usePautas";

export const usePautaData = (id: string) => {
  // Buscar dados reais da pauta
  const { data: pauta, isLoading: pautaLoading } = usePauta(id);
  
  // Buscar arquivos da pauta
  const { data: arquivos = [], isLoading: arquivosLoading } = useQuery({
    queryKey: ['pauta-arquivos', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
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
  const { data: comentarios = [], isLoading: comentariosLoading } = useQuery({
    queryKey: ['comentarios', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
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

  return {
    pauta,
    arquivos,
    comentarios,
    isLoading
  };
};