-- Quem pode agir em cada etapa
--
-- Todo mundo vê o ciclo inteiro; agir — aprovar, devolver, preencher, instruir,
-- disparar produção — só na própria etapa. É o que impede que um mexa na etapa
-- do outro sem precisar esconder nada de ninguém.
--
-- ## Por que a lista é gravada, e não derivada do pipeline
--
-- O servidor já sabe de quem é cada etapa: `resolveAgent` (squad/loader.ts) lê o
-- comentário `#` do `pipeline.yaml` e casa o nome com o `squad-party.csv`. Seria
-- tentador usar isso como permissão viva. Duas razões para não usar:
--
-- 1. **É regex sobre comentário.** Reescrever "Carolina gera as imagens" para
--    "geração de imagens" derruba a etapa para `agentId: null` em silêncio — e
--    junto iria a permissão de quem trabalha nela.
-- 2. **Os checkpoints não têm dono.** `checkpoint-briefing.md` e
--    `checkpoint-imagem-artes.md` resolvem para `pool: []`. São justamente os
--    dois pontos em que a equipe aprova, e onde a permissão mais importa.
--
-- Então o pipeline vira ponto de partida: um script lê os donos e grava a lista
-- inicial aqui. A partir daí, quem muda é o admin, pela tela. A lacuna dos
-- checkpoints aparece para ele preencher, em vez de sumir.
--
-- ## Por que a chave é (squad, file)
--
-- `index` é posicional: renumera a cada edição do pipeline, e
-- `ensureArtCheckpoint` injeta uma etapa com `max(index)+1` numa posição do
-- meio — depois disso `index` não é nem a posição nem crescente. `file` é
-- estável e é o que `workflow.ts`, `PipelineRail.tsx` e `runner.ts` já usam.

alter table public.profiles
  -- Liga o login à pessoa do `squad-party.csv` (`isadora`, `carlos`, `pedro`,
  -- `carolina`, `jean`, `rafa`). É o que permite ao script de semeadura saber
  -- quais etapas são de quem, e ao painel dizer "esta etapa é da Carolina".
  add column if not exists agente_id text,
  -- O caso Jean e Pedro. Separado da lista porque não é "todas as etapas de
  -- hoje": etapa nova entra automaticamente para quem tem isto.
  add column if not exists todas_as_etapas boolean not null default false,
  -- [{"squad": "marca", "file": "step-07-geracao-de-imagens.md"}, …]
  add column if not exists etapas jsonb not null default '[]'::jsonb;

-- Lista tem de ser lista, e de objetos. Sem isto, um `{}` ou um `["texto"]`
-- gravado por engano faria a checagem do servidor devolver falso para tudo — a
-- pessoa perderia o acesso e ninguém saberia por quê.
--
-- Em função à parte porque `check` não aceita subconsulta, e percorrer os itens
-- exige uma. `immutable` é o que a torna aceitável numa constraint: depende só
-- do argumento, nunca do banco.
create or replace function public.etapas_bem_formadas(v jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(v) = 'array'
     and not exists (
       select 1 from jsonb_array_elements(v) e
       where jsonb_typeof(e) <> 'object'
          or coalesce(jsonb_typeof(e -> 'squad'), '') <> 'string'
          or coalesce(jsonb_typeof(e -> 'file'), '') <> 'string'
     );
$$;

alter table public.profiles
  drop constraint if exists profiles_etapas_e_lista;
alter table public.profiles
  add constraint profiles_etapas_e_lista check (public.etapas_bem_formadas(etapas));

comment on column public.profiles.agente_id is
  'Id da pessoa no squad-party.csv. Liga o login ao pipeline.';
comment on column public.profiles.todas_as_etapas is
  'Age em qualquer etapa, inclusive nas criadas depois. Admin já tem isto por papel.';
comment on column public.profiles.etapas is
  'Etapas em que esta pessoa pode agir: [{"squad": …, "file": …}].';

-- ── O mesmo motivo do gatilho original ──────────────────────────────────────
--
-- RLS não recorta coluna: `profiles_update_self` deixa a pessoa atualizar a
-- própria linha, e estas três são colunas da própria linha. Sem o gatilho,
-- qualquer membro logado se daria todas as etapas com um update — e esconder o
-- editor no React não resolve, porque quem fala com a API não passa pela tela.
--
-- `guard_papel` é recriada inteira, e não estendida, porque `create or replace`
-- substitui o corpo: repetir as regras antigas aqui é o que impede que esta
-- migration as apague.

create or replace function public.guard_papel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Sem sujeito autenticado é o servidor com `service_role` (o seed, e o
  -- próprio Mirasquad). O anônimo não chega aqui: a baseline revogou todo
  -- acesso dele às tabelas.
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

  return new;
end;
$$;
