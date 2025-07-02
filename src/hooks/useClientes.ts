import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cliente, CreateClienteData, UpdateClienteData } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const useClientes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchClientes = async (): Promise<Cliente[]> => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  };

  const createCliente = async (clienteData: CreateClienteData): Promise<Cliente> => {
    const { data, error } = await supabase
      .from('clientes')
      .insert(clienteData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const updateCliente = async ({ id, ...updateData }: UpdateClienteData & { id: string }): Promise<Cliente> => {
    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const deleteCliente = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  };

  const {
    data: clientes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
  });

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
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
    mutationFn: updateCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
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
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
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
    clientes,
    isLoading,
    error,
    refetch,
    createCliente: createMutation.mutate,
    updateCliente: updateMutation.mutate,
    deleteCliente: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};