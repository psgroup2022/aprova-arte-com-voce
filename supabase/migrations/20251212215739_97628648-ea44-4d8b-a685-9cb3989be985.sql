-- Remover a foreign key de arquivo_id que aponta para pauta_arquivos
-- pois os arquivos estão em bloco_arquivos
ALTER TABLE public.comentarios_pontuais
DROP CONSTRAINT IF EXISTS comentarios_pontuais_arquivo_id_fkey;