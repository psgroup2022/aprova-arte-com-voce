import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pauta, CreatePautaData, UpdatePautaData } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const usePautas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchPautas = async (): Promise<Pauta[]> => {
    const { data, error } = await supabase
      .from('pautas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  };

  const createPauta = async (pautaData: CreatePautaData): Promise<Pauta> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('pautas')
      .insert({
        ...pautaData,
        criado_por: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const updatePauta = async ({ id, ...updateData }: UpdatePautaData & { id: string }): Promise<Pauta> => {
    const { data, error } = await supabase
      .from('pautas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const deletePauta = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('pautas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  };

  const {
    data: pautas = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pautas'],
    queryFn: fetchPautas,
  });

  const createMutation = useMutation({
    mutationFn: createPauta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      toast({
        title: "Sucesso",
        description: "Pauta criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePauta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      toast({
        title: "Sucesso",
        description: "Pauta atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePauta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      toast({
        title: "Sucesso",
        description: "Pauta excluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pautas,
    isLoading,
    error,
    refetch,
    createPauta: createMutation.mutate,
    updatePauta: updateMutation.mutate,
    deletePauta: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const usePauta = (id: string) => {
  const fetchPauta = async (): Promise<Pauta | null> => {
    const { data, error } = await supabase
      .from('pautas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  };

  return useQuery({
    queryKey: ['pauta', id],
    queryFn: fetchPauta,
    enabled: !!id,
  });
};