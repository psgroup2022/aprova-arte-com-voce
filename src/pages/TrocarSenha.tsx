import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, PERFIL_QUERY_KEY } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

/** O mesmo mínimo que o Supabase aplica do lado dele. Conferir aqui evita uma
 * ida ao servidor só para ouvir que a senha é curta. */
const MINIMO = 6;

/**
 * Troca da senha no primeiro acesso.
 *
 * A equipe nasce com uma senha compartilhada, criada pelo script de seed. Ela
 * serve para entrar uma vez. Enquanto `profiles.senha_provisoria` for true, o
 * `ProtectedRoute` traz a pessoa para cá antes de qualquer outra tela.
 */
export const TrocarSenha = () => {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const { perfil } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validar = () => {
    if (senha.length < MINIMO) return `A senha precisa de pelo menos ${MINIMO} caracteres.`;
    if (senha !== confirmacao) return 'As duas senhas não são iguais.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalido = validar();
    if (invalido) {
      setErro(invalido);
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      const { error: erroSenha } = await supabase.auth.updateUser({ password: senha });
      if (erroSenha) throw new Error(erroSenha.message);

      // A senha já mudou. Baixar a bandeira é o segundo passo, e se ele falhar a
      // pessoa apenas volta para cá no próximo acesso — com a senha nova, que é
      // a que vale. Por isso a ordem: primeiro o que não pode se perder.
      const { error: erroPerfil } = await supabase
        .from('profiles')
        .update({ senha_provisoria: false })
        .eq('auth_user_id', user!.id);
      if (erroPerfil) throw new Error(erroPerfil.message);

      await queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
      toast({ title: 'Senha trocada', description: 'Bem-vindo(a).' });
      navigate('/', { replace: true });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não consegui trocar a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Escolha sua senha</CardTitle>
          <CardDescription>
            {perfil ? `${perfil.nome}, você` : 'Você'} entrou com a senha inicial da equipe. Defina
            uma senha sua para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmacao">Repita a nova senha</Label>
              <Input
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>

            {erro && (
              <Alert variant="destructive" data-testid="erro-troca-senha">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e entrar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="link" className="text-sm" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
