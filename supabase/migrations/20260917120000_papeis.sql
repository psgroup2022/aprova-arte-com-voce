-- Fase 2 — Usuários e papéis
--
-- A baseline deixou `profiles_update_self` sem recorte de coluna: a pessoa pode
-- atualizar a própria linha, e `papel` é uma coluna da própria linha. Qualquer
-- membro logado viraria admin com um update. Esconder o botão no React não
-- resolve — quem fala com a API não passa pela tela.
--
-- RLS não expressa "estas colunas, não aquelas": `with check` enxerga só a linha
-- nova, nunca a antiga, então não dá para comparar o papel anterior. Um gatilho
-- enxerga as duas e é o lugar certo para a regra.

create or replace function public.guard_papel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Sem sujeito autenticado é o servidor com `service_role` (o seed). O anônimo
  -- não chega aqui: a baseline revogou todo acesso dele às tabelas.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.papel is distinct from old.papel then
    raise exception 'Somente admin altera o papel de um usuário.' using errcode = '42501';
  end if;

  if new.ativo is distinct from old.ativo then
    raise exception 'Somente admin ativa ou desativa um usuário.' using errcode = '42501';
  end if;

  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'Vínculo com a conta de acesso não é editável.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_papel before update on public.profiles
  for each row execute function public.guard_papel();

-- Sobra o caminho inverso: criar a própria linha já como admin. O gatilho não
-- alcança insert, e a política de admin é `for all` — bastaria uma política de
-- insert mais frouxa aparecer depois para reabrir o buraco.
--
-- Isto vale para todo `authenticated`, admin incluído: pelo navegador ninguém
-- cria nem apaga usuário. É o desenho desta fase — as contas nascem do script
-- de seed, com `service_role`, e sair da equipe é `ativo = false`, que preserva
-- as referências de quem já assinou aprovação. Quando o convite pela tela
-- entrar, virá por função com `service_role`, que não passa por grant.
revoke insert, delete on public.profiles from authenticated;

-- ── Nunca ficar sem administrador ───────────────────────────────────────────
--
-- Só o admin gerencia gente. Se o último deles se rebaixar ou se desativar, não
-- sobra quem desfaça — nem quem inclua alguém. A recuperação seria abrir o banco
-- por fora. Mais barato recusar o último passo.
--
-- Vale inclusive para `service_role`: o seed não tem motivo para deixar a equipe
-- órfã, e uma exceção aqui seria a porta pela qual isso aconteceria.

create or replace function public.guard_ultimo_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.papel = 'admin' and old.ativo
     and (new.papel is distinct from 'admin' or not new.ativo)
     and not exists (
       select 1 from public.profiles
       where papel = 'admin' and ativo and id <> old.id
     )
  then
    raise exception 'A equipe ficaria sem administrador.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_ultimo_admin before update on public.profiles
  for each row execute function public.guard_ultimo_admin();
