import React from 'react';
import { Layout } from '@/components/Layout';
import { Users, RefreshCw, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMirapautaIntegration, LocalProfile } from '@/hooks/useMirapauta';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const Equipe = () => {
  const { isConfigured, localProfiles, syncProfiles } = useMirapautaIntegration();
  const isSyncing = syncProfiles.isPending;
  const isLoading = localProfiles.isLoading;

  const handleSync = () => {
    syncProfiles.mutate();
  };

  const teamMembers: LocalProfile[] = localProfiles.data || [];
  const activeMembers = teamMembers.filter((m) => m.ativo);

  // Função para extrair iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Equipe</h1>
            <p className="text-muted-foreground">Membros sincronizados do MiraPauta</p>
          </div>
          <Button onClick={handleSync} disabled={!isConfigured || isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>

        {!isConfigured && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Integração não configurada</AlertTitle>
            <AlertDescription>
              Configure a integração com MiraPauta nas Configurações para visualizar sua equipe.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMembers.length}</div>
              <p className="text-xs text-muted-foreground">Membros ativos do MiraPauta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">Total no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length - activeMembers.length}</div>
              <p className="text-xs text-muted-foreground">Desativados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
            <CardDescription>Usuários sincronizados do MiraPauta</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sincronize os usuários do MiraPauta para visualizar sua equipe
                </p>
                <Button onClick={handleSync} disabled={!isConfigured || isSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar Agora
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar_url || undefined} alt={member.nome} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(member.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{member.nome}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {member.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                          {member.mirapauta_profile_id && (
                            <div className="text-xs">
                              ID: {member.mirapauta_profile_id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge
                        variant={member.ativo ? 'default' : 'secondary'}
                        className={member.ativo ? 'bg-success' : ''}
                      >
                        {member.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {member.sincronizado_em && (
                        <div className="text-xs text-muted-foreground">
                          Sync: {new Date(member.sincronizado_em).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
