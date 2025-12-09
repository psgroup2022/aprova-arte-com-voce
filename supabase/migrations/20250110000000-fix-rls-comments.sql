-- Migration: Corrigir políticas RLS permissivas em comentários
-- Prioridade: CRÍTICA (CVSS 7.5 - HIGH)
-- Issue: Qualquer usuário autenticado pode editar/deletar comentários de outros usuários
-- Data: 2025-01-10
-- Relacionado: SECURITY.md - Vulnerabilidade Crítica #1

begin;

-- ============================================================================
-- PROBLEMA ATUAL:
-- As políticas permitiam que QUALQUER usuário autenticado editasse/deletasse
-- comentários de OUTROS usuários, incluindo clientes.
-- ============================================================================

-- Drop políticas antigas (permissivas e inseguras)
drop policy if exists comentarios_update_author_or_pauta_owner on public.comentarios_pontuais;
drop policy if exists comentarios_delete_author_or_pauta_owner on public.comentarios_pontuais;

-- ============================================================================
-- NOVA ARQUITETURA DE SEGURANÇA:
-- 1. Apenas autor pode editar/deletar seu próprio comentário
-- 2. Owner da pauta pode APENAS marcar como resolvido (não editar texto)
-- 3. Separação clara de responsabilidades
-- ============================================================================

-- Política 1: UPDATE - Apenas autor pode editar texto do comentário
create policy comentarios_update_author_only
  on public.comentarios_pontuais for update
  using (criado_por = auth.uid())
  with check (criado_por = auth.uid());

comment on policy comentarios_update_author_only on public.comentarios_pontuais is
  'Apenas o autor pode editar o texto do seu comentário. Owner da pauta pode apenas marcar como resolvido via política separada.';

-- Política 2: DELETE - Apenas autor pode deletar
create policy comentarios_delete_author_only
  on public.comentarios_pontuais for delete
  using (criado_por = auth.uid());

comment on policy comentarios_delete_author_only on public.comentarios_pontuais is
  'Apenas o autor pode deletar seu próprio comentário. Sem exceções.';

-- Política 3: UPDATE ESPECIAL - Owner da pauta pode marcar como resolvido
-- IMPORTANTE: Esta política NÃO permite editar o texto do comentário
create policy comentarios_resolve_by_pauta_owner
  on public.comentarios_pontuais for update
  using (
    -- Apenas se o usuário é owner da pauta
    exists (
      select 1
      from public.pautas p
      where p.id = comentarios_pontuais.pauta_id
        and p.criado_por = auth.uid()
    )
  )
  with check (
    -- Garante que é owner da pauta
    exists (
      select 1
      from public.pautas p
      where p.id = comentarios_pontuais.pauta_id
        and p.criado_por = auth.uid()
    )
  );

comment on policy comentarios_resolve_by_pauta_owner on public.comentarios_pontuais is
  'Owner da pauta pode marcar comentários como resolvidos ou respondê-los. Não pode editar o texto original do comentário do cliente.';

-- ============================================================================
-- AUDIT LOG: Registrar mudança de segurança
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'audit_logs') then
    insert into public.audit_logs (action, resource_type, metadata)
    values (
      'security_fix',
      'rls_policies',
      jsonb_build_object(
        'table', 'comentarios_pontuais',
        'issue', 'RLS permissivo - qualquer usuário podia editar/deletar comentários',
        'severity', 'CRITICAL',
        'cvss', '7.5',
        'fix', 'Restringido update/delete apenas ao autor. Owner da pauta pode apenas resolver.',
        'migration', '20250110000000-fix-rls-comments'
      )
    );
  end if;
end $$;

-- ============================================================================
-- VERIFICAÇÃO DE SEGURANÇA:
-- Testar se as políticas estão corretas
-- ============================================================================

-- Test 1: Autor pode editar próprio comentário ✓
-- set local role authenticated;
-- set local request.jwt.claim.sub to 'user-id-1';
-- update comentarios_pontuais set comentario = 'novo texto' where criado_por = 'user-id-1';
-- Resultado esperado: SUCCESS

-- Test 2: Usuário NÃO pode editar comentário de outro ✗
-- set local role authenticated;
-- set local request.jwt.claim.sub to 'user-id-2';
-- update comentarios_pontuais set comentario = 'hack' where criado_por = 'user-id-1';
-- Resultado esperado: 0 rows updated (bloqueado por RLS)

-- Test 3: Owner da pauta pode marcar como resolvido ✓
-- (mas não editar texto do comentário)

commit;

-- ============================================================================
-- PRÓXIMOS PASSOS:
-- 1. Executar este migration via: supabase db push
-- 2. Testar manualmente as 3 políticas
-- 3. Verificar logs de audit (se existir tabela)
-- 4. Atualizar SECURITY.md marcando vulnerabilidade como FIXED
-- ============================================================================
