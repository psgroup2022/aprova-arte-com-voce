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

      // Mapear clientes e profiles por ID
      const clientesMap = new Map<string, MirapautaCliente>();
      if (clientes) {
        clientes.forEach((cliente) => {
          clientesMap.set(cliente.id, cliente as MirapautaCliente);
        });
      }

      const profilesMap = new Map<string, MirapautaProfile>();
      if (profiles) {
        profiles.forEach((profile) => {
          profilesMap.set(profile.id, profile as MirapautaProfile);
        });
      }

      // Combinar tasks com clientes e profiles
      const tasksWithData = (tasks || []).map((task) => {
        const typedTask = task as MirapautaTask;
        return {
          ...typedTask,
          cliente: typedTask.cliente_id ? clientesMap.get(typedTask.cliente_id) || null : null,
          responsavel: typedTask.assignee ? profilesMap.get(typedTask.assignee) || null : null,
        };
      });

      console.log('[MiraPauta] Tasks encontradas:', tasksWithData.length);
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
 * Importar pautas do MiraPauta para o AprovaArte
 */
export const useImportPautas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pautas: MirapautaPautaWithCliente[]) => {
      if (!mirapautaClient) {
        throw new Error('MiraPauta não está configurado');
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      // Buscar todas as tasks do MiraPauta de uma vez
      const { data: allTasks, error: tasksError } = await mirapautaClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('[MiraPauta] Erro ao buscar tasks:', tasksError);
        results.errors.push(`Erro ao buscar tasks: ${tasksError.message}`);
      }

      // Buscar todos os profiles para mapear assignees
      const { data: allProfiles, error: profilesError } = await mirapautaClient
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('[MiraPauta] Erro ao buscar profiles:', profilesError);
      }

      // Criar mapa de profiles por ID
      const profilesMap = new Map<string, MirapautaProfile>();
      if (allProfiles) {
        allProfiles.forEach((profile) => {
          profilesMap.set(profile.id, profile as MirapautaProfile);
        });
      }

      // Criar mapa de tasks por cliente_id
      const tasksByCliente = new Map<string, MirapautaTask[]>();
      if (allTasks) {
        (allTasks as MirapautaTask[]).forEach((task) => {
          if (task.cliente_id) {
            if (!tasksByCliente.has(task.cliente_id)) {
              tasksByCliente.set(task.cliente_id, []);
            }
            tasksByCliente.get(task.cliente_id)?.push(task);
          }
        });
      }

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

        // Buscar tasks relacionadas a esta pauta (pelo cliente_id)
        const tasks = pauta.cliente_id ? tasksByCliente.get(pauta.cliente_id) || [] : [];

        // Se houver tasks, importar cada uma como uma pauta separada
        // Caso contrário, importar apenas a pauta básica
        if (tasks.length > 0) {
          for (const task of tasks) {
            // Buscar nome do assignee
            const assigneeName = task.assignee ? profilesMap.get(task.assignee)?.nome : null;

            // Criar título combinando cliente, task title e data
            const titulo =
              task.title ||
              (pauta.clientes
                ? `Pauta ${pauta.clientes.nome} - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`
                : `Pauta Importada - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`);

            // Preparar dados para inserção
            const insertData = {
              titulo,
              cliente: pauta.clientes?.nome || 'Cliente não definido',
              status,
              mirapauta_id: pauta.id,
              origem: 'mirapauta' as const,
              // Dados da task
              mirapauta_task_title: task.title,
              mirapauta_descricao: task.description,
              mirapauta_ticket: task.ticket_number,
              mirapauta_assignee_id: task.assignee,
              mirapauta_assignee_nome: assigneeName,
              mirapauta_prazo_entrega: task.prazo_entrega,
              mirapauta_data_inicio: task.data_inicio,
              mirapauta_task_status: task.status,
              mirapauta_peso: task.peso,
              mirapauta_tempo_gasto: task.tempo_gasto,
              // Usar prazo da task como data_prazo se disponível
              data_prazo: task.prazo_entrega,
              // Usar descrição da task como descricao se disponível
              descricao: task.description,
            };

            // Inserir pauta no AprovaArte
            const { error } = await supabase.from('pautas').insert(insertData);

            if (error) {
              if (error.code === '23505') {
                // Unique violation - já existe
                results.skipped++;
              } else {
                results.errors.push(
                  `Erro ao importar task ${task.ticket_number || task.title}: ${error.message}`,
                );
              }
            } else {
              results.imported++;
            }
          }
        } else {
          // Importar pauta sem task associada
          const titulo = pauta.clientes
            ? `Pauta ${pauta.clientes.nome} - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`
            : `Pauta Importada - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`;

          const { error } = await supabase.from('pautas').insert({
            titulo,
            cliente: pauta.clientes?.nome || 'Cliente não definido',
            status,
            mirapauta_id: pauta.id,
            origem: 'mirapauta' as const,
          });

          if (error) {
            if (error.code === '23505') {
              results.skipped++;
            } else {
              results.errors.push(`Erro ao importar pauta: ${error.message}`);
            }
          } else {
            results.imported++;
          }
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
  const tasks = useMirapautaTasks();
  const profiles = useMirapautaProfiles();
  const importClientes = useImportClientes();
  const importPautas = useImportPautas();

  return {
    isConfigured,
    clientes,
    pautas,
    tasks,
    profiles,
    importClientes,
    importPautas,
  };
};
