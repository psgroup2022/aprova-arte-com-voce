import React from 'react';
import { Layout } from '@/components/Layout';
import { Users, Mail, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, type Papel, PERFIL_QUERY_KEY } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface MembroDaEquipe {
  id: string;
  nome: string;
  email: string | null;
  avatar_url: string | null;
  papel: Papel;
  ativo: boolean;
  senha_provisoria: boolean;
}

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const Equipe = () => {
  const { perfil, isAdmin } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const equipe = useQuery({
    queryKey: ['equipe'],
    queryFn: async (): Promise<MembroDaEquipe[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, avatar_url, papel, ativo, senha_provisoria')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  /**
   * Grava papel ou situação de acesso.
   *
   * A tela esconde estes controles de quem não é admin, mas quem decide é o
   * banco: um gatilho recusa a alteração de `papel` e `ativo` por quem não
   * administra, e recusa deixar a equipe sem nenhum administrador. Por isso o
   * erro vindo do banco é mostrado como veio — ele é a regra, não um detalhe.
   */
  const alterar = useMutation({
    mutationFn: async ({ id, campos }: { id: string; campos: Partial<MembroDaEquipe> }) => {
      const { error } = await supabase.from('profiles').update(campos).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipe'] });
      // Se o admin mexeu na própria linha, o cabeçalho e os portões de rota
      // precisam reler o papel.
      queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
    },
    onError: (erro: Error) => {
      toast({ title: 'Não deu para alterar', description: erro.message, variant: 'destructive' });
      queryClient.invalidateQueries({ queryKey: ['equipe'] });
    },
  });

  const membros = equipe.data ?? [];
  const ativos = membros.filter((m) => m.ativo);
  const admins = ativos.filter((m) => m.papel === 'admin');
  const pendentes = ativos.filter((m) => m.senha_provisoria);

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Você administra quem entra e o que cada um pode fazer.'
              : 'Quem faz parte da equipe e o papel de cada um.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com acesso</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ativos.length}</div>
              <p className="text-xs text-muted-foreground">de {membros.length} cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
              <p className="text-xs text-muted-foreground">gerenciam a equipe</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nunca entraram</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendentes.length}</div>
              <p className="text-xs text-muted-foreground">ainda com a senha inicial</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
            <CardDescription>
              Contas novas são criadas pelo script de seed, no servidor. Aqui se ajusta papel e
              acesso de quem já existe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {equipe.isLoading ? (
              <div
                className="flex items-center justify-center py-8"
                data-testid="equipe-carregando"
              >
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : equipe.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Não consegui carregar a equipe: {equipe.error.message}
                </AlertDescription>
              </Alert>
            ) : membros.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum membro cadastrado</h3>
                <p className="text-sm text-muted-foreground">
                  Rode <code className="font-mono">npm run seed:usuarios</code> para criar as contas
                  da equipe.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {membros.map((membro) => {
                  const souEu = membro.id === perfil?.id;
                  const salvando = alterar.isPending && alterar.variables?.id === membro.id;

                  return (
                    <div
                      key={membro.id}
                      data-testid={`membro-${membro.id}`}
                      className={`flex flex-col gap-4 p-4 border rounded-lg md:flex-row md:items-center md:justify-between ${
                        membro.ativo ? '' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <Avatar className="w-12 h-12 shrink-0">
                          <AvatarImage src={membro.avatar_url || undefined} alt="" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {iniciais(membro.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">
                            {membro.nome}
                            {souEu && (
                              <span className="text-muted-foreground font-normal"> · você</span>
                            )}
                          </h3>
                          {membro.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 mr-1 shrink-0" />
                              <span className="truncate">{membro.email}</span>
                            </div>
                          )}
                          {membro.senha_provisoria && membro.ativo && (
                            <p className="text-xs text-warning-foreground mt-1">
                              ainda não trocou a senha inicial
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {salvando && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}

                        {isAdmin ? (
                          <>
                            <Select
                              value={membro.papel}
                              disabled={alterar.isPending}
                              onValueChange={(papel) =>
                                alterar.mutate({ id: membro.id, campos: { papel: papel as Papel } })
                              }
                            >
                              <SelectTrigger
                                className="w-36"
                                aria-label={`Papel de ${membro.nome}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="membro">Membro</SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2">
                              <Switch
                                id={`ativo-${membro.id}`}
                                checked={membro.ativo}
                                disabled={alterar.isPending}
                                onCheckedChange={(ativo) =>
                                  alterar.mutate({ id: membro.id, campos: { ativo } })
                                }
                              />
                              <Label
                                htmlFor={`ativo-${membro.id}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                acesso
                              </Label>
                            </div>
                          </>
                        ) : (
                          <>
                            <Badge variant={membro.papel === 'admin' ? 'default' : 'secondary'}>
                              {membro.papel === 'admin' ? 'Administrador' : 'Membro'}
                            </Badge>
                            <Badge variant={membro.ativo ? 'default' : 'secondary'}>
                              {membro.ativo ? 'Ativo' : 'Sem acesso'}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
