-- Criar tabela profiles para membros da equipe sincronizados do MiraPauta
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text,
  avatar_url text,
  mirapauta_profile_id uuid,
  ativo boolean NOT NULL DEFAULT true,
  sincronizado_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar profiles" ON public.profiles
  FOR UPDATE USING (true);

CREATE POLICY "Usuários podem excluir profiles" ON public.profiles
  FOR DELETE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();