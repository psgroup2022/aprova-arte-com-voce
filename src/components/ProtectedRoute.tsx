import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ProtectedRouteProps = {
  children: ReactNode;
  /**
   * Deixa passar quem ainda está com a senha inicial. Só a própria tela de troca
   * usa isto — sem ela, o redirecionamento apontaria para si mesmo.
   */
  permiteSenhaProvisoria?: boolean;
  /** Barra quem não é admin. A regra real está nas políticas do banco; isto é a
   * cortesia de não mostrar uma tela que não vai funcionar. */
  exigeAdmin?: boolean;
};

const Carregando = () => (
  <div className="min-h-screen p-6" role="status" aria-busy="true" data-testid="auth-loading">
    <div className="max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  </div>
);

const Barrado = ({
  titulo,
  descricao,
  testId,
}: {
  titulo: string;
  descricao: string;
  testId: string;
}) => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-testid={testId}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export const ProtectedRoute = ({
  children,
  permiteSenhaProvisoria = false,
  exigeAdmin = false,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { perfil, isAdmin, loading: carregandoPerfil } = useProfile();
  const location = useLocation();

  if (loading) return <Carregando />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;

  // Sem o perfil não dá para saber papel nem pendência de senha. Esperar é mais
  // seguro do que assumir um dos dois.
  if (carregandoPerfil) return <Carregando />;

  if (!perfil) {
    return (
      <Barrado
        testId="sem-perfil"
        titulo="Conta sem perfil"
        descricao="A conta existe, mas não está ligada a nenhum perfil da equipe. Peça a um administrador para incluir você."
      />
    );
  }

  if (!perfil.ativo) {
    return (
      <Barrado
        testId="perfil-inativo"
        titulo="Acesso desativado"
        descricao="Seu acesso está desativado. Procure um administrador da equipe."
      />
    );
  }

  if (perfil.senha_provisoria && !permiteSenhaProvisoria) {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (exigeAdmin && !isAdmin) {
    return (
      <Barrado
        testId="exige-admin"
        titulo="Só para administradores"
        descricao="Esta tela é restrita a quem administra a equipe."
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
