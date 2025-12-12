-- Tornar arquivo_id nullable na tabela comentarios_pontuais
-- Isso permite comentários gerais (não associados a um arquivo específico)

-- 1. Remover a foreign key constraint existente
ALTER TABLE public.comentarios_pontuais
DROP CONSTRAINT IF EXISTS comentarios_pontuais_arquivo_id_fkey;

-- 2. Alterar a coluna para permitir NULL
ALTER TABLE public.comentarios_pontuais
ALTER COLUMN arquivo_id DROP NOT NULL;

-- 3. Recriar a foreign key constraint permitindo NULL
ALTER TABLE public.comentarios_pontuais
ADD CONSTRAINT comentarios_pontuais_arquivo_id_fkey
FOREIGN KEY (arquivo_id) REFERENCES public.pauta_arquivos(id) ON DELETE CASCADE;

-- 4. Atualizar valores 'geral' existentes para NULL
UPDATE public.comentarios_pontuais
SET arquivo_id = NULL
WHERE arquivo_id = 'geral';

-- Comentário explicativo
COMMENT ON COLUMN public.comentarios_pontuais.arquivo_id IS 
'ID do arquivo associado ao comentário. NULL indica um comentário geral (não pontual).';
