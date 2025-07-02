-- Atualizar política de UPDATE para comentários pontuais
DROP POLICY IF EXISTS "Criadores podem atualizar comentários" ON comentarios_pontuais;

CREATE POLICY "Usuários podem atualizar comentários"
ON comentarios_pontuais
FOR UPDATE
USING (true);

-- Adicionar política de DELETE para comentários pontuais
CREATE POLICY "Usuários podem excluir comentários"
ON comentarios_pontuais
FOR DELETE
USING (true);