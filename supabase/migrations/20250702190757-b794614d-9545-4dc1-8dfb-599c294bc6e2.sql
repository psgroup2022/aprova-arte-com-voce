-- Atualizar política RLS para permitir comentários anônimos temporariamente
DROP POLICY IF EXISTS "Usuários podem criar comentários" ON public.comentarios_pontuais;

CREATE POLICY "Usuários podem criar comentários" 
ON public.comentarios_pontuais 
FOR INSERT 
WITH CHECK (
  -- Permite comentários anônimos (criado_por = null) ou comentários de usuários autenticados
  criado_por IS NULL OR auth.uid() = criado_por
);