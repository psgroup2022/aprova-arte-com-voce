import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PautaFormData, PautaVersao, BlocoMaterial, BlocoItem, createInitialFormData } from '@/types/pauta-form';
import { useToast } from '@/hooks/use-toast';

interface UsePautaEditReturn {
  formData: PautaFormData | null;
  isLoading: boolean;
  error: string | null;
  pautaId: string | null;
}

export const usePautaEdit = (id: string | undefined): UsePautaEditReturn => {
  const [formData, setFormData] = useState<PautaFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('ID da pauta não fornecido');
      return;
    }

    const loadPauta = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Buscar dados da pauta principal
        const { data: pauta, error: pautaError } = await supabase
          .from('pautas')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (pautaError) throw pautaError;
        if (!pauta) {
          setError('Pauta não encontrada');
          setIsLoading(false);
          return;
        }

        // 2. Buscar versões da pauta
        const { data: versoes, error: versoesError } = await supabase
          .from('pauta_versoes')
          .select('*')
          .eq('pauta_id', id)
          .order('numero_versao', { ascending: true });

        if (versoesError) throw versoesError;

        // 3. Para cada versão, buscar blocos
        const versoesCompletas: PautaVersao[] = [];

        for (const versao of versoes || []) {
          const { data: blocos, error: blocosError } = await supabase
            .from('blocos_material')
            .select('*')
            .eq('versao_id', versao.id)
            .order('ordem', { ascending: true });

          if (blocosError) throw blocosError;

          // 4. Para cada bloco, buscar itens
          const blocosCompletos: BlocoMaterial[] = [];

          for (const bloco of blocos || []) {
            const { data: itens, error: itensError } = await supabase
              .from('bloco_itens')
              .select('*')
              .eq('bloco_id', bloco.id)
              .order('ordem', { ascending: true });

            if (itensError) throw itensError;

            // 5. Para cada item, buscar arquivos
            const itensCompletos: BlocoItem[] = [];

            for (const item of itens || []) {
              const { data: arquivos, error: arquivosError } = await supabase
                .from('bloco_arquivos')
                .select('*')
                .eq('item_id', item.id);

              if (arquivosError) throw arquivosError;

              itensCompletos.push({
                id: item.id,
                titulo: item.titulo || '',
                assunto: '',
                texto_conteudo: item.texto_conteudo || '',
                legenda: '',
                hashtags: item.hashtags || '',
                arquivos: [],
                arquivosUrls: (arquivos || []).map(a => a.url),
                ordem: item.ordem
              });
            }

            blocosCompletos.push({
              id: bloco.id,
              tipo: bloco.tipo_material as any,
              status: bloco.status as any,
              itens: itensCompletos,
              ordem: bloco.ordem
            });
          }

          versoesCompletas.push({
            id: versao.id,
            numero: versao.numero_versao,
            ativa: versao.ativa,
            briefingUrl: versao.briefing_url || undefined,
            blocos: blocosCompletos,
            createdAt: versao.created_at
          });
        }

        // Se não há versões, criar uma versão vazia
        if (versoesCompletas.length === 0) {
          versoesCompletas.push({
            numero: 1,
            ativa: true,
            blocos: []
          });
        }

        // Encontrar versão ativa
        const versaoAtiva = versoesCompletas.find(v => v.ativa)?.numero || versoesCompletas[versoesCompletas.length - 1]?.numero || 1;

        // Montar formData completo
        const loadedFormData: PautaFormData = {
          titulo: pauta.titulo,
          cliente_id: pauta.cliente || '',
          data_prevista: pauta.data_prazo ? new Date(pauta.data_prazo).toISOString().split('T')[0] : '',
          tags: [],
          observacoes_internas: pauta.observacoes || '',
          legenda_final: pauta.legenda_final || '',
          hashtags_principais: pauta.hashtags_principais || [],
          versoes: versoesCompletas,
          versao_ativa: versaoAtiva,
          mirapauta_task_id: pauta.mirapauta_task_id || undefined
        };

        setFormData(loadedFormData);
      } catch (err: any) {
        console.error('Erro ao carregar pauta:', err);
        setError(err.message || 'Erro ao carregar pauta');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a pauta',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPauta();
  }, [id, toast]);

  return {
    formData,
    isLoading,
    error,
    pautaId: id || null
  };
};
