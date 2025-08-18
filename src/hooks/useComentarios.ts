import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PendingPin } from '@/types/comentario';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export const useComentarios = (pautaId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [showAddComment, setShowAddComment] = useState(false);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);

  type ComentarioRow = Tables<'comentarios_pontuais'>;
  type ComentarioInsert = TablesInsert<'comentarios_pontuais'>;

  const addComentarioMutation = useMutation<
    ComentarioRow,
    Error,
    ComentarioInsert,
    { previous: ComentarioRow[] | undefined }
  >({
    mutationFn: async (comentario: ComentarioInsert) => {
      const { data, error } = await supabase
        .from('comentarios_pontuais')
        .insert(comentario)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (comentario: ComentarioInsert) => {
      await queryClient.cancelQueries({ queryKey: ['comentarios', pautaId] });
      const previous = queryClient.getQueryData<ComentarioRow[]>(['comentarios', pautaId]);
      // otimista
      queryClient.setQueryData<ComentarioRow[]>(['comentarios', pautaId], (old = []) => [
        {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolvido: false,
          data_resposta: null,
          respondido_por: null,
          resposta: null,
          // payload enviado pelo cliente
          arquivo_id: comentario.arquivo_id,
          comentario: comentario.comentario,
          pauta_id: comentario.pauta_id,
          x_coordenada: comentario.x_coordenada,
          y_coordenada: comentario.y_coordenada,
          criado_por: comentario.criado_por ?? null,
        },
        ...old,
      ]);
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<ComentarioRow[]>(['comentarios', pautaId], context.previous);
      }
      toast({
        title: 'Erro ao adicionar comentário',
        description: (error).message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      toast({ title: 'Comentário adicionado com sucesso!' });
      setNewComment('');
      setPendingPin(null);
      setShowAddComment(false);
    },
  });

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      console.log('Comentário vazio, não enviando');
      return;
    }

    console.log('Enviando comentário:', newComment);
    console.log('PendingPin:', pendingPin);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const comentario: ComentarioInsert = {
      pauta_id: pautaId,
      comentario: newComment,
      criado_por: user?.id ?? (null as string | null),
      // serão preenchidos abaixo
      arquivo_id: '' as string,
      x_coordenada: 0,
      y_coordenada: 0,
    };

    if (pendingPin) {
      comentario.arquivo_id = pendingPin.arquivoId;
      // Arredonda para inteiro (0-100) para compatibilidade com colunas inteiras
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
    // Calcula porcentagens e arredonda para inteiros
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    console.log('Posição calculada:', { x, y });

    setPendingPin({ x, y, arquivoId });
    setShowAddComment(true);
    console.log('Estado atualizado - showAddComment:', true);
  };

  const editComentarioMutation = useMutation<
    ComentarioRow,
    Error,
    { id: string; comentario: string },
    { previous: ComentarioRow[] | undefined }
  >({
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
    onMutate: async ({ id, comentario }: { id: string; comentario: string }) => {
      await queryClient.cancelQueries({ queryKey: ['comentarios', pautaId] });
      const previous = queryClient.getQueryData<ComentarioRow[]>(['comentarios', pautaId]);
      queryClient.setQueryData<ComentarioRow[]>(['comentarios', pautaId], (old = []) =>
        old.map((c) => (c.id === id ? { ...c, comentario } : c)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<ComentarioRow[]>(['comentarios', pautaId], context.previous);
      }
      toast({
        title: 'Erro ao atualizar comentário',
        description: (error).message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      toast({ title: 'Comentário atualizado com sucesso!' });
      setEditingComment(null);
    },
  });

  const deleteComentarioMutation = useMutation<
    void,
    Error,
    string,
    { previous: ComentarioRow[] | undefined }
  >({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comentarios_pontuais').delete().eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['comentarios', pautaId] });
      const previous = queryClient.getQueryData<ComentarioRow[]>(['comentarios', pautaId]);
      queryClient.setQueryData<ComentarioRow[]>(['comentarios', pautaId], (old = []) =>
        old.filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<ComentarioRow[]>(['comentarios', pautaId], context.previous);
      }
      toast({
        title: 'Erro ao excluir comentário',
        description: (error).message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', pautaId] });
      toast({ title: 'Comentário excluído com sucesso!' });
    },
  });

  const handleEditComment = (id: string, currentText: string) => {
    setEditingComment({ id, text: currentText });
  };

  const handleSaveEdit = () => {
    if (!editingComment || !editingComment.text.trim()) return;

    editComentarioMutation.mutate({
      id: editingComment.id,
      comentario: editingComment.text,
    });
  };

  const handleDeleteComment = (id: string) => {
    deleteComentarioMutation.mutate(id);
  };

  const cancelComment = () => {
    console.log('Cancelando comentário');
    setShowAddComment(false);
    setPendingPin(null);
    setNewComment('');
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
    cancelEdit,
  };
};
