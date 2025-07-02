import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAprovacao = (pautaId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApproval, setSelectedApproval] = useState<string>("");

  const updatePautaMutation = useMutation({
    mutationFn: async ({ status, comentario }: { status: string, comentario?: string }) => {
      const updateData: any = { status };
      
      if (status === 'aprovada') {
        updateData.aprovado_por = null; // Temporariamente null para testes
        updateData.data_aprovacao = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('pautas')
        .update(updateData)
        .eq('id', pautaId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Adicionar comentário de aprovação se houver
      if (comentario) {
        await supabase
          .from('comentarios_pontuais')
          .insert({
            pauta_id: pautaId,
            arquivo_id: 'geral',
            comentario,
            criado_por: null,
            x_coordenada: 0,
            y_coordenada: 0
          });
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pauta', pautaId] });
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      
      const statusText = data.status === 'aprovada' ? 'aprovada' : 
                        data.status === 'rejeitada' ? 'rejeitada' : 'aprovada com alterações';
      
      toast({ 
        title: `Pauta ${statusText} com sucesso!`,
        description: "O responsável foi notificado sobre sua decisão."
      });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar pauta", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleApprovalClick = (type: string) => {
    setSelectedApproval(type);
    
    let status = '';
    let comentario = '';
    
    switch(type) {
      case 'approved':
        status = 'aprovada';
        break;
      case 'approved-changes':
        status = 'aguardando_aprovacao'; // Continua aguardando até as alterações serem feitas
        comentario = 'Aprovado com alterações solicitadas nos comentários.';
        break;
      case 'rejected':
        status = 'rejeitada';
        comentario = 'Rejeitado. Por favor, verificar os comentários para mais detalhes.';
        break;
    }
    
    updatePautaMutation.mutate({ status, comentario });
  };

  return {
    selectedApproval,
    handleApprovalClick,
    updatePautaMutation
  };
};