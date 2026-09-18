-- Conta do Claude por pessoa
--
-- Até aqui o servidor produzia tudo por uma conta só: `CLAUDE_CONFIG_DIR`,
-- constante de módulo lida em quatro pontos de spawn. Isso tem dois problemas
-- que só aparecem com a equipe inteira usando o Mirasquad:
--
-- 1. **Um limite para seis pessoas.** Uma pauta tem quinze etapas. Rodando
--    todas na mesma conta, a primeira pauta do dia consome o teto de sessão
--    que a equipe inteira precisaria para o resto do dia.
-- 2. **Não dá para saber de quem foi o gasto.** O ciclo é da equipe, mas a
--    conta é uma, então o consumo de todo mundo chega misturado.
--
-- A coluna guarda o *nome do subdiretório* da pessoa, não um caminho absoluto:
-- a base fica em `CLAUDE_CONFIG_BASE`, no ambiente do servidor. Guardar caminho
-- inteiro no banco deixaria o dado preso à máquina em que foi escrito, e mudar
-- de servidor exigiria um UPDATE em todas as linhas.
--
-- Vazio significa conta não configurada. Nesse caso a etapa **recusa** em vez
-- de cair na conta padrão — se caísse, a pessoa gastaria em silêncio o limite
-- de outra, que é exatamente o que esta coluna existe para impedir.

alter table public.profiles
  add column if not exists claude_conta text;

comment on column public.profiles.claude_conta is
  'Subdiretório da conta do Claude desta pessoa, dentro de CLAUDE_CONFIG_BASE. Vazio: etapa recusa em vez de usar a conta de outro.';

-- ── Mesma armadilha da migration anterior ───────────────────────────────────
--
-- RLS não recorta coluna: `profiles_update_self` deixa a pessoa atualizar a
-- própria linha, e esta é uma coluna da própria linha. Sem o gatilho, qualquer
-- membro apontaria a própria linha para o subdiretório de outro e produziria
-- pelo limite dele.
--
-- E vale o aviso que já está em `permissao.ts`: este gatilho só age quando
-- existe `auth.uid()`. O Mirasquad fala com o Supabase por `service_role`, onde
-- `auth.uid()` é nulo — lá a regra é a do servidor (`index.ts`), e só dela.
-- `create or replace` substitui o corpo inteiro, então as regras anteriores são
-- repetidas aqui de propósito: omitir uma é apagá-la.

create or replace function public.guard_papel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
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

  if new.agente_id is distinct from old.agente_id then
    raise exception 'Somente admin liga um login a uma pessoa do squad.' using errcode = '42501';
  end if;

  if new.todas_as_etapas is distinct from old.todas_as_etapas
     or new.etapas is distinct from old.etapas then
    raise exception 'Somente admin define em quais etapas alguém pode agir.' using errcode = '42501';
  end if;

  if new.claude_conta is distinct from old.claude_conta then
    raise exception 'Somente admin define a conta do Claude de alguém.' using errcode = '42501';
  end if;

  return new;
end;
$$;
