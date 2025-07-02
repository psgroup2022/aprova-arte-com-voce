-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuários podem ver clientes" 
ON public.clientes 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem criar clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar clientes" 
ON public.clientes 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários podem excluir clientes" 
ON public.clientes 
FOR DELETE 
USING (true);

-- Add trigger for timestamps
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar policy de DELETE para pautas
CREATE POLICY "Criadores podem excluir suas pautas" 
ON public.pautas 
FOR DELETE 
USING (auth.uid() = criado_por);