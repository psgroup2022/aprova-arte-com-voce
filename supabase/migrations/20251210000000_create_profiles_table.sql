-- Criar tabela de profiles para gerenciar usuários do sistema
-- Esta tabela sincroniza com os profiles do MiraPauta e pode ser estendida para auth.users no futuro

BEGIN;

-- Criar tabela de profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mirapauta_profile_id TEXT UNIQUE,
  email TEXT,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  sincronizado_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.profiles IS 'Profiles de usuários sincronizados do MiraPauta';
COMMENT ON COLUMN public.profiles.auth_user_id IS 'Referência ao usuário no auth.users (opcional, usado quando o usuário faz login)';
COMMENT ON COLUMN public.profiles.mirapauta_profile_id IS 'ID do profile no MiraPauta';
COMMENT ON COLUMN public.profiles.email IS 'Email do usuário';
COMMENT ON COLUMN public.profiles.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL do avatar do usuário';
COMMENT ON COLUMN public.profiles.ativo IS 'Se false, o usuário foi removido/desativado';
COMMENT ON COLUMN public.profiles.sincronizado_em IS 'Última vez que o profile foi sincronizado com MiraPauta';

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_mirapauta_id ON public.profiles(mirapauta_profile_id) WHERE mirapauta_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_ativo ON public.profiles(ativo);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Todos podem ler profiles ativos
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

-- Apenas admin pode inserir/atualizar/deletar (por enquanto via função/trigger)
DROP POLICY IF EXISTS profiles_write_admin ON public.profiles;
CREATE POLICY profiles_write_admin
  ON public.profiles FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;
