-- Adicionar campos de tasks do MiraPauta à tabela pautas
-- Esta migration adiciona todas as informações relevantes das tasks do MiraPauta

BEGIN;

-- Campos de task do MiraPauta
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_task_title TEXT;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_descricao TEXT;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_ticket TEXT;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_assignee_id TEXT;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_assignee_nome TEXT;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_prazo_entrega TIMESTAMPTZ;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_data_inicio TIMESTAMPTZ;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_task_status TEXT;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_peso INTEGER;
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_tempo_gasto INTEGER;

-- Comentários explicativos
COMMENT ON COLUMN pautas.mirapauta_task_title IS 'Título da task no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_descricao IS 'Descrição da task no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_ticket IS 'Número do ticket no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_assignee_id IS 'UUID do usuário responsável no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_assignee_nome IS 'Nome do usuário responsável no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_prazo_entrega IS 'Prazo de entrega da task no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_data_inicio IS 'Data de início da task no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_task_status IS 'Status da task no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_peso IS 'Peso/prioridade da task no MiraPauta';
COMMENT ON COLUMN pautas.mirapauta_tempo_gasto IS 'Tempo gasto na task (em minutos) no MiraPauta';

-- Índice para buscar por ticket do MiraPauta
CREATE INDEX IF NOT EXISTS idx_pautas_mirapauta_ticket ON pautas(mirapauta_ticket) WHERE mirapauta_ticket IS NOT NULL;

-- Índice para buscar por assignee do MiraPauta
CREATE INDEX IF NOT EXISTS idx_pautas_mirapauta_assignee ON pautas(mirapauta_assignee_id) WHERE mirapauta_assignee_id IS NOT NULL;

COMMIT;
