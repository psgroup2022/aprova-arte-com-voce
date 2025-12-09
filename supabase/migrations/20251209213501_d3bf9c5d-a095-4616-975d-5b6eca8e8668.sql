-- Política para permitir que qualquer usuário (incluindo clientes não autenticados) 
-- possa atualizar pautas para aprovação via link compartilhado
CREATE POLICY "Qualquer pessoa pode atualizar status para aprovação" 
ON public.pautas 
FOR UPDATE 
USING (true)
WITH CHECK (true);