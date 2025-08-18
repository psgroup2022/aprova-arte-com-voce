-- Enable RLS on core tables and add stricter, owner-based policies (idempotent via drop/create)

alter table if exists public.pautas enable row level security;
alter table if exists public.pauta_arquivos enable row level security;
alter table if exists public.comentarios_pontuais enable row level security;
alter table if exists public.clientes enable row level security;
alter table if exists public.historico_aprovacoes enable row level security;

-- Drop legacy policies from earlier migrations (Portuguese names)
drop policy if exists "Usuários podem ver todas as pautas" on public.pautas;
drop policy if exists "Usuários podem criar pautas" on public.pautas;
drop policy if exists "Criadores podem atualizar suas pautas" on public.pautas;

-- Pautas: any authenticated can read; insert requires criado_por = auth.uid(); only owner can update/delete
drop policy if exists pautas_select_authenticated on public.pautas;
create policy pautas_select_authenticated
  on public.pautas for select
  using (auth.uid() is not null);

drop policy if exists pautas_insert_authenticated on public.pautas;
create policy pautas_insert_authenticated
  on public.pautas for insert
  with check (criado_por = auth.uid());

drop policy if exists pautas_update_owner on public.pautas;
create policy pautas_update_owner
  on public.pautas for update
  using (criado_por = auth.uid())
  with check (criado_por = auth.uid());

drop policy if exists pautas_delete_owner on public.pautas;
create policy pautas_delete_owner
  on public.pautas for delete
  using (criado_por = auth.uid());

-- Drop legacy file policies
drop policy if exists "Usuários podem ver arquivos das pautas" on public.pauta_arquivos;
drop policy if exists "Usuários podem inserir arquivos" on public.pauta_arquivos;

-- Pauta Arquivos: read for authenticated; write only if user owns the related pauta
drop policy if exists pauta_arquivos_select_authenticated on public.pauta_arquivos;
create policy pauta_arquivos_select_authenticated
  on public.pauta_arquivos for select
  using (auth.uid() is not null);

drop policy if exists pauta_arquivos_write_owner on public.pauta_arquivos;
create policy pauta_arquivos_write_owner
  on public.pauta_arquivos for all
  using (exists (
    select 1 from public.pautas p where p.id = pauta_arquivos.pauta_id and p.criado_por = auth.uid()
  ))
  with check (exists (
    select 1 from public.pautas p where p.id = pauta_arquivos.pauta_id and p.criado_por = auth.uid()
  ));

-- Drop legacy comment policies
drop policy if exists "Usuários podem ver comentários" on public.comentarios_pontuais;
drop policy if exists "Usuários podem criar comentários" on public.comentarios_pontuais;
drop policy if exists "Criadores podem atualizar comentários" on public.comentarios_pontuais;

-- Comentários: read for authenticated; insert by author; update/delete by author or owner of pauta
drop policy if exists comentarios_select_authenticated on public.comentarios_pontuais;
create policy comentarios_select_authenticated
  on public.comentarios_pontuais for select
  using (auth.uid() is not null);

drop policy if exists comentarios_insert_authenticated on public.comentarios_pontuais;
create policy comentarios_insert_authenticated
  on public.comentarios_pontuais for insert
  with check (criado_por = auth.uid());

drop policy if exists comentarios_update_author_or_pauta_owner on public.comentarios_pontuais;
create policy comentarios_update_author_or_pauta_owner
  on public.comentarios_pontuais for update
  using (
    criado_por = auth.uid()
    or exists (select 1 from public.pautas p where p.id = comentarios_pontuais.pauta_id and p.criado_por = auth.uid())
  )
  with check (true);

drop policy if exists comentarios_delete_author_or_pauta_owner on public.comentarios_pontuais;
create policy comentarios_delete_author_or_pauta_owner
  on public.comentarios_pontuais for delete
  using (
    criado_por = auth.uid()
    or exists (select 1 from public.pautas p where p.id = comentarios_pontuais.pauta_id and p.criado_por = auth.uid())
  );

drop policy if exists clientes_select_authenticated on public.clientes;
create policy clientes_select_authenticated
  on public.clientes for select
  using (auth.uid() is not null);

drop policy if exists clientes_write_authenticated on public.clientes;
create policy clientes_write_authenticated
  on public.clientes for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Drop legacy history policies
drop policy if exists "Usuários podem ver histórico" on public.historico_aprovacoes;
drop policy if exists "Usuários podem inserir histórico" on public.historico_aprovacoes;

-- Histórico de aprovações: readable by authenticated, insert by authenticated; updates/deletes disabled by default
drop policy if exists historico_select_authenticated on public.historico_aprovacoes;
create policy historico_select_authenticated
  on public.historico_aprovacoes for select
  using (auth.uid() is not null);

drop policy if exists historico_insert_authenticated on public.historico_aprovacoes;
create policy historico_insert_authenticated
  on public.historico_aprovacoes for insert
  with check (auth.uid() is not null);
