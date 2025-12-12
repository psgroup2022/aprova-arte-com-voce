import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PautaFormData, BlocoMaterial, BlocoItem } from '@/types/pauta-form';
import { useToast } from '@/hooks/use-toast';

interface UsePautaUpdateReturn {
  updatePauta: (pautaId: string, formData: PautaFormData, userId: string, status: 'rascunho' | 'aguardando_aprovacao') => Promise<string>;
  isUpdating: boolean;
  approvalLink: string | null;
  setApprovalLink: (link: string | null) => void;
}

export const usePautaUpdate = (): UsePautaUpdateReturn => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [approvalLink, setApprovalLink] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, pautaId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pautaId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pauta-arquivos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('pauta-arquivos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const updatePauta = async (
    pautaId: string,
    formData: PautaFormData,
    userId: string,
    status: 'rascunho' | 'aguardando_aprovacao'
  ): Promise<string> => {
    setIsUpdating(true);

    try {
      // 1. Atualizar dados da pauta principal
      const { error: pautaError } = await supabase
        .from('pautas')
        .update({
          titulo: formData.titulo,
          cliente: formData.cliente_id,
          data_prazo: formData.data_prevista || null,
          observacoes: formData.observacoes_internas,
          legenda_final: formData.legenda_final,
          hashtags_principais: formData.hashtags_principais,
          status,
          mirapauta_task_id: formData.mirapauta_task_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pautaId);

      if (pautaError) throw pautaError;

      // 2. Atualizar/criar versões
      for (const versao of formData.versoes) {
        let versaoId = versao.id;

        if (versaoId) {
          // Atualizar versão existente
          const { error: versaoError } = await supabase
            .from('pauta_versoes')
            .update({
              ativa: versao.ativa,
              briefing_url: versao.briefingUrl || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', versaoId);

          if (versaoError) throw versaoError;
        } else {
          // Criar nova versão
          const { data: novaVersao, error: versaoError } = await supabase
            .from('pauta_versoes')
            .insert({
              pauta_id: pautaId,
              numero_versao: versao.numero,
              ativa: versao.ativa,
              briefing_url: versao.briefingUrl || null
            })
            .select()
            .single();

          if (versaoError) throw versaoError;
          versaoId = novaVersao.id;
        }

        // 3. Atualizar/criar blocos
        for (const bloco of versao.blocos) {
          let blocoId = bloco.id;

          if (blocoId) {
            // Atualizar bloco existente
            const { error: blocoError } = await supabase
              .from('blocos_material')
              .update({
                tipo_material: bloco.tipo,
                status: bloco.status,
                ordem: bloco.ordem,
                updated_at: new Date().toISOString()
              })
              .eq('id', blocoId);

            if (blocoError) throw blocoError;
          } else {
            // Criar novo bloco
            const { data: novoBloco, error: blocoError } = await supabase
              .from('blocos_material')
              .insert({
                versao_id: versaoId,
                tipo_material: bloco.tipo,
                status: bloco.status,
                ordem: bloco.ordem
              })
              .select()
              .single();

            if (blocoError) throw blocoError;
            blocoId = novoBloco.id;
          }

          // 4. Atualizar/criar itens
          for (const item of bloco.itens) {
            let itemId = item.id;

            if (itemId) {
              // Atualizar item existente
              const { error: itemError } = await supabase
                .from('bloco_itens')
                .update({
                  titulo: item.titulo || null,
                  texto_conteudo: item.texto_conteudo || null,
                  hashtags: item.hashtags || null,
                  ordem: item.ordem,
                  updated_at: new Date().toISOString()
                })
                .eq('id', itemId);

              if (itemError) throw itemError;
            } else {
              // Criar novo item
              const { data: novoItem, error: itemError } = await supabase
                .from('bloco_itens')
                .insert({
                  bloco_id: blocoId,
                  titulo: item.titulo || null,
                  texto_conteudo: item.texto_conteudo || null,
                  hashtags: item.hashtags || null,
                  ordem: item.ordem
                })
                .select()
                .single();

              if (itemError) throw itemError;
              itemId = novoItem.id;
            }

            // 5. Upload de novos arquivos
            for (const arquivo of item.arquivos) {
              const url = await uploadFile(arquivo, pautaId);
              const tipo = arquivo.type.startsWith('video/') ? 'video' : 'imagem';

              const { error: arquivoError } = await supabase
                .from('bloco_arquivos')
                .insert({
                  item_id: itemId,
                  nome_arquivo: arquivo.name,
                  url,
                  tipo,
                  tamanho: arquivo.size
                });

              if (arquivoError) throw arquivoError;
            }
          }
        }
      }

      // Gerar link de aprovação se enviado para aprovação
      if (status === 'aguardando_aprovacao') {
        const link = `${window.location.origin}/pauta/${pautaId}`;
        setApprovalLink(link);
      }

      toast({
        title: 'Sucesso!',
        description: status === 'aguardando_aprovacao' 
          ? 'Pauta atualizada e enviada para aprovação' 
          : 'Pauta salva como rascunho'
      });

      return pautaId;
    } catch (error: any) {
      console.error('Erro ao atualizar pauta:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a pauta',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePauta,
    isUpdating,
    approvalLink,
    setApprovalLink
  };
};
