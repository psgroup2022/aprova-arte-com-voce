-- Criar ENUMs para tipos de material e status
CREATE TYPE material_tipo AS ENUM (
  'carrossel', 'story', 'reels', 'estatico', 
  'linkedin_artigo', 'email', 'whatsapp'
);

CREATE TYPE bloco_status AS ENUM (
  'aguardando_midia', 'pronto', 'enviado_aprovacao', 
  'em_revisao', 'aprovado'
);

-- Adicionar novos campos na tabela pautas
ALTER TABLE public.pautas 
ADD COLUMN IF NOT EXISTS legenda_final text,
ADD COLUMN IF NOT EXISTS hashtags_principais text[];

-- Criar tabela de versões da pauta
CREATE TABLE public.pauta_versoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pauta_id uuid NOT NULL REFERENCES public.pautas(id) ON DELETE CASCADE,
  numero_versao integer NOT NULL DEFAULT 1,
  ativa boolean NOT NULL DEFAULT true,
  briefing_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(pauta_id, numero_versao)
);

-- Criar tabela de blocos de material
CREATE TABLE public.blocos_material (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao_id uuid NOT NULL REFERENCES public.pauta_versoes(id) ON DELETE CASCADE,
  tipo_material material_tipo NOT NULL,
  status bloco_status NOT NULL DEFAULT 'aguardando_midia',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de itens do bloco (slides, telas, cards)
CREATE TABLE public.bloco_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bloco_id uuid NOT NULL REFERENCES public.blocos_material(id) ON DELETE CASCADE,
  titulo text,
  texto_conteudo text,
  hashtags text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de arquivos do bloco
CREATE TABLE public.bloco_arquivos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.bloco_itens(id) ON DELETE CASCADE,
  url text NOT NULL,
  tipo arquivo_tipo NOT NULL,
  nome_arquivo text NOT NULL,
  tamanho integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.pauta_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloco_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloco_arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pauta_versoes
CREATE POLICY "Usuários podem ver versões" ON public.pauta_versoes FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar versões" ON public.pauta_versoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar versões" ON public.pauta_versoes FOR UPDATE USING (true);
CREATE POLICY "Usuários podem excluir versões" ON public.pauta_versoes FOR DELETE USING (true);

-- Políticas RLS para blocos_material
CREATE POLICY "Usuários podem ver blocos" ON public.blocos_material FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar blocos" ON public.blocos_material FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar blocos" ON public.blocos_material FOR UPDATE USING (true);
CREATE POLICY "Usuários podem excluir blocos" ON public.blocos_material FOR DELETE USING (true);

-- Políticas RLS para bloco_itens
CREATE POLICY "Usuários podem ver itens" ON public.bloco_itens FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar itens" ON public.bloco_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar itens" ON public.bloco_itens FOR UPDATE USING (true);
CREATE POLICY "Usuários podem excluir itens" ON public.bloco_itens FOR DELETE USING (true);

-- Políticas RLS para bloco_arquivos
CREATE POLICY "Usuários podem ver arquivos de bloco" ON public.bloco_arquivos FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar arquivos de bloco" ON public.bloco_arquivos FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem excluir arquivos de bloco" ON public.bloco_arquivos FOR DELETE USING (true);

-- Triggers para updated_at
CREATE TRIGGER update_pauta_versoes_updated_at
  BEFORE UPDATE ON public.pauta_versoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocos_material_updated_at
  BEFORE UPDATE ON public.blocos_material
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bloco_itens_updated_at
  BEFORE UPDATE ON public.bloco_itens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();