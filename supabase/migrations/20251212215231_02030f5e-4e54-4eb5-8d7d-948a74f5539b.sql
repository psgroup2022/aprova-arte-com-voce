-- Tornar arquivo_id nullable para permitir comentários gerais (sem arquivo específico)
ALTER TABLE public.comentarios_pontuais
ALTER COLUMN arquivo_id DROP NOT NULL;