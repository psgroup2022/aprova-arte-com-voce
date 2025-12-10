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
    // 1. Buscar arquivos da tabela pauta_arquivos
    const { data: pautaArquivos } = await supabase
      .from('pauta_arquivos')
      .select('url')
      .eq('pauta_id', id);

    // 2. Buscar arquivos dos blocos via versões
    const { data: versoes } = await supabase
      .from('pauta_versoes')
      .select('id')
      .eq('pauta_id', id);

    let blocoArquivosUrls: string[] = [];
    if (versoes && versoes.length > 0) {
      const versaoIds = versoes.map(v => v.id);
      
      const { data: blocos } = await supabase
        .from('blocos_material')
        .select('id')
        .in('versao_id', versaoIds);

      if (blocos && blocos.length > 0) {
        const blocoIds = blocos.map(b => b.id);
        
        const { data: itens } = await supabase
          .from('bloco_itens')
          .select('id')
          .in('bloco_id', blocoIds);

        if (itens && itens.length > 0) {
          const itemIds = itens.map(i => i.id);
          
          const { data: blocoArquivos } = await supabase
            .from('bloco_arquivos')
            .select('url')
            .in('item_id', itemIds);

          if (blocoArquivos) {
            blocoArquivosUrls = blocoArquivos.map(a => a.url);
          }
        }
      }
    }

    // 3. Extrair paths e excluir do storage
    const allUrls = [
      ...(pautaArquivos?.map(a => a.url) || []),
      ...blocoArquivosUrls
    ];

    if (allUrls.length > 0) {
      const paths = allUrls
        .map(url => {
          // URL format: https://xxx.supabase.co/storage/v1/object/public/pauta-arquivos/path/to/file
          const match = url.match(/\/pauta-arquivos\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => path !== null);

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('pauta-arquivos')
          .remove(paths);

        if (storageError) {
          console.warn('Erro ao excluir arquivos do storage:', storageError);
        }
      }
    }

    // 4. Excluir a pauta (cascade cuida das relações)
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