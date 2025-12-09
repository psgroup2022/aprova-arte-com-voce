-- Adicionar campo mirapauta_id para rastrear pautas importadas do MiraPauta
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS mirapauta_id TEXT UNIQUE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_pautas_mirapauta_id ON pautas(mirapauta_id) WHERE mirapauta_id IS NOT NULL;

-- Adicionar campo para rastrear origem da pauta
ALTER TABLE pautas ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';

COMMENT ON COLUMN pautas.mirapauta_id IS 'ID da pauta no sistema MiraPauta (para evitar duplicatas na importação)';
COMMENT ON COLUMN pautas.origem IS 'Origem da pauta: manual ou mirapauta';
