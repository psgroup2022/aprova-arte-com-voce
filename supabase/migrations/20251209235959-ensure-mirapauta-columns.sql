-- Garantir que as colunas mirapauta_id e origem existem na tabela pautas
-- Esta é uma migration defensiva que não falha se as colunas já existem

BEGIN;

-- Adicionar mirapauta_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pautas' AND column_name = 'mirapauta_id'
  ) THEN
    ALTER TABLE pautas ADD COLUMN mirapauta_id TEXT UNIQUE;
    CREATE INDEX idx_pautas_mirapauta_id ON pautas(mirapauta_id) WHERE mirapauta_id IS NOT NULL;
    COMMENT ON COLUMN pautas.mirapauta_id IS 'ID da pauta no sistema MiraPauta (para evitar duplicatas na importação)';
  END IF;
END $$;

-- Adicionar origem se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pautas' AND column_name = 'origem'
  ) THEN
    ALTER TABLE pautas ADD COLUMN origem TEXT DEFAULT 'manual';
    COMMENT ON COLUMN pautas.origem IS 'Origem da pauta: manual ou mirapauta';
  END IF;
END $$;

COMMIT;
