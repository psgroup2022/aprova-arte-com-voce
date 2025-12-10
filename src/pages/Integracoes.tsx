import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useMirapautaIntegration, useMirapautaTasks } from '@/hooks/useMirapauta';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Download,
  AlertCircle,
  Users,
  FileText,
  Building2,
  Link2,
  Link2Off,
  Loader2,
  ArrowRight,
  Calendar,
  Clock,
  ListTodo,
  User,
  Hash,
  Weight,
} from 'lucide-react';
import type { MirapautaPautaWithCliente, MirapautaTask, MirapautaCliente, MirapautaProfile } from '@/integrations/mirapauta';

type TaskWithData = MirapautaTask & {
  cliente: MirapautaCliente | null;
  responsavel: MirapautaProfile | null;
};

// Componente de abas por usuário
const UserTasksTabs = ({
  tasks,
  selectedTasks,
  toggleTask,
  getTaskStatusDisplay,
}: {
  tasks: TaskWithData[];
  selectedTasks: Set<string>;
  toggleTask: (id: string) => void;
  getTaskStatusDisplay: (status: string | null) => { label: string; className: string };
}) => {
  // Agrupar tasks por responsável (usando profiles do MiraPauta diretamente das tasks)
  const tasksByUser = React.useMemo(() => {
    const grouped: Record<string, { profile: MirapautaProfile | null; tasks: TaskWithData[] }> = {};
    
    // Adicionar grupo para tarefas sem responsável
    grouped['sem-responsavel'] = { profile: null, tasks: [] };
    
    // Distribuir tasks pelos grupos usando o responsavel (MirapautaProfile) da task
    tasks.forEach((task) => {
      const profile = task.responsavel;
      
      if (profile) {
        if (!grouped[profile.id]) {
          grouped[profile.id] = { profile, tasks: [] };
        }
        grouped[profile.id].tasks.push(task);
      } else {
        grouped['sem-responsavel'].tasks.push(task);
      }
    });
    
    // Filtrar grupos vazios e ordenar por nome
    return Object.entries(grouped)
      .filter(([_, { tasks }]) => tasks.length > 0)
      .sort((a, b) => {
        if (a[0] === 'sem-responsavel') return 1;
        if (b[0] === 'sem-responsavel') return -1;
        const nameA = a[1].profile?.nome || a[1].profile?.email || '';
        const nameB = b[1].profile?.nome || b[1].profile?.email || '';
        return nameA.localeCompare(nameB);
      });
  }, [tasks]);

  const defaultTab = tasksByUser[0]?.[0] || 'sem-responsavel';

  if (tasksByUser.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ListTodo className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600">Nenhuma tarefa encontrada</p>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList className="bg-slate-100 p-1 flex-wrap h-auto gap-1">
        {tasksByUser.map(([key, { profile, tasks: userTasks }]) => (
          <TabsTrigger
            key={key}
            value={key}
            className="data-[state=active]:bg-white flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
              {profile?.nome?.charAt(0) || profile?.email?.charAt(0) || '?'}
            </div>
            <span className="max-w-[120px] truncate">
              {profile?.nome || profile?.email || 'Sem responsável'}
            </span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {userTasks.length}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {tasksByUser.map(([key, { tasks: userTasks }]) => (
        <TabsContent key={key} value={key} className="space-y-3">
          {userTasks.map((task) => {
            const status = getTaskStatusDisplay(task.status);
            return (
              <Card
                key={task.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTasks.has(task.id)
                    ? 'border-violet-300 bg-violet-50/50 ring-2 ring-violet-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="data-[state=checked]:bg-violet-600 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-medium text-slate-900">
                        {task.title || 'Sem título'}
                      </h3>
                      {task.ticket_number && (
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          <Hash className="w-3 h-3 mr-1" />
                          {task.ticket_number}
                        </Badge>
                      )}
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                      {task.cliente && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {task.cliente.nome}
                        </span>
                      )}
                      {task.prazo_entrega && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.prazo_entrega).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {task.peso && (
                        <span className="flex items-center gap-1">
                          <Weight className="w-3.5 h-3.5" />
                          Peso: {task.peso}
                        </span>
                      )}
                      {task.material_quantity && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {task.material_quantity} material(is)
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Tipo para profiles locais
interface LocalProfile {
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

export const Integracoes = () => {
  const { isConfigured, clientes, pautas, profiles, localProfiles, importClientes, importTasks, syncTasks } =
    useMirapautaIntegration();
  const tasks = useMirapautaTasks();

  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Toggle seleção de cliente
  const toggleCliente = (id: string) => {
    const newSelected = new Set(selectedClientes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClientes(newSelected);
  };

  // Toggle seleção de task
  const toggleTask = (id: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTasks(newSelected);
  };

  // Selecionar todos clientes
  const selectAllClientes = () => {
    if (clientes.data) {
      setSelectedClientes(new Set(clientes.data.map((c) => c.id)));
    }
  };

  // Selecionar todas tasks
  const selectAllTasks = () => {
    if (tasks.data) {
      setSelectedTasks(new Set(tasks.data.map((t) => t.id)));
    }
  };

  // Importar clientes selecionados
  const handleImportClientes = () => {
    if (clientes.data) {
      const clientesToImport = clientes.data.filter((c) => selectedClientes.has(c.id));
      importClientes.mutate(clientesToImport);
      setSelectedClientes(new Set());
    }
  };

  // Importar tasks selecionadas diretamente
  const handleImportTasks = () => {
    if (tasks.data) {
      const tasksToImport = tasks.data.filter((t) => selectedTasks.has(t.id));
      if (tasksToImport.length > 0) {
        importTasks.mutate(tasksToImport);
      }
      setSelectedTasks(new Set());
    }
  };

  // Mapear status da task para exibição
  const getTaskStatusDisplay = (status: string | null) => {
    switch (status) {
      case 'concluido':
      case 'done':
        return { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'em_andamento':
      case 'in_progress':
        return { label: 'Em Andamento', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'pendente':
      case 'todo':
        return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'cancelado':
        return { label: 'Cancelado', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status || 'Sem status', className: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  if (!isConfigured) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Integrações</h1>
            <p className="text-slate-500 mt-1">Conecte com outros sistemas</p>
          </div>

          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Link2Off className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">MiraPauta não configurado</h2>
                <p className="text-slate-500 mt-2 max-w-md">
                  Para integrar com o MiraPauta, adicione as variáveis de ambiente:
                </p>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 text-left w-full max-w-lg">
                <code className="text-sm text-emerald-400">
                  VITE_MIRAPAUTA_SUPABASE_URL=https://xxx.supabase.co
                  <br />
                  VITE_MIRAPAUTA_SUPABASE_ANON_KEY=eyJhbG...
                </code>
              </div>
              <p className="text-sm text-slate-400">
                Reinicie o servidor de desenvolvimento após adicionar as variáveis.
              </p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Integrações</h1>
            <p className="text-slate-500 mt-1">Sincronize automaticamente tasks do MiraPauta</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => syncTasks.mutate()}
              disabled={syncTasks.isPending}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              {syncTasks.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sincronizar Agora
            </Button>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1"
            >
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              MiraPauta Conectado
            </Badge>
          </div>
        </div>

        {/* Info sobre sync automático */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Sincronização automática ativa</p>
              <p className="text-sm text-blue-700">Tasks do MiraPauta são sincronizadas automaticamente a cada 15 minutos</p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {clientes.isLoading ? '-' : clientes.data?.length || 0}
                </p>
                <p className="text-sm text-slate-500">Clientes no MiraPauta</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {pautas.isLoading ? '-' : pautas.data?.length || 0}
                </p>
                <p className="text-sm text-slate-500">Pautas no MiraPauta</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {profiles.isLoading ? '-' : profiles.data?.length || 0}
                </p>
                <p className="text-sm text-slate-500">Usuários no MiraPauta</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tarefas" className="space-y-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="tarefas" className="data-[state=active]:bg-white">
              <ListTodo className="w-4 h-4 mr-2" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="clientes" className="data-[state=active]:bg-white">
              <Building2 className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-white">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
          </TabsList>

          {/* Tarefas Tab */}
          <TabsContent value="tarefas" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => tasks.refetch()}
                  disabled={tasks.isFetching}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${tasks.isFetching ? 'animate-spin' : ''}`}
                  />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllTasks}
                  disabled={!tasks.data?.length}
                >
                  Selecionar Todas
                </Button>
              </div>
              <Button
                onClick={handleImportTasks}
                disabled={selectedTasks.size === 0 || importTasks.isPending}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {importTasks.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Importar {selectedTasks.size > 0 && `(${selectedTasks.size})`}
              </Button>
            </div>

            {tasks.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : tasks.error ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
                <p className="text-slate-600">Erro ao carregar tarefas do MiraPauta</p>
                <p className="text-sm text-slate-400 mt-1">{String(tasks.error)}</p>
              </Card>
            ) : tasks.data?.length === 0 ? (
              <Card className="p-8 text-center">
                <ListTodo className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">Nenhuma tarefa encontrada no MiraPauta</p>
              </Card>
            ) : (
              <UserTasksTabs
                tasks={tasks.data as TaskWithData[]}
                selectedTasks={selectedTasks}
                toggleTask={toggleTask}
                getTaskStatusDisplay={getTaskStatusDisplay}
              />
            )}
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clientes.refetch()}
                  disabled={clientes.isFetching}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${clientes.isFetching ? 'animate-spin' : ''}`}
                  />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllClientes}
                  disabled={!clientes.data?.length}
                >
                  Selecionar Todos
                </Button>
              </div>
              <Button
                onClick={handleImportClientes}
                disabled={selectedClientes.size === 0 || importClientes.isPending}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {importClientes.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Importar {selectedClientes.size > 0 && `(${selectedClientes.size})`}
              </Button>
            </div>

            {clientes.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : clientes.error ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
                <p className="text-slate-600">Erro ao carregar clientes do MiraPauta</p>
              </Card>
            ) : clientes.data?.length === 0 ? (
              <Card className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">Nenhum cliente encontrado no MiraPauta</p>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {clientes.data?.map((cliente) => (
                  <Card
                    key={cliente.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedClientes.has(cliente.id)
                        ? 'border-violet-300 bg-violet-50/50 ring-2 ring-violet-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => toggleCliente(cliente.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedClientes.has(cliente.id)}
                        onCheckedChange={() => toggleCliente(cliente.id)}
                        className="data-[state=checked]:bg-violet-600"
                      />
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{cliente.nome}</h3>
                        <p className="text-xs text-slate-500">
                          Desde {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Usuários Tab */}
          <TabsContent value="usuarios" className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => profiles.refetch()}
                disabled={profiles.isFetching}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${profiles.isFetching ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            </div>

            {profiles.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : profiles.error ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
                <p className="text-slate-600">Erro ao carregar usuários do MiraPauta</p>
              </Card>
            ) : profiles.data?.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">Nenhum usuário encontrado no MiraPauta</p>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {profiles.data?.map((profile) => (
                  <Card key={profile.id} className="p-4 border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {profile.nome?.charAt(0) || profile.email?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {profile.nome || 'Sem nome'}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                      </div>
                      <Badge variant="outline" className="bg-slate-50">
                        Visualizar
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Integracoes;
