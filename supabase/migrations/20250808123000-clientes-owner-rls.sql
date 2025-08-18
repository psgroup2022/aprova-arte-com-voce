-- Add owner column to clientes and tighten RLS

alter table if exists public.clientes
  add column if not exists criado_por uuid references auth.users(id) on delete set null;

-- Drop overly-permissive legacy policies
drop policy if exists "Usuários podem ver clientes" on public.clientes;
drop policy if exists "Usuários podem criar clientes" on public.clientes;
drop policy if exists "Usuários podem atualizar clientes" on public.clientes;
drop policy if exists "Usuários podem excluir clientes" on public.clientes;

-- Drop coarse policies from previous migration if present
drop policy if exists clientes_select_authenticated on public.clientes;
drop policy if exists clientes_write_authenticated on public.clientes;

-- Create owner-based policies
-- Transitional read: allow authenticated to read rows with NULL owner (legacy data)
create policy clientes_select_owner_or_null
  on public.clientes for select
  using (auth.uid() = criado_por or criado_por is null);

-- Writes only by owner (new rows must set criado_por = auth.uid())
create policy clientes_write_owner
  on public.clientes for all
  using (auth.uid() = criado_por)
  with check (auth.uid() = criado_por);

-- Optional: index for filtering by owner
create index if not exists idx_clientes_criado_por on public.clientes (criado_por);
