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
  MirapautaPauta,
  MirapautaPautaWithCliente,
  MirapautaTask,
} from '@/integrations/mirapauta';
import { toast } from '@/hooks/use-toast';

// Tipo local para profiles (enquanto types.ts não é regenerado)
export interface LocalProfile {
  id: string;
  nome: string;
  email: string | null;
  avatar_url: string | null;
  mirapauta_profile_id: string | null;
  ativo: boolean;
  sincronizado_em: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Buscar clientes do MiraPauta
 */
export const useMirapautaClientes = () => {
  const isConfigured = isMirapautaConfigured();
  console.log('[MiraPauta] useMirapautaClientes - isConfigured:', isConfigured);
  console.log(
    '[MiraPauta] useMirapautaClientes - mirapautaClient:',
    mirapautaClient ? 'exists' : 'null',
  );

  return useQuery({
    queryKey: ['mirapauta', 'clientes'],
    queryFn: async () => {
      if (!mirapautaClient) {
        console.error('[MiraPauta] Cliente não está configurado!');
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
    enabled: isConfigured,
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

      // Buscar pautas
      const { data: pautas, error: pautasError } = await mirapautaClient
        .from('pautas')
        .select('*')
        .order('created_at', { ascending: false });

      if (pautasError) {
        console.error('[MiraPauta] Erro ao buscar pautas:', pautasError);
        throw pautasError;
      }

      // Buscar clientes para enriquecer os dados
      const { data: clientes, error: clientesError } = await mirapautaClient
        .from('clientes')
        .select('*');

      if (clientesError) {
        console.error('[MiraPauta] Erro ao buscar clientes:', clientesError);
        // Continua mesmo sem clientes
      }

      // Mapear clientes por ID
      const clientesMap = new Map<string, MirapautaCliente>();
      if (clientes) {
        clientes.forEach((cliente) => {
          clientesMap.set(cliente.id, cliente as MirapautaCliente);
        });
      }

      // Combinar pautas com clientes
      const pautasWithClientes: MirapautaPautaWithCliente[] = (pautas || []).map((pauta) => ({
        ...(pauta as MirapautaPauta),
        clientes: pauta.cliente_id ? clientesMap.get(pauta.cliente_id) || null : null,
      }));

      console.log('[MiraPauta] Pautas encontradas:', pautasWithClientes.length);
      return pautasWithClientes;
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
 * Buscar tasks do MiraPauta com dados completos
 */
export const useMirapautaTasks = () => {
  return useQuery({
    queryKey: ['mirapauta', 'tasks'],
    queryFn: async () => {
      if (!mirapautaClient) {
        throw new Error('MiraPauta não está configurado');
      }

      console.log('[MiraPauta] Buscando tasks...');

      // Buscar tasks
      const { data: tasks, error: tasksError } = await mirapautaClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('[MiraPauta] Erro ao buscar tasks:', tasksError);
        throw tasksError;
      }

      console.log('[MiraPauta] Tasks brutas:', tasks?.length);
      if (tasks && tasks.length > 0) {
        console.log('[MiraPauta] Primeira task assignee:', tasks[0].assignee);
        console.log('[MiraPauta] Assignees únicos:', [...new Set(tasks.map((t) => (t as { assignee?: string }).assignee).filter(Boolean))]);
      }

      // Buscar clientes
      const { data: clientes, error: clientesError } = await mirapautaClient
        .from('clientes')
        .select('*');

      if (clientesError) {
        console.error('[MiraPauta] Erro ao buscar clientes:', clientesError);
      }

      // Buscar profiles
      const { data: profiles, error: profilesError } = await mirapautaClient
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('[MiraPauta] Erro ao buscar profiles:', profilesError);
      }

      console.log('[MiraPauta] Profiles encontrados:', profiles?.length);
      if (profiles && profiles.length > 0) {
        console.log('[MiraPauta] Profile nomes:', profiles.map((p) => (p as { nome?: string }).nome));
      }

      // Mapear clientes por ID
      const clientesMap = new Map<string, MirapautaCliente>();
      if (clientes) {
        clientes.forEach((cliente) => {
          clientesMap.set(cliente.id, cliente as MirapautaCliente);
        });
      }

      // Mapear profiles por NOME (assignee contém nome, não ID)
      const profilesByNameMap = new Map<string, MirapautaProfile>();
      if (profiles) {
        profiles.forEach((profile) => {
          const typedProfile = profile as MirapautaProfile;
          if (typedProfile.nome) {
            // Usar nome em lowercase para comparação case-insensitive
            profilesByNameMap.set(typedProfile.nome.toLowerCase().trim(), typedProfile);
          }
        });
      }

      // Combinar tasks com clientes e profiles
      const tasksWithData = (tasks || []).map((task) => {
        const typedTask = task as MirapautaTask;
        // Buscar responsável pelo NOME (assignee é o nome do usuário)
        const assigneeName = typedTask.assignee ? typedTask.assignee.toLowerCase().trim() : null;
        const responsavel = assigneeName ? profilesByNameMap.get(assigneeName) || null : null;
        
        if (typedTask.assignee && !responsavel) {
          console.warn(`[MiraPauta] Assignee "${typedTask.assignee}" não encontrado nos profiles. Nomes disponíveis:`, [...profilesByNameMap.keys()]);
        }
        
        return {
          ...typedTask,
          cliente: typedTask.cliente_id ? clientesMap.get(typedTask.cliente_id) || null : null,
          responsavel,
        };
      });

      const withResponsavel = tasksWithData.filter(t => t.responsavel);
      console.log('[MiraPauta] Tasks com responsável:', withResponsavel.length, 'de', tasksWithData.length);

      return tasksWithData;
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
 * Importar tasks do MiraPauta como pautas no AprovaArte
 */
export const useImportTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: (MirapautaTask & { cliente: MirapautaCliente | null; responsavel: MirapautaProfile | null })[]) => {
      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const task of tasks) {
        // Verificar se já foi importada (pelo mirapauta_task_id)
        const { data: existing } = await supabase
          .from('pautas')
          .select('id')
          .eq('mirapauta_task_id', task.id)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Garantir que o cliente existe no AprovaArte
        const clienteNome = task.cliente?.nome || 'Cliente não definido';
        
        if (task.cliente) {
          const { data: existingCliente } = await supabase
            .from('clientes')
            .select('id')
            .eq('nome', task.cliente.nome)
            .maybeSingle();

          if (!existingCliente) {
            const { error: clienteError } = await supabase
              .from('clientes')
              .insert({
                nome: task.cliente.nome,
                ativo: true,
              });

            if (clienteError) {
              console.warn(`[Import] Erro ao criar cliente ${task.cliente.nome}:`, clienteError);
            }
          }
        }

        // Criar título da pauta
        const titulo = task.title || `Pauta Importada - ${new Date().toLocaleDateString('pt-BR')}`;

        // Inserir pauta no AprovaArte usando apenas campos válidos
        const { error } = await supabase.from('pautas').insert({
          titulo,
          cliente: clienteNome,
          status: 'rascunho' as const,
          descricao: task.description || null,
          data_prazo: task.prazo_entrega || null,
          mirapauta_task_id: task.id,
          mirapauta_cliente_id: task.cliente_id || null,
          mirapauta_sincronizado_em: new Date().toISOString(),
          observacoes: task.ticket_number ? `Ticket: #${task.ticket_number}` : null,
        });

        if (error) {
          console.error('[Import] Erro ao importar task:', error);
          results.errors.push(`Erro ao importar "${task.title || 'task'}": ${error.message}`);
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
 * Sincronizar usuários do MiraPauta com o sistema AprovaArte
 * Esta função:
 * 1. Busca todos os profiles do MiraPauta
 * 2. Insere/atualiza na tabela profiles do AprovaArte
 * 3. Desativa profiles que não estão mais no MiraPauta
 */
export const useSyncProfiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!mirapautaClient) {
        throw new Error('MiraPauta não está configurado');
      }

      const results = {
        imported: 0,
        updated: 0,
        deactivated: 0,
        errors: [] as string[],
      };

      console.log('[MiraPauta] Sincronizando profiles...');

      // Buscar todos os profiles do MiraPauta
      const { data: mirapautaProfiles, error: mirapautaError } = await mirapautaClient
        .from('profiles')
        .select('*');

      if (mirapautaError) {
        console.error('[MiraPauta] Erro ao buscar profiles:', mirapautaError);
        throw mirapautaError;
      }

      if (!mirapautaProfiles || mirapautaProfiles.length === 0) {
        throw new Error('Nenhum profile encontrado no MiraPauta');
      }

      console.log(`[MiraPauta] ${mirapautaProfiles.length} profiles encontrados no MiraPauta`);

      // Buscar profiles existentes no AprovaArte
      const { data: existingProfiles, error: existingError } = await supabase
        .from('profiles' as any)
        .select('*') as { data: LocalProfile[] | null; error: any };

      if (existingError) {
        console.error('[AprovaArte] Erro ao buscar profiles existentes:', existingError);
        results.errors.push(`Erro ao buscar profiles existentes: ${existingError.message}`);
      }

      // Criar mapa de profiles existentes por mirapauta_profile_id
      const existingProfilesMap = new Map<string, { id: string; ativo: boolean }>();
      if (existingProfiles) {
        existingProfiles.forEach((profile: LocalProfile) => {
          if (profile.mirapauta_profile_id) {
            existingProfilesMap.set(profile.mirapauta_profile_id, {
              id: profile.id,
              ativo: profile.ativo,
            });
          }
        });
      }

      // IDs dos profiles do MiraPauta (para identificar quais desativar)
      const mirapautaProfileIds = new Set<string>();

      // Importar/atualizar profiles do MiraPauta
      for (const mirapautaProfile of mirapautaProfiles as MirapautaProfile[]) {
        mirapautaProfileIds.add(mirapautaProfile.id);

        const existingProfile = existingProfilesMap.get(mirapautaProfile.id);

        if (existingProfile) {
          // Atualizar profile existente
          const { error: updateError } = await supabase
            .from('profiles' as any)
            .update({
              email: mirapautaProfile.email,
              nome: mirapautaProfile.nome || 'Usuário sem nome',
              avatar_url: mirapautaProfile.avatar_url,
              ativo: true,
              sincronizado_em: new Date().toISOString(),
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            results.errors.push(
              `Erro ao atualizar profile ${mirapautaProfile.nome}: ${updateError.message}`,
            );
          } else {
            results.updated++;
            console.log(`[MiraPauta] Profile atualizado: ${mirapautaProfile.nome}`);
          }
        } else {
          // Criar novo profile
          const { error: insertError } = await supabase.from('profiles' as any).insert({
            mirapauta_profile_id: mirapautaProfile.id,
            email: mirapautaProfile.email,
            nome: mirapautaProfile.nome || 'Usuário sem nome',
            avatar_url: mirapautaProfile.avatar_url,
            ativo: true,
            sincronizado_em: new Date().toISOString(),
          });

          if (insertError) {
            results.errors.push(
              `Erro ao criar profile ${mirapautaProfile.nome}: ${insertError.message}`,
            );
          } else {
            results.imported++;
            console.log(`[MiraPauta] Profile criado: ${mirapautaProfile.nome}`);
          }
        }
      }

      // Desativar profiles que não estão mais no MiraPauta
      if (existingProfiles) {
        for (const existingProfile of existingProfiles as LocalProfile[]) {
          if (
            existingProfile.mirapauta_profile_id &&
            !mirapautaProfileIds.has(existingProfile.mirapauta_profile_id) &&
            existingProfile.ativo
          ) {
            const { error: deactivateError } = await supabase
              .from('profiles' as any)
              .update({
                ativo: false,
                sincronizado_em: new Date().toISOString(),
              })
              .eq('id', existingProfile.id);

            if (deactivateError) {
              results.errors.push(
                `Erro ao desativar profile ${existingProfile.nome}: ${deactivateError.message}`,
              );
            } else {
              results.deactivated++;
              console.log(`[MiraPauta] Profile desativado: ${existingProfile.nome}`);
            }
          }
        }
      }

      console.log('[MiraPauta] Sincronização concluída:', results);
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });

      const totalChanges = results.imported + results.updated + results.deactivated;

      if (totalChanges > 0) {
        const messages = [];
        if (results.imported > 0) messages.push(`${results.imported} importado(s)`);
        if (results.updated > 0) messages.push(`${results.updated} atualizado(s)`);
        if (results.deactivated > 0) messages.push(`${results.deactivated} desativado(s)`);

        toast({
          title: 'Usuários sincronizados!',
          description: messages.join(', '),
        });
      } else {
        toast({
          title: 'Sincronização concluída',
          description: 'Todos os usuários já estão atualizados.',
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
        title: 'Erro ao sincronizar usuários',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para buscar profiles do AprovaArte
 */
export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<LocalProfile[]> => {
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('ativo', true)
        .order('nome') as { data: LocalProfile[] | null; error: any };

      if (error) {
        console.error('[AprovaArte] Erro ao buscar profiles:', error);
        throw error;
      }

      return data || [];
    },
  });
};

/**
 * Hook para sincronização manual de tasks via edge function
 */
export const useSyncMirapautaTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[MiraPauta] Iniciando sincronização manual de tasks...');
      
      const { data, error } = await supabase.functions.invoke('sync-mirapauta', {
        body: {},
      });

      if (error) {
        console.error('[MiraPauta] Erro na sincronização:', error);
        throw new Error(error.message || 'Erro ao sincronizar');
      }

      console.log('[MiraPauta] Resultado da sincronização:', data);
      return data as { message?: string } | null;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      queryClient.invalidateQueries({ queryKey: ['mirapauta', 'tasks'] });

      toast({
        title: 'Sincronização concluída!',
        description: data?.message || 'Tasks sincronizadas com sucesso',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao sincronizar',
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
  const tasks = useMirapautaTasks();
  const profiles = useMirapautaProfiles();
  const localProfiles = useProfiles();
  const importClientes = useImportClientes();
  const importTasks = useImportTasks();
  const syncProfiles = useSyncProfiles();
  const syncTasks = useSyncMirapautaTasks();

  return {
    isConfigured,
    clientes,
    pautas,
    tasks,
    profiles,
    localProfiles,
    importClientes,
    importTasks,
    syncProfiles,
    syncTasks,
  };
};
