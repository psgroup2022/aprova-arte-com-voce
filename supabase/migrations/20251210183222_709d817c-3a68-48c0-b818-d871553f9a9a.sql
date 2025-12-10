-- Adicionar campos para rastreamento de sincronização com MiraPauta
ALTER TABLE public.pautas 
ADD COLUMN IF NOT EXISTS mirapauta_task_id uuid UNIQUE,
ADD COLUMN IF NOT EXISTS mirapauta_cliente_id uuid,
ADD COLUMN IF NOT EXISTS mirapauta_sincronizado_em timestamp with time zone;

-- Criar índice para busca rápida por mirapauta_task_id
CREATE INDEX IF NOT EXISTS idx_pautas_mirapauta_task_id ON public.pautas(mirapauta_task_id) WHERE mirapauta_task_id IS NOT NULL;

-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;