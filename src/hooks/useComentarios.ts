import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PendingPin } from '@/types/comentario';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';
import { handleMutationError } from '@/lib/errorHandler';
import { createComentarioSchema, updateComentarioSchema } from '@/lib/validation/schemas';
import { sanitizeText } from '@/utils/sanitize';

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
          arquivo_id: comentario.arquivo_id ?? null,
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
      handleMutationError(error, toast, { operation: 'addComentario', pautaId });
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
      logger.debug('Comentário vazio, não enviando');
      toast({
        title: 'Erro',
        description: 'Comentário não pode ser vazio',
        variant: 'destructive',
      });
      return;
    }

    logger.debug('Enviando comentário', { newComment, pendingPin });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sanitizar input antes de validar
    const sanitizedComment = sanitizeText(newComment);

    // Para comentários pontuais, arquivo_id vem do pendingPin
    // Para comentários gerais, arquivo_id é null
    const arquivoId = pendingPin?.arquivoId ?? null;

    const comentarioData = {
      pauta_id: pautaId,
      comentario: sanitizedComment,
      criado_por: user?.id ?? null,
      arquivo_id: arquivoId,
      x_coordenada: pendingPin ? Math.round(pendingPin.x) : 0,
      y_coordenada: pendingPin ? Math.round(pendingPin.y) : 0,
    };

    logger.debug(pendingPin ? 'Comentário pontual' : 'Comentário geral', comentarioData);

    // Validar com Zod antes de enviar
    try {
      const validatedData = createComentarioSchema.parse(comentarioData);
      addComentarioMutation.mutate(validatedData);
    } catch (error) {
      logger.error('Erro de validação no comentário', error as Error);
      toast({
        title: 'Erro de validação',
        description: 'Verifique os dados do comentário e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, arquivoId: string) => {
    e.preventDefault();
    logger.debug('Clique na imagem detectado', { arquivoId });

    const rect = e.currentTarget.getBoundingClientRect();
    // Calcula porcentagens e arredonda para inteiros
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    logger.debug('Posição calculada', { x, y, arquivoId });

    setPendingPin({ x, y, arquivoId });
    setShowAddComment(true);
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
      handleMutationError(error, toast, { operation: 'editComentario', pautaId });
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
      handleMutationError(error, toast, { operation: 'deleteComentario', pautaId });
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
    if (!editingComment || !editingComment.text.trim()) {
      toast({
        title: 'Erro',
        description: 'Comentário não pode ser vazio',
        variant: 'destructive',
      });
      return;
    }

    // Sanitizar e validar
    const sanitizedText = sanitizeText(editingComment.text);

    try {
      const validatedData = updateComentarioSchema.parse({
        comentario: sanitizedText,
      });

      editComentarioMutation.mutate({
        id: editingComment.id,
        comentario: validatedData.comentario,
      });
    } catch (error) {
      logger.error('Erro de validação ao editar comentário', error as Error);
      toast({
        title: 'Erro de validação',
        description: 'Comentário inválido',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = (id: string) => {
    deleteComentarioMutation.mutate(id);
  };

  const cancelComment = () => {
    logger.debug('Cancelando comentário');
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
