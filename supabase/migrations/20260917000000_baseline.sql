-- Baseline do AprovaArte.
--
-- Substitui as 23 migrations anteriores, que eram registro de um banco montado
-- incrementalmente na nuvem: nomes fora do padrão, timestamps retroativos e SQL
-- que nunca rodou (`trim()` sobre uuid). Nada foi perdido: o projeto nunca teve
-- dado em produção, e os arquivos antigos seguem no histórico do git.
--
-- Duas diferenças de fundo em relação ao que havia antes:
--
-- 1. Sem MiraPauta. O sistema não existe mais.
-- 2. O cliente não toca em tabela. Ele chama três funções que conferem o token e
--    devolvem só o que é daquela pauta. Antes metade do schema exigia login
--    (e o link público não abria) e a outra metade usava `USING (true)`, que
--    deixava qualquer anônimo aprovar qualquer pauta.

begin;

-- ── Tipos ───────────────────────────────────────────────────────────────────

create type public.papel_usuario as enum ('admin', 'membro');
create type public.pauta_status as enum ('rascunho', 'aguardando_aprovacao', 'aprovada', 'rejeitada');
create type public.arquivo_tipo as enum ('imagem', 'video', 'documento');
create type public.material_tipo as enum (
  'carrossel', 'story', 'reels', 'estatico', 'linkedin_artigo', 'email', 'whatsapp'
);
create type public.bloco_status as enum (
  'aguardando_midia', 'pronto', 'enviado_aprovacao', 'em_revisao', 'aprovado'
);
-- Decisão do cliente sobre uma peça. Separada de `bloco_status`, que descreve o
-- estágio de produção: uma peça pode estar pronta e ainda não decidida.
create type public.decisao_cliente as enum ('pendente', 'aprovada', 'reprovada');

-- ── Utilitários ─────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Perfis ──────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique,
  nome text not null,
  avatar_url text,
  papel public.papel_usuario not null default 'membro',
  -- Senha inicial compartilhada: enquanto for true, o app exige a troca antes de
  -- liberar qualquer outra tela.
  senha_provisoria boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_auth_user_id_idx on public.profiles(auth_user_id);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- `security definer` + `search_path` fixo: sem isso a função leria `profiles` sob
-- as políticas de quem a chamou, e as políticas dependem dela — recursão.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and papel = 'admin' and ativo
  );
$$;

create or replace function public.is_membro()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where auth_user_id = auth.uid() and ativo
  );
$$;

-- ── Clientes ────────────────────────────────────────────────────────────────

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  empresa text,
  observacoes text,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clientes_touch before update on public.clientes
  for each row execute function public.touch_updated_at();

-- ── Pautas ──────────────────────────────────────────────────────────────────

create table public.pautas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  cliente text not null,
  cliente_id uuid references public.clientes(id) on delete set null,
  data_prazo timestamptz,
  status public.pauta_status not null default 'rascunho',
  observacoes text,

  -- Ligação com o ciclo do Mirador Team. Nulo em pauta criada fora do pipeline.
  origem_run_id text unique,
  -- Credencial do link do cliente. Vem de randomBytes(24) no servidor: adivinhar
  -- um precisa ser inviável, e derivá-lo do id da pauta não seria.
  token_publico text unique,
  publicado_em timestamptz,

  criado_por uuid references auth.users(id) on delete set null,
  aprovado_por uuid references auth.users(id) on delete set null,
  data_aprovacao timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pautas_token_publico_idx on public.pautas(token_publico) where token_publico is not null;
create index pautas_origem_run_id_idx on public.pautas(origem_run_id) where origem_run_id is not null;
create trigger pautas_touch before update on public.pautas
  for each row execute function public.touch_updated_at();

-- ── Versões ─────────────────────────────────────────────────────────────────

create table public.pauta_versoes (
  id uuid primary key default gen_random_uuid(),
  pauta_id uuid not null references public.pautas(id) on delete cascade,
  numero_versao integer not null default 1,
  ativa boolean not null default true,
  briefing_url text,
  -- `revision` do ciclo que gerou esta versão.
  origem_revision integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pauta_id, numero_versao)
);

-- Uma única versão ativa por pauta: é ela que o cliente enxerga.
create unique index pauta_versoes_uma_ativa_idx
  on public.pauta_versoes(pauta_id) where ativa;
create trigger pauta_versoes_touch before update on public.pauta_versoes
  for each row execute function public.touch_updated_at();

-- ── Peças ───────────────────────────────────────────────────────────────────

create table public.blocos_material (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references public.pauta_versoes(id) on delete cascade,
  tipo_material public.material_tipo not null,
  status public.bloco_status not null default 'aguardando_midia',
  ordem integer not null default 0,

  -- Identidade da peça no ciclo: "P01", "P02"...
  origem_peca_id text,
  -- hash([conteúdo, hash(bytes da arte)]), calculado em server/src/pieces.ts.
  -- É o que permite recusar uma decisão tomada sobre arte que já mudou.
  origem_version text,
  data_postagem date,

  decisao_status public.decisao_cliente not null default 'pendente',
  decisao_nota text,
  decisao_por text,
  decisao_em timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (versao_id, origem_peca_id)
);

create trigger blocos_material_touch before update on public.blocos_material
  for each row execute function public.touch_updated_at();

create table public.bloco_itens (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references public.blocos_material(id) on delete cascade,
  -- A chamada que vai sobre a arte. Quebra de linha é decisão editorial.
  titulo text,
  texto_conteudo text,
  hashtags text,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bloco_itens_touch before update on public.bloco_itens
  for each row execute function public.touch_updated_at();

create table public.bloco_arquivos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.bloco_itens(id) on delete cascade,
  url text not null,
  tipo public.arquivo_tipo not null,
  nome_arquivo text not null,
  tamanho integer,
  created_at timestamptz not null default now()
);

-- ── Comentários pontuais ────────────────────────────────────────────────────

create table public.comentarios_pontuais (
  id uuid primary key default gen_random_uuid(),
  pauta_id uuid not null references public.pautas(id) on delete cascade,
  -- Comentário pertence à peça. O arquivo é opcional porque uma observação pode
  -- ser sobre a peça inteira, sem apontar um ponto da imagem.
  bloco_id uuid references public.blocos_material(id) on delete cascade,
  arquivo_id uuid references public.bloco_arquivos(id) on delete cascade,
  -- Percentual da largura/altura, não pixel: sobrevive a qualquer tamanho de tela.
  x_coordenada integer not null default 0 check (x_coordenada between 0 and 100),
  y_coordenada integer not null default 0 check (y_coordenada between 0 and 100),
  comentario text not null check (length(trim(comentario)) > 0),
  autor_nome text,
  resolvido boolean not null default false,
  criado_por uuid references auth.users(id) on delete set null,
  respondido_por uuid references auth.users(id) on delete set null,
  resposta text,
  data_resposta timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comentarios_pauta_idx on public.comentarios_pontuais(pauta_id);
create index comentarios_bloco_idx on public.comentarios_pontuais(bloco_id);
create trigger comentarios_touch before update on public.comentarios_pontuais
  for each row execute function public.touch_updated_at();

-- ── Histórico e auditoria ───────────────────────────────────────────────────

create table public.historico_aprovacoes (
  id uuid primary key default gen_random_uuid(),
  pauta_id uuid not null references public.pautas(id) on delete cascade,
  status_anterior public.pauta_status,
  status_novo public.pauta_status not null,
  comentario text,
  usuario_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  registro_id uuid,
  operacao text not null,
  autor uuid references auth.users(id) on delete set null,
  dados jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_tabela_idx on public.audit_logs(tabela, created_at desc);

-- ── Storage ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('pauta-arquivos', 'pauta-arquivos', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ── Acesso da equipe ────────────────────────────────────────────────────────
--
-- Quem está logado e ativo lê tudo — é uma agência de seis pessoas, esconder
-- pauta entre colegas não resolveria problema nenhum. Escrever exige o mesmo
-- vínculo; apagar e mexer em gente exige admin.

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.pautas enable row level security;
alter table public.pauta_versoes enable row level security;
alter table public.blocos_material enable row level security;
alter table public.bloco_itens enable row level security;
alter table public.bloco_arquivos enable row level security;
alter table public.comentarios_pontuais enable row level security;
alter table public.historico_aprovacoes enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles for select using (public.is_membro());
create policy profiles_update_self on public.profiles for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy profiles_admin_all on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

create policy clientes_select on public.clientes for select using (public.is_membro());
create policy clientes_write on public.clientes for insert with check (public.is_membro());
create policy clientes_update on public.clientes for update
  using (public.is_membro()) with check (public.is_membro());
create policy clientes_delete on public.clientes for delete using (public.is_admin());

create policy pautas_select on public.pautas for select using (public.is_membro());
create policy pautas_insert on public.pautas for insert with check (public.is_membro());
create policy pautas_update on public.pautas for update
  using (public.is_membro()) with check (public.is_membro());
create policy pautas_delete on public.pautas for delete using (public.is_admin());

create policy versoes_all on public.pauta_versoes for all
  using (public.is_membro()) with check (public.is_membro());
create policy blocos_all on public.blocos_material for all
  using (public.is_membro()) with check (public.is_membro());
create policy itens_all on public.bloco_itens for all
  using (public.is_membro()) with check (public.is_membro());
create policy arquivos_all on public.bloco_arquivos for all
  using (public.is_membro()) with check (public.is_membro());

create policy comentarios_select on public.comentarios_pontuais for select using (public.is_membro());
create policy comentarios_insert on public.comentarios_pontuais for insert with check (public.is_membro());
-- Texto do comentário é do autor. A equipe pode resolver e responder, não reescrever.
create policy comentarios_update_autor on public.comentarios_pontuais for update
  using (criado_por = auth.uid()) with check (criado_por = auth.uid());
create policy comentarios_delete_admin on public.comentarios_pontuais for delete using (public.is_admin());

create policy historico_select on public.historico_aprovacoes for select using (public.is_membro());
create policy historico_insert on public.historico_aprovacoes for insert with check (public.is_membro());

create policy audit_select on public.audit_logs for select using (public.is_admin());

-- ── Acesso do cliente ───────────────────────────────────────────────────────
--
-- O cliente não tem login: o token no link é a credencial. Por isso ele não
-- recebe permissão em tabela alguma — fala só com estas três funções, que
-- conferem o token e devolvem apenas o que pertence àquela pauta.

revoke all on all tables in schema public from anon;

create or replace function public.pauta_publica(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pauta', jsonb_build_object(
      'id', p.id, 'titulo', p.titulo, 'cliente', p.cliente,
      'descricao', p.descricao, 'data_prazo', p.data_prazo, 'status', p.status
    ),
    'pecas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'peca', b.origem_peca_id,
        'tipo', b.tipo_material,
        'data_postagem', b.data_postagem,
        'ordem', b.ordem,
        'decisao', b.decisao_status,
        'decisao_nota', b.decisao_nota,
        'decisao_por', b.decisao_por,
        'decisao_em', b.decisao_em,
        'chamada', i.titulo,
        'legenda', i.texto_conteudo,
        'arquivos', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', a.id, 'url', a.url, 'tipo', a.tipo, 'nome', a.nome_arquivo
          ) order by a.created_at)
          from bloco_arquivos a where a.item_id = i.id
        ), '[]'::jsonb),
        'comentarios', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', c.id, 'x', c.x_coordenada, 'y', c.y_coordenada,
            'texto', c.comentario, 'autor', c.autor_nome,
            'resolvido', c.resolvido, 'resposta', c.resposta,
            'criado_em', c.created_at
          ) order by c.created_at)
          from comentarios_pontuais c where c.bloco_id = b.id
        ), '[]'::jsonb)
      ) order by b.ordem, b.origem_peca_id)
      from blocos_material b
      left join lateral (
        select * from bloco_itens x where x.bloco_id = b.id order by x.ordem limit 1
      ) i on true
      where b.versao_id = v.id
    ), '[]'::jsonb)
  )
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  where p.token_publico = p_token and p_token is not null and length(p_token) >= 32;
$$;

create or replace function public.decidir_bloco(
  p_token text, p_bloco_id uuid, p_status text, p_nota text, p_por text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pauta uuid;
begin
  if p_status not in ('aprovada', 'reprovada') then
    raise exception 'Decisão inválida.';
  end if;
  -- Reprovar sem motivo chega à Mirador sem dizer para quem mandar o ajuste,
  -- que é exatamente o que esta etapa precisa produzir. Mesma regra de
  -- decidePieces, no servidor.
  if p_status = 'reprovada' and coalesce(trim(p_nota), '') = '' then
    raise exception 'Diga no comentário o que precisa mudar.';
  end if;
  if coalesce(trim(p_por), '') = '' then
    raise exception 'Identifique quem está revisando.';
  end if;

  select p.id into v_pauta
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  join blocos_material b on b.versao_id = v.id
  where p.token_publico = p_token and b.id = p_bloco_id;

  if v_pauta is null then
    raise exception 'Peça não encontrada neste link.';
  end if;

  update blocos_material
  set decisao_status = p_status::decisao_cliente,
      decisao_nota = nullif(trim(coalesce(p_nota, '')), ''),
      decisao_por = trim(p_por),
      decisao_em = now()
  where id = p_bloco_id;

  return public.pauta_publica(p_token);
end;
$$;

create or replace function public.comentar_bloco(
  p_token text, p_bloco_id uuid, p_arquivo_id uuid,
  p_x integer, p_y integer, p_texto text, p_por text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pauta uuid;
begin
  if coalesce(trim(p_texto), '') = '' then
    raise exception 'O comentário não pode ficar vazio.';
  end if;

  select p.id into v_pauta
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  join blocos_material b on b.versao_id = v.id
  where p.token_publico = p_token and b.id = p_bloco_id;

  if v_pauta is null then
    raise exception 'Peça não encontrada neste link.';
  end if;

  insert into comentarios_pontuais
    (pauta_id, bloco_id, arquivo_id, x_coordenada, y_coordenada, comentario, autor_nome)
  values
    (v_pauta, p_bloco_id, p_arquivo_id,
     greatest(0, least(100, coalesce(p_x, 0))),
     greatest(0, least(100, coalesce(p_y, 0))),
     trim(p_texto), nullif(trim(coalesce(p_por, '')), ''));

  return public.pauta_publica(p_token);
end;
$$;

grant execute on function public.pauta_publica(text) to anon, authenticated;
grant execute on function public.decidir_bloco(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.comentar_bloco(text, uuid, uuid, integer, integer, text, text) to anon, authenticated;

commit;
