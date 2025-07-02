import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PendingPin } from "@/types/comentario";

export const useComentarios = (pautaId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [showAddComment, setShowAddComment] = useState(false);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);

  const addComentarioMutation = useMutation({
    mutationFn: async (comentario: any) => {
      const { data, error } = await supabase
        .from('comentarios_pontuais')
        .insert(comentario)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      toast({ title: "Comentário adicionado com sucesso!" });
      setNewComment("");
      setPendingPin(null);
      setShowAddComment(false);
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao adicionar comentário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) {
      console.log('Comentário vazio, não enviando');
      return;
    }
    
    console.log('Enviando comentário:', newComment);
    console.log('PendingPin:', pendingPin);
    
    const comentario: any = {
      pauta_id: pautaId,
      comentario: newComment,
      criado_por: null
    };

    if (pendingPin) {
      comentario.arquivo_id = pendingPin.arquivoId;
      comentario.x_coordenada = Math.round(pendingPin.x);
      comentario.y_coordenada = Math.round(pendingPin.y);
      console.log('Comentário pontual:', comentario);
    } else {
      // Para comentários gerais, usar valores padrão
      comentario.arquivo_id = 'geral';
      comentario.x_coordenada = 0;
      comentario.y_coordenada = 0;
      console.log('Comentário geral:', comentario);
    }

    addComentarioMutation.mutate(comentario);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, arquivoId: string) => {
    e.preventDefault();
    console.log('Clique na imagem detectado:', arquivoId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    console.log('Posição calculada:', { x, y });
    
    setPendingPin({ x, y, arquivoId });
    setShowAddComment(true);
    console.log('Estado atualizado - showAddComment:', true);
  };

  const editComentarioMutation = useMutation({
    mutationFn: async ({ id, comentario }: { id: string; comentario: string }) => {
      const { data, error } = await supabase
        .from('comentarios_pontuais')
        .update({ comentario })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      toast({ title: "Comentário atualizado com sucesso!" });
      setEditingComment(null);
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar comentário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteComentarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comentarios_pontuais')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      toast({ title: "Comentário excluído com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir comentário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleEditComment = (id: string, currentText: string) => {
    setEditingComment({ id, text: currentText });
  };

  const handleSaveEdit = () => {
    if (!editingComment || !editingComment.text.trim()) return;
    
    editComentarioMutation.mutate({
      id: editingComment.id,
      comentario: editingComment.text
    });
  };

  const handleDeleteComment = (id: string) => {
    deleteComentarioMutation.mutate(id);
  };

  const cancelComment = () => {
    console.log('Cancelando comentário');
    setShowAddComment(false);
    setPendingPin(null);
    setNewComment("");
  };

  const cancelEdit = () => {
    setEditingComment(null);
  };

  return {
    newComment,
    setNewComment,
    showAddComment,
    setShowAddComment,
    pendingPin,
    editingComment,
    setEditingComment,
    addComentarioMutation,
    editComentarioMutation,
    deleteComentarioMutation,
    handleAddComment,
    handleImageClick,
    handleEditComment,
    handleSaveEdit,
    handleDeleteComment,
    cancelComment,
    cancelEdit
  };
};