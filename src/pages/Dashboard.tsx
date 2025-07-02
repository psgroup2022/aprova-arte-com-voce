import React from "react";
import { Layout } from "@/components/Layout";
import { PautaCard } from "@/components/PautaCard";
import { usePautas } from "@/hooks/usePautas";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { pautas, isLoading, error, deletePauta, isDeleting } = usePautas();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">ApprovalHub</h1>
          <p className="text-muted-foreground">Faça login para acessar o sistema</p>
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
        <div className="text-center space-y-4">
          <p className="text-destructive">Erro ao carregar pautas</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas pautas de aprovação
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Olá, {user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : pautas.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">Nenhuma pauta encontrada</p>
            <Link to="/criar-pauta">
              <Button>Criar primeira pauta</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pautas.map((pauta) => (
              <PautaCard 
                key={pauta.id} 
                pauta={{
                  id: pauta.id,
                  titulo: pauta.titulo,
                  cliente: pauta.cliente,
                  status: pauta.status,
                  prazo: pauta.data_prazo || '',
                  imagens: [] // Será implementado com os arquivos
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