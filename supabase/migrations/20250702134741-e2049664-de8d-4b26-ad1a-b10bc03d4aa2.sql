-- Criar enum para status das pautas
CREATE TYPE public.pauta_status AS ENUM ('rascunho', 'aguardando_aprovacao', 'aprovada', 'rejeitada');

-- Criar enum para tipos de arquivo
CREATE TYPE public.arquivo_tipo AS ENUM ('imagem', 'video', 'documento');

-- Tabela de pautas
CREATE TABLE public.pautas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    cliente TEXT NOT NULL,
    data_prazo TIMESTAMPTZ,
    status pauta_status NOT NULL DEFAULT 'rascunho',
    observacoes TEXT,
    criado_por UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    data_aprovacao TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de arquivos das pautas
CREATE TABLE public.pauta_arquivos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pauta_id UUID NOT NULL REFERENCES public.pautas(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    tipo arquivo_tipo NOT NULL,
    url TEXT NOT NULL,
    tamanho INTEGER,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de comentários pontuais
CREATE TABLE public.comentarios_pontuais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pauta_id UUID NOT NULL REFERENCES public.pautas(id) ON DELETE CASCADE,
    arquivo_id UUID NOT NULL REFERENCES public.pauta_arquivos(id) ON DELETE CASCADE,
    x_coordenada INTEGER NOT NULL,
    y_coordenada INTEGER NOT NULL,
    comentario TEXT NOT NULL,
    resolvido BOOLEAN NOT NULL DEFAULT false,
    criado_por UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    respondido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resposta TEXT,
    data_resposta TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de histórico de aprovações
CREATE TABLE public.historico_aprovacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pauta_id UUID NOT NULL REFERENCES public.pautas(id) ON DELETE CASCADE,
    status_anterior pauta_status,
    status_novo pauta_status NOT NULL,
    comentario TEXT,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar buckets para storage
INSERT INTO storage.buckets (id, name, public) VALUES 
('pauta-arquivos', 'pauta-arquivos', true),
('avatars', 'avatars', true);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pauta_arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_pontuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_aprovacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pautas (todos podem ver, apenas criadores podem editar)
CREATE POLICY "Usuários podem ver todas as pautas" 
ON public.pautas FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem criar pautas" 
ON public.pautas FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Criadores podem atualizar suas pautas" 
ON public.pautas FOR UPDATE 
TO authenticated 
USING (auth.uid() = criado_por);

-- Políticas para arquivos
CREATE POLICY "Usuários podem ver arquivos das pautas" 
ON public.pauta_arquivos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem inserir arquivos" 
ON public.pauta_arquivos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Políticas para comentários
CREATE POLICY "Usuários podem ver comentários" 
ON public.comentarios_pontuais FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem criar comentários" 
ON public.comentarios_pontuais FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Criadores podem atualizar comentários" 
ON public.comentarios_pontuais FOR UPDATE 
TO authenticated 
USING (auth.uid() = criado_por OR auth.uid() = respondido_por);

-- Políticas para histórico
CREATE POLICY "Usuários podem ver histórico" 
ON public.historico_aprovacoes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem inserir histórico" 
ON public.historico_aprovacoes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = usuario_id);

-- Políticas de storage para arquivos das pautas
CREATE POLICY "Usuários podem ver arquivos de pautas" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'pauta-arquivos');

CREATE POLICY "Usuários podem fazer upload de arquivos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'pauta-arquivos');

CREATE POLICY "Usuários podem deletar arquivos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'pauta-arquivos');

-- Políticas para avatars
CREATE POLICY "Avatars são públicos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_pautas_updated_at
    BEFORE UPDATE ON public.pautas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comentarios_updated_at
    BEFORE UPDATE ON public.comentarios_pontuais
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar histórico automaticamente
CREATE OR REPLACE FUNCTION public.create_approval_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.historico_aprovacoes (
            pauta_id, 
            status_anterior, 
            status_novo, 
            usuario_id
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para histórico de aprovações
CREATE TRIGGER create_pauta_history
    AFTER UPDATE ON public.pautas
    FOR EACH ROW
    EXECUTE FUNCTION public.create_approval_history();