-- ============================================================================
-- DATABASE CONSTRAINTS - Validação de Integridade de Dados
-- ============================================================================
--
-- Esta migration adiciona constraints de validação para garantir:
-- - Dados válidos em todas as tabelas
-- - Integridade referencial
-- - Prevenção de dados inconsistentes
--
-- CVSS: N/A (hardening de segurança)
-- Referência: CWE-20 (Improper Input Validation)
--
-- ============================================================================

-- ============================================================================
-- TABELA: pautas
-- ============================================================================

-- Validar que título não é vazio
alter table public.pautas
  add constraint pautas_titulo_not_empty
  check (char_length(trim(titulo)) >= 3);

-- Validar comprimento máximo de campos
alter table public.pautas
  add constraint pautas_titulo_max_length
  check (char_length(titulo) <= 200);

alter table public.pautas
  add constraint pautas_descricao_max_length
  check (char_length(descricao) <= 5000 or descricao is null);

alter table public.pautas
  add constraint pautas_cliente_max_length
  check (char_length(cliente) <= 100);

alter table public.pautas
  add constraint pautas_observacoes_max_length
  check (char_length(observacoes) <= 2000 or observacoes is null);

-- Validar status
alter table public.pautas
  add constraint pautas_status_valid
  check (status in ('rascunho', 'aguardando_aprovacao', 'aprovada', 'rejeitada'));

-- Garantir que data_prazo não é no passado (apenas para novas pautas)
-- Comentado pois pode ser legítimo ter prazos no passado para histórico
-- alter table public.pautas
--   add constraint pautas_prazo_future
--   check (data_prazo is null or data_prazo >= current_timestamp);

-- ============================================================================
-- TABELA: comentarios_pontuais
-- ============================================================================

-- Validar que comentário não é vazio
alter table public.comentarios_pontuais
  add constraint comentarios_texto_not_empty
  check (char_length(trim(comentario)) >= 1);

-- Validar comprimento máximo
alter table public.comentarios_pontuais
  add constraint comentarios_texto_max_length
  check (char_length(comentario) <= 1000);

-- Validar resposta
alter table public.comentarios_pontuais
  add constraint comentarios_resposta_max_length
  check (char_length(resposta) <= 1000 or resposta is null);

-- Validar coordenadas (0-100 para sistema percentual)
alter table public.comentarios_pontuais
  add constraint comentarios_x_coordenada_range
  check (x_coordenada >= 0 and x_coordenada <= 100);

alter table public.comentarios_pontuais
  add constraint comentarios_y_coordenada_range
  check (y_coordenada >= 0 and y_coordenada <= 100);

-- Validar que arquivo_id não é vazio
alter table public.comentarios_pontuais
  add constraint comentarios_arquivo_id_not_empty
  check (char_length(trim(arquivo_id)) > 0);

-- Garantir consistência: se resolvido, deve ter data_resposta
-- Removido pois pode ser marcado como resolvido sem resposta
-- alter table public.comentarios_pontuais
--   add constraint comentarios_resolvido_tem_data
--   check (not resolvido or data_resposta is not null);

-- ============================================================================
-- TABELA: pauta_arquivos
-- ============================================================================

-- Validar que nome_arquivo não é vazio
alter table public.pauta_arquivos
  add constraint arquivos_nome_not_empty
  check (char_length(trim(nome_arquivo)) > 0);

-- Validar comprimento máximo
alter table public.pauta_arquivos
  add constraint arquivos_nome_max_length
  check (char_length(nome_arquivo) <= 255);

-- Validar URL
alter table public.pauta_arquivos
  add constraint arquivos_url_not_empty
  check (char_length(trim(url)) > 0);

-- Validar tipo de arquivo
alter table public.pauta_arquivos
  add constraint arquivos_tipo_valid
  check (tipo in ('imagem', 'video', 'documento'));

-- Validar tamanho (não pode ser negativo ou zero)
alter table public.pauta_arquivos
  add constraint arquivos_tamanho_positive
  check (tamanho > 0);

-- Validar tamanho máximo (10MB = 10485760 bytes)
alter table public.pauta_arquivos
  add constraint arquivos_tamanho_max
  check (tamanho <= 10485760);

-- Validar ordem (não pode ser negativa)
alter table public.pauta_arquivos
  add constraint arquivos_ordem_non_negative
  check (ordem >= 0);

-- ============================================================================
-- VALIDAÇÕES ESPECÍFICAS POR MIME TYPE
-- ============================================================================

-- Função helper para validar MIME types
create or replace function public.is_valid_mime_type(file_type text, mime_type text)
returns boolean as $$
begin
  case file_type
    when 'imagem' then
      return mime_type in ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif');
    when 'video' then
      return mime_type in ('video/mp4', 'video/webm', 'video/quicktime');
    when 'documento' then
      return mime_type in ('application/pdf');
    else
      return false;
  end case;
end;
$$ language plpgsql immutable;

-- Adicionar coluna mime_type se não existir (para validação futura)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pauta_arquivos'
      and column_name = 'mime_type'
  ) then
    alter table public.pauta_arquivos add column mime_type text;
  end if;
end $$;

-- Constraint para validar MIME type baseado no tipo
alter table public.pauta_arquivos
  drop constraint if exists arquivos_mime_type_valid;

alter table public.pauta_arquivos
  add constraint arquivos_mime_type_valid
  check (mime_type is null or is_valid_mime_type(tipo, mime_type));

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índice para busca de pautas por cliente
create index if not exists idx_pautas_cliente on public.pautas(cliente);

-- Índice para busca de pautas por status e prazo
create index if not exists idx_pautas_status_prazo on public.pautas(status, data_prazo);

-- Índice para busca de comentários não resolvidos
create index if not exists idx_comentarios_pendentes
  on public.comentarios_pontuais(pauta_id, resolvido)
  where resolvido = false;

-- Índice para busca de arquivos por pauta (já existe, mas verificando)
create index if not exists idx_arquivos_pauta_ordem
  on public.pauta_arquivos(pauta_id, ordem);

-- ============================================================================
-- FUNÇÕES DE VALIDAÇÃO CUSTOMIZADAS
-- ============================================================================

/**
 * Valida se email tem formato correto
 */
create or replace function public.is_valid_email(email text)
returns boolean as $$
begin
  return email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
end;
$$ language plpgsql immutable;

/**
 * Valida se string não contém caracteres de controle perigosos
 */
create or replace function public.is_safe_text(text_input text)
returns boolean as $$
begin
  -- Rejeitar null bytes e outros caracteres de controle
  return text_input !~ '[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]';
end;
$$ language plpgsql immutable;

-- Aplicar validação de texto seguro em campos críticos
alter table public.pautas
  drop constraint if exists pautas_titulo_safe;
alter table public.pautas
  add constraint pautas_titulo_safe
  check (is_safe_text(titulo));

alter table public.comentarios_pontuais
  drop constraint if exists comentarios_texto_safe;
alter table public.comentarios_pontuais
  add constraint comentarios_texto_safe
  check (is_safe_text(comentario));

-- ============================================================================
-- CONSTRAINTS DE UNICIDADE
-- ============================================================================

-- Garantir que não haja duas pautas idênticas (mesmo título, cliente e data)
-- Comentado pois pode ser legítimo ter múltiplas pautas similares
-- create unique index idx_pautas_unique
--   on public.pautas(titulo, cliente, date_trunc('day', created_at))
--   where status != 'rascunho';

-- ============================================================================
-- TRIGGERS DE VALIDAÇÃO ADICIONAL
-- ============================================================================

/**
 * Trigger para normalizar dados antes de inserir
 */
create or replace function public.normalize_pauta_data()
returns trigger as $$
begin
  -- Trim whitespace
  NEW.titulo := trim(NEW.titulo);
  NEW.cliente := trim(NEW.cliente);

  if NEW.descricao is not null then
    NEW.descricao := trim(NEW.descricao);
  end if;

  if NEW.observacoes is not null then
    NEW.observacoes := trim(NEW.observacoes);
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Aplicar trigger
drop trigger if exists normalize_pauta_data_trigger on public.pautas;
create trigger normalize_pauta_data_trigger
  before insert or update on public.pautas
  for each row execute function public.normalize_pauta_data();

/**
 * Trigger para normalizar comentários
 */
create or replace function public.normalize_comentario_data()
returns trigger as $$
begin
  -- Trim whitespace
  NEW.comentario := trim(NEW.comentario);
  NEW.arquivo_id := trim(NEW.arquivo_id);

  if NEW.resposta is not null then
    NEW.resposta := trim(NEW.resposta);
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Aplicar trigger
drop trigger if exists normalize_comentario_data_trigger on public.comentarios_pontuais;
create trigger normalize_comentario_data_trigger
  before insert or update on public.comentarios_pontuais
  for each row execute function public.normalize_comentario_data();

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

comment on constraint pautas_titulo_not_empty on public.pautas is
  'Título deve ter no mínimo 3 caracteres (após trim)';

comment on constraint comentarios_x_coordenada_range on public.comentarios_pontuais is
  'Coordenada X em sistema percentual (0-100)';

comment on constraint arquivos_tamanho_max on public.pauta_arquivos is
  'Tamanho máximo de arquivo: 10MB (10485760 bytes)';

comment on function public.is_safe_text is
  'Valida que texto não contém null bytes ou caracteres de controle perigosos';
