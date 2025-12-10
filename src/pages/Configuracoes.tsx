import React from 'react';
import { Layout } from '@/components/Layout';
import { User, Bell, Shield, Palette, Globe, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useMirapautaIntegration } from '@/hooks/useMirapauta';
import { Badge } from '@/components/ui/badge';

export const Configuracoes = () => {
  const { isConfigured, localProfiles, syncProfiles } = useMirapautaIntegration();
  const isSyncing = syncProfiles.isPending;

  const handleSyncProfiles = () => {
    syncProfiles.mutate();
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências e configurações do sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu de Configurações */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Segurança
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Palette className="h-4 w-4 mr-2" />
                  Aparência
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Integração
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Configurações Detalhadas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" defaultValue="João Silva" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="joao@agencia.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input id="empresa" defaultValue="AgencyMaker" />
                </div>
                <Button>Salvar Alterações</Button>
              </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">Receba atualizações por email</p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                  </div>
                  <Switch id="push-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="approval-notifications">Aprovações</Label>
                    <p className="text-sm text-muted-foreground">Quando pautas forem aprovadas</p>
                  </div>
                  <Switch id="approval-notifications" defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Alterar Senha</Button>
              </CardContent>
            </Card>

            {/* Aparência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tema Escuro</Label>
                    <p className="text-sm text-muted-foreground">Alternar para modo escuro</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div>
                  <Label>Idioma</Label>
                  <p className="text-sm text-muted-foreground">Português (Brasil)</p>
                </div>
              </CardContent>
            </Card>

            {/* Integração MiraPauta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Integração MiraPauta
                </CardTitle>
                <CardDescription>Sincronize usuários e dados do sistema MiraPauta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Status da Integração</Label>
                    {isConfigured ? (
                      <Badge variant="default" className="bg-green-500">
                        Configurado
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Não Configurado</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Label>Usuários Sincronizados</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {localProfiles.data?.length || 0} usuário(s) ativo(s) no sistema
                  </p>
                  <Button
                    onClick={handleSyncProfiles}
                    disabled={!isConfigured || isSyncing}
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Usuários'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Importa usuários do MiraPauta e desativa os que não existem mais lá
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Sobre a Sincronização</Label>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Importa novos usuários do MiraPauta</li>
                    <li>Atualiza informações de usuários existentes</li>
                    <li>Desativa usuários que não estão mais no MiraPauta</li>
                    <li>Mantém histórico de aprovações e pautas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
