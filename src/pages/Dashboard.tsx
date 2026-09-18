import React from 'react';
import { Layout } from '@/components/Layout';
import { PautaCard } from '@/components/PautaCard';
import { usePautas } from '@/hooks/usePautas';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Plus,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  LayoutGrid,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { pautas, isLoading, error, deletePauta, isDeleting } = usePautas();

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!pautas) return { total: 0, aguardando: 0, aprovadas: 0, rejeitadas: 0 };
    return {
      total: pautas.length,
      aguardando: pautas.filter((p) => p.status === 'aguardando_aprovacao').length,
      aprovadas: pautas.filter((p) => p.status === 'aprovada').length,
      rejeitadas: pautas.filter((p) => p.status === 'rejeitada').length,
    };
  }, [pautas]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <FileCheck2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">AprovaArte</h1>
            <p className="text-muted-foreground mt-2">Faça login para acessar o sistema</p>
          </div>
          <Link to="/auth">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground font-medium">Erro ao carregar pautas</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
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
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas pautas de aprovação</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/criar-pauta">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Pauta
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <FileCheck2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Pautas</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.aguardando}</p>
                <p className="text-sm text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.aprovadas}</p>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center shadow-md">
                <XCircle className="w-6 h-6 text-destructive-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.rejeitadas}</p>
                <p className="text-sm text-muted-foreground">Rejeitadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar pautas..." className="pl-10 bg-card" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" size="icon">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Pautas Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : pautas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-card border flex items-center justify-center">
              <FileCheck2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium text-lg">Nenhuma pauta encontrada</p>
              <p className="text-muted-foreground mt-1">Crie sua primeira pauta para começar</p>
            </div>
            <Link to="/criar-pauta">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira pauta
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pautas.map((pauta) => (
              <PautaCard
                key={pauta.id}
                pauta={{
                  id: pauta.id,
                  titulo: pauta.titulo,
                  cliente: pauta.cliente,
                  status: pauta.status,
                  prazo: pauta.data_prazo || '',
                  imagens: [],
                }}
                onDelete={() => deletePauta(pauta.id)}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
