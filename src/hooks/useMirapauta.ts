/**
 * Hook para integração com o sistema MiraPauta
 * Gerencia a busca e importação de pautas, clientes e usuários
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mirapautaClient, isMirapautaConfigured } from '@/integrations/mirapauta';
import { supabase } from '@/integrations/supabase/client';
import type {
  MirapautaCliente,
  MirapautaProfile,
  MirapautaPautaWithCliente,
} from '@/integrations/mirapauta';
import { toast } from '@/hooks/use-toast';

/**
 * Buscar clientes do MiraPauta
 */
export const useMirapautaClientes = () => {
  return useQuery({
    queryKey: ['mirapauta', 'clientes'],
    queryFn: async () => {
      if (!mirapautaClient) {
        throw new Error('MiraPauta não está configurado');
      }

      console.log('[MiraPauta] Buscando clientes...');
      const { data, error } = await mirapautaClient.from('clientes').select('*').order('nome');

      if (error) {
        console.error('[MiraPauta] Erro ao buscar clientes:', error);
        throw error;
      }
      console.log('[MiraPauta] Clientes encontrados:', data?.length);
      return data as MirapautaCliente[];
    },
    enabled: isMirapautaConfigured(),
  });
};

/**
 * Buscar pautas do MiraPauta
 */
export const useMirapautaPautas = () => {
  return useQuery({
    queryKey: ['mirapauta', 'pautas'],
    queryFn: async () => {
      if (!mirapautaClient) {
        throw new Error('MiraPauta não está configurado');
      }

      console.log('[MiraPauta] Buscando pautas...');
      const { data, error } = await mirapautaClient
        .from('pautas')
        .select(
          `
          *,
          clientes (
            id,
            nome
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MiraPauta] Erro ao buscar pautas:', error);
        throw error;
      }
      console.log('[MiraPauta] Pautas encontradas:', data?.length);
      return data as MirapautaPautaWithCliente[];
    },
    enabled: isMirapautaConfigured(),
  });
};

/**
 * Buscar usuários/profiles do MiraPauta
 */
export const useMirapautaProfiles = () => {
  return useQuery({
    queryKey: ['mirapauta', 'profiles'],
    queryFn: async () => {
      if (!mirapautaClient) {
        throw new Error('MiraPauta não está configurado');
      }

      console.log('[MiraPauta] Buscando profiles...');
      const { data, error } = await mirapautaClient.from('profiles').select('*').order('nome');

      if (error) {
        console.error('[MiraPauta] Erro ao buscar profiles:', error);
        throw error;
      }
      console.log('[MiraPauta] Profiles encontrados:', data?.length);
      return data as MirapautaProfile[];
    },
    enabled: isMirapautaConfigured(),
  });
};

/**
 * Importar clientes do MiraPauta para o AprovaArte
 */
export const useImportClientes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientes: MirapautaCliente[]) => {
      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const cliente of clientes) {
        // Verificar se cliente já existe (pelo nome)
        const { data: existing } = await supabase
          .from('clientes')
          .select('id')
          .eq('nome', cliente.nome)
          .single();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Inserir novo cliente
        const { error } = await supabase.from('clientes').insert({
          nome: cliente.nome,
          ativo: true,
        });

        if (error) {
          results.errors.push(`Erro ao importar ${cliente.nome}: ${error.message}`);
        } else {
          results.imported++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });

      if (results.imported > 0) {
        toast({
          title: 'Clientes importados!',
          description: `${results.imported} cliente(s) importado(s), ${results.skipped} já existente(s).`,
        });
      } else if (results.skipped > 0) {
        toast({
          title: 'Nenhum cliente novo',
          description: `Todos os ${results.skipped} cliente(s) já existem no sistema.`,
        });
      }

      if (results.errors.length > 0) {
        toast({
          title: 'Alguns erros ocorreram',
          description: results.errors.join('\n'),
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao importar clientes',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Importar pautas do MiraPauta para o AprovaArte
 */
export const useImportPautas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pautas: MirapautaPautaWithCliente[]) => {
      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const pauta of pautas) {
        // Primeiro, garantir que o cliente existe no AprovaArte
        if (pauta.clientes) {
          // Verificar se cliente já existe
          const { data: existingCliente } = await supabase
            .from('clientes')
            .select('id')
            .eq('nome', pauta.clientes.nome)
            .single();

          if (!existingCliente) {
            // Criar cliente
            const { error: clienteError } = await supabase
              .from('clientes')
              .insert({
                nome: pauta.clientes.nome,
                ativo: true,
              })
              .select('id')
              .single();

            if (clienteError) {
              results.errors.push(
                `Erro ao criar cliente ${pauta.clientes.nome}: ${clienteError.message}`,
              );
              continue;
            }
          }
        }

        // Mapear status do MiraPauta para AprovaArte
        let status: 'rascunho' | 'aguardando_aprovacao' | 'aprovada' | 'rejeitada' =
          'aguardando_aprovacao';

        if (
          pauta.pauta_aprovada_status === 'concluido' ||
          pauta.pauta_aprovada_status === 'aprovado'
        ) {
          status = 'aprovada';
        } else if (pauta.revisao_cliente_status === 'rejeitado') {
          status = 'rejeitada';
        } else if (pauta.briefing_status === 'pendente' || !pauta.layout_status) {
          status = 'rascunho';
        }

        // Criar título baseado no cliente e data
        const titulo = pauta.clientes
          ? `Pauta ${pauta.clientes.nome} - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`
          : `Pauta Importada - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`;

        // Inserir pauta no AprovaArte
        const { error } = await supabase.from('pautas').insert({
          titulo,
          cliente: pauta.clientes?.nome || 'Cliente não definido',
          status,
          mirapauta_id: pauta.id, // Referência ao ID original
        });

        if (error) {
          if (error.code === '23505') {
            // Unique violation - já existe
            results.skipped++;
          } else {
            results.errors.push(`Erro ao importar pauta: ${error.message}`);
          }
        } else {
          results.imported++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });

      if (results.imported > 0) {
        toast({
          title: 'Pautas importadas!',
          description: `${results.imported} pauta(s) importada(s), ${results.skipped} já existente(s).`,
        });
      } else if (results.skipped > 0) {
        toast({
          title: 'Nenhuma pauta nova',
          description: `Todas as ${results.skipped} pauta(s) já existem no sistema.`,
        });
      }

      if (results.errors.length > 0) {
        toast({
          title: 'Alguns erros ocorreram',
          description: results.errors.slice(0, 3).join('\n'),
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao importar pautas',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook principal da integração
 */
export const useMirapautaIntegration = () => {
  const isConfigured = isMirapautaConfigured();
  const clientes = useMirapautaClientes();
  const pautas = useMirapautaPautas();
  const profiles = useMirapautaProfiles();
  const importClientes = useImportClientes();
  const importPautas = useImportPautas();

  return {
    isConfigured,
    clientes,
    pautas,
    profiles,
    importClientes,
    importPautas,
  };
};
