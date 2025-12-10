import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PautaFormData, BlocoMaterial, BlocoItem } from '@/types/pauta-form';
import { useClientes } from '@/hooks/useClientes';

export const usePautaSubmit = () => {
  const { toast } = useToast();
  const { clientes } = useClientes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalLink, setApprovalLink] = useState('');

  const uploadFile = async (file: File, itemId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${itemId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pauta-arquivos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('pauta-arquivos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const submitPauta = async (
    formData: PautaFormData,
    userId: string,
    status: 'rascunho' | 'aguardando_aprovacao' = 'aguardando_aprovacao'
  ) => {
    try {
      setIsSubmitting(true);

      // Buscar nome do cliente
      const clienteSelecionado = clientes.find(c => c.id === formData.cliente_id);
      const nomeCliente = clienteSelecionado?.nome || formData.cliente_id;

      // Criar pauta principal
      const { data: novaPauta, error: pautaError } = await supabase
        .from('pautas')
        .insert({
          titulo: formData.titulo,
          cliente: nomeCliente,
          data_prazo: formData.data_prevista || null,
          observacoes: formData.observacoes_internas || null,
          criado_por: userId,
          status,
          legenda_final: formData.legenda_final || null,
          hashtags_principais: formData.hashtags_principais.length > 0 
            ? formData.hashtags_principais 
            : null,
          descricao: `Pauta com ${formData.versoes[0]?.blocos.length || 0} blocos de material`
        })
        .select()
        .single();

      if (pautaError) throw pautaError;

      // Criar versões
      for (const versao of formData.versoes) {
        const { data: novaVersao, error: versaoError } = await supabase
          .from('pauta_versoes')
          .insert({
            pauta_id: novaPauta.id,
            numero_versao: versao.numero,
            ativa: versao.ativa,
            briefing_url: versao.briefingUrl || null
          })
          .select()
          .single();

        if (versaoError) throw versaoError;

        // Criar blocos de material
        for (const bloco of versao.blocos) {
          const { data: novoBloco, error: blocoError } = await supabase
            .from('blocos_material')
            .insert({
              versao_id: novaVersao.id,
              tipo_material: bloco.tipo,
              status: bloco.status,
              ordem: bloco.ordem
            })
            .select()
            .single();

          if (blocoError) throw blocoError;

          // Criar itens do bloco
          for (const item of bloco.itens) {
            const { data: novoItem, error: itemError } = await supabase
              .from('bloco_itens')
              .insert({
                bloco_id: novoBloco.id,
                titulo: item.titulo || null,
                texto_conteudo: item.texto_conteudo || null,
                hashtags: item.hashtags || null,
                ordem: item.ordem
              })
              .select()
              .single();

            if (itemError) throw itemError;

            // Upload de arquivos do item
            for (const arquivo of item.arquivos) {
              const url = await uploadFile(arquivo, novoItem.id);
              const tipo = arquivo.type.startsWith('image/')
                ? 'imagem'
                : arquivo.type.startsWith('video/')
                  ? 'video'
                  : 'documento';

              const { error: arquivoError } = await supabase
                .from('bloco_arquivos')
                .insert({
                  item_id: novoItem.id,
                  url,
                  tipo,
                  nome_arquivo: arquivo.name,
                  tamanho: arquivo.size
                });

              if (arquivoError) throw arquivoError;
            }
          }
        }
      }

      const linkAprovacao = `${window.location.origin}/pauta/${novaPauta.id}`;
      setApprovalLink(linkAprovacao);

      toast({
        title: status === 'rascunho' ? 'Rascunho salvo!' : 'Pauta criada com sucesso!',
        description: status === 'rascunho' 
          ? 'Você pode continuar editando depois.' 
          : 'Link de aprovação gerado.',
      });

      return novaPauta;
    } catch (error) {
      console.error('Erro ao criar pauta:', error);
      toast({
        title: 'Erro',
        description: `Erro ao criar pauta: ${error instanceof Error ? error.message : 'Tente novamente.'}`,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPauta,
    isSubmitting,
    approvalLink,
    setApprovalLink
  };
};
