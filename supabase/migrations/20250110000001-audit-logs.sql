-- ============================================================================
-- AUDIT LOGS - Rastreamento de Ações de Segurança
-- ============================================================================
--
-- Esta migration cria a infraestrutura de audit logging para rastrear:
-- - Tentativas de login (sucesso/falha)
-- - Modificações de dados sensíveis
-- - Mudanças de permissões
-- - Ações administrativas
--
-- CVSS: N/A (melhoria de segurança)
-- Referência: CWE-778 (Insufficient Logging)
--
-- ============================================================================

-- Criar tipo enum para categorias de eventos
create type public.audit_event_category as enum (
  'authentication',
  'authorization',
  'data_modification',
  'data_access',
  'configuration',
  'security'
);

-- Criar tipo enum para severidade
create type public.audit_event_severity as enum (
  'info',
  'warning',
  'error',
  'critical'
);

-- Tabela de audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identificação do usuário
  user_id uuid references auth.users(id) on delete set null,
  user_email text,

  -- Detalhes do evento
  event_category audit_event_category not null,
  event_action text not null, -- ex: 'login', 'update_pauta', 'delete_comment'
  event_severity audit_event_severity not null default 'info',

  -- Contexto
  resource_type text, -- ex: 'pauta', 'comentario', 'user'
  resource_id uuid, -- ID do recurso afetado

  -- Dados adicionais
  metadata jsonb default '{}', -- contexto extra (IP, user agent, etc)
  changes jsonb, -- before/after para modificações

  -- Resultado
  success boolean not null default true,
  error_message text,

  -- Índices para performance
  check (char_length(event_action) <= 100),
  check (char_length(event_action) > 0)
);

-- Índices para queries comuns
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_audit_logs_event_category on public.audit_logs(event_category);
create index idx_audit_logs_event_action on public.audit_logs(event_action);
create index idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
create index idx_audit_logs_severity on public.audit_logs(event_severity) where event_severity in ('error', 'critical');
create index idx_audit_logs_failed on public.audit_logs(success) where success = false;

-- Índice GIN para busca em metadata
create index idx_audit_logs_metadata on public.audit_logs using gin (metadata);

-- Comentários para documentação
comment on table public.audit_logs is 'Registro de auditoria para rastreamento de ações de segurança';
comment on column public.audit_logs.user_email is 'Email do usuário no momento da ação (preservado mesmo se usuário for deletado)';
comment on column public.audit_logs.metadata is 'Contexto adicional: IP, user agent, geolocation, etc';
comment on column public.audit_logs.changes is 'Valores antes/depois para operações de modificação';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS
alter table public.audit_logs enable row level security;

-- Apenas admins podem ler logs (TODO: criar role de admin)
-- Por enquanto, apenas o sistema pode inserir e ninguém pode ler via client
create policy audit_logs_insert_system_only
  on public.audit_logs for insert
  with check (false); -- Apenas via Edge Functions/triggers

create policy audit_logs_select_admin_only
  on public.audit_logs for select
  using (false); -- TODO: using (auth.jwt() ->> 'role' = 'admin')

-- Ninguém pode atualizar ou deletar logs
create policy audit_logs_no_update
  on public.audit_logs for update
  using (false);

create policy audit_logs_no_delete
  on public.audit_logs for delete
  using (false);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Função para registrar eventos de auditoria
 * Use em triggers ou Edge Functions
 *
 * @example
 * select log_audit_event(
 *   p_user_id := auth.uid(),
 *   p_event_category := 'data_modification',
 *   p_event_action := 'update_pauta',
 *   p_resource_type := 'pauta',
 *   p_resource_id := NEW.id,
 *   p_metadata := jsonb_build_object('ip', request.headers ->> 'x-forwarded-for'),
 *   p_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
 * );
 */
create or replace function public.log_audit_event(
  p_user_id uuid default null,
  p_user_email text default null,
  p_event_category audit_event_category default 'data_modification',
  p_event_action text default 'unknown',
  p_event_severity audit_event_severity default 'info',
  p_resource_type text default null,
  p_resource_id uuid default null,
  p_metadata jsonb default '{}',
  p_changes jsonb default null,
  p_success boolean default true,
  p_error_message text default null
) returns uuid as $$
declare
  v_log_id uuid;
  v_final_user_email text;
begin
  -- Obter email do usuário se não fornecido
  if p_user_email is null and p_user_id is not null then
    select email into v_final_user_email
    from auth.users
    where id = p_user_id;
  else
    v_final_user_email := p_user_email;
  end if;

  -- Inserir log
  insert into public.audit_logs (
    user_id,
    user_email,
    event_category,
    event_action,
    event_severity,
    resource_type,
    resource_id,
    metadata,
    changes,
    success,
    error_message
  ) values (
    p_user_id,
    v_final_user_email,
    p_event_category,
    p_event_action,
    p_event_severity,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_changes,
    p_success,
    p_error_message
  ) returning id into v_log_id;

  return v_log_id;
end;
$$ language plpgsql security definer;

-- Comentário
comment on function public.log_audit_event is 'Registra evento de auditoria com contexto completo';

-- ============================================================================
-- TRIGGERS DE AUDITORIA AUTOMÁTICA
-- ============================================================================

/**
 * Trigger para auditar mudanças em pautas
 */
create or replace function public.audit_pauta_changes()
returns trigger as $$
begin
  -- Apenas auditar updates significativos
  if TG_OP = 'UPDATE' then
    -- Verificar se status mudou
    if OLD.status is distinct from NEW.status then
      perform log_audit_event(
        p_user_id := auth.uid(),
        p_event_category := 'data_modification',
        p_event_action := 'pauta_status_change',
        p_event_severity := 'info',
        p_resource_type := 'pauta',
        p_resource_id := NEW.id,
        p_metadata := jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    end if;
  elsif TG_OP = 'DELETE' then
    perform log_audit_event(
      p_user_id := auth.uid(),
      p_event_category := 'data_modification',
      p_event_action := 'pauta_delete',
      p_event_severity := 'warning',
      p_resource_type := 'pauta',
      p_resource_id := OLD.id,
      p_metadata := jsonb_build_object('titulo', OLD.titulo)
    );
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Aplicar trigger em pautas
drop trigger if exists audit_pauta_changes_trigger on public.pautas;
create trigger audit_pauta_changes_trigger
  after update or delete on public.pautas
  for each row execute function public.audit_pauta_changes();

/**
 * Trigger para auditar deleção de comentários
 */
create or replace function public.audit_comentario_delete()
returns trigger as $$
begin
  perform log_audit_event(
    p_user_id := auth.uid(),
    p_event_category := 'data_modification',
    p_event_action := 'comentario_delete',
    p_event_severity := 'info',
    p_resource_type := 'comentario',
    p_resource_id := OLD.id,
    p_metadata := jsonb_build_object(
      'pauta_id', OLD.pauta_id,
      'arquivo_id', OLD.arquivo_id
    )
  );
  return OLD;
end;
$$ language plpgsql security definer;

-- Aplicar trigger em comentários
drop trigger if exists audit_comentario_delete_trigger on public.comentarios_pontuais;
create trigger audit_comentario_delete_trigger
  before delete on public.comentarios_pontuais
  for each row execute function public.audit_comentario_delete();

-- ============================================================================
-- LIMPEZA AUTOMÁTICA DE LOGS ANTIGOS
-- ============================================================================

/**
 * Função para limpar logs mais antigos que X dias
 * Executar via cron job semanal
 */
create or replace function public.cleanup_old_audit_logs(days_to_keep integer default 90)
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.audit_logs
  where created_at < now() - (days_to_keep || ' days')::interval
    and event_severity not in ('error', 'critical'); -- Manter erros críticos

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;

comment on function public.cleanup_old_audit_logs is 'Remove logs de auditoria antigos (mantém erros críticos)';

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

/**
 * View de logs recentes (últimos 7 dias)
 */
create or replace view public.audit_logs_recent as
select
  id,
  created_at,
  user_email,
  event_category,
  event_action,
  event_severity,
  resource_type,
  resource_id,
  success,
  error_message
from public.audit_logs
where created_at > now() - interval '7 days'
order by created_at desc;

comment on view public.audit_logs_recent is 'Logs de auditoria dos últimos 7 dias';

/**
 * View de tentativas de login falhadas
 */
create or replace view public.failed_login_attempts as
select
  created_at,
  user_email,
  metadata ->> 'ip_address' as ip_address,
  metadata ->> 'user_agent' as user_agent,
  error_message
from public.audit_logs
where event_category = 'authentication'
  and event_action = 'login'
  and success = false
order by created_at desc;

comment on view public.failed_login_attempts is 'Tentativas de login falhadas para detecção de ataques';
