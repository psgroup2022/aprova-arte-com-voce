// Tipos de material disponíveis
export type TipoMaterial = 
  | 'carrossel' 
  | 'story' 
  | 'reels' 
  | 'estatico' 
  | 'linkedin_artigo' 
  | 'email' 
  | 'whatsapp';

// Status do bloco de material
export type BlocoStatus = 
  | 'aguardando_midia' 
  | 'pronto' 
  | 'enviado_aprovacao' 
  | 'em_revisao' 
  | 'aprovado';

// Configuração de campos por tipo de material
export const MATERIAL_CONFIG: Record<TipoMaterial, {
  label: string;
  icon: string;
  itemLabel: string;
  hasMultipleItems: boolean;
  defaultItemCount: number;
  fields: {
    titulo?: boolean;
    assunto?: boolean;
    corpo?: boolean;
    texto?: boolean;
    hashtags?: boolean;
    midia?: boolean;
  };
  singleUploadAtBlock?: boolean; // Upload único no nível do bloco (Reels = 1 vídeo, Carrossel = múltiplas imagens)
}> = {
  carrossel: {
    label: 'Carrossel',
    icon: 'Images',
    itemLabel: 'Slide',
    hasMultipleItems: true,
    defaultItemCount: 3,
    fields: { texto: true, hashtags: true, midia: true },
    singleUploadAtBlock: true
  },
  story: {
    label: 'Story',
    icon: 'Smartphone',
    itemLabel: 'Tela',
    hasMultipleItems: true,
    defaultItemCount: 1,
    fields: { texto: true, hashtags: true, midia: true }
  },
  reels: {
    label: 'Reels',
    icon: 'Film',
    itemLabel: 'Cena',
    hasMultipleItems: true,
    defaultItemCount: 1,
    fields: { texto: true, hashtags: true, midia: true },
    singleUploadAtBlock: true
  },
  estatico: {
    label: 'Estático',
    icon: 'Image',
    itemLabel: 'Peça',
    hasMultipleItems: false,
    defaultItemCount: 1,
    fields: { texto: true, hashtags: true, midia: true }
  },
  linkedin_artigo: {
    label: 'LinkedIn Artigo',
    icon: 'Linkedin',
    itemLabel: 'Artigo',
    hasMultipleItems: false,
    defaultItemCount: 1,
    fields: { titulo: true, corpo: true }
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    itemLabel: 'Email',
    hasMultipleItems: false,
    defaultItemCount: 1,
    fields: { assunto: true, corpo: true }
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'MessageCircle',
    itemLabel: 'Mensagem',
    hasMultipleItems: false,
    defaultItemCount: 1,
    fields: { texto: true }
  }
};

// Status labels para exibição
export const BLOCO_STATUS_LABELS: Record<BlocoStatus, string> = {
  aguardando_midia: 'Aguardando mídia',
  pronto: 'Pronto',
  enviado_aprovacao: 'Enviado para aprovação',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado'
};

// Item dentro de um bloco (slide, tela, etc.)
export interface BlocoItem {
  id?: string;
  titulo: string;
  assunto: string;
  texto_conteudo: string;
  hashtags: string;
  arquivos: File[];
  arquivosUrls: string[];
  ordem: number;
}

// Bloco de material (carrossel, story, etc.)
export interface BlocoMaterial {
  id?: string;
  tipo: TipoMaterial;
  status: BlocoStatus;
  itens: BlocoItem[];
  ordem: number;
}

// Versão da pauta
export interface PautaVersao {
  id?: string;
  numero: number;
  ativa: boolean;
  briefingUrl?: string;
  blocos: BlocoMaterial[];
  createdAt?: string;
}

// Dados do formulário principal
export interface PautaFormData {
  titulo: string;
  cliente_id: string;
  data_prevista: string;
  tags: string[];
  observacoes_internas: string;
  legenda_final: string;
  hashtags_principais: string[];
  versoes: PautaVersao[];
  versao_ativa: number;
}

// Função auxiliar para criar um item vazio
export const createEmptyItem = (ordem: number = 0): BlocoItem => ({
  titulo: '',
  assunto: '',
  texto_conteudo: '',
  hashtags: '',
  arquivos: [],
  arquivosUrls: [],
  ordem
});

// Função auxiliar para criar um bloco vazio
export const createEmptyBloco = (tipo: TipoMaterial, ordem: number = 0): BlocoMaterial => {
  const config = MATERIAL_CONFIG[tipo];
  const itens: BlocoItem[] = [];
  
  for (let i = 0; i < config.defaultItemCount; i++) {
    itens.push(createEmptyItem(i));
  }
  
  return {
    tipo,
    status: 'aguardando_midia',
    itens,
    ordem
  };
};

// Função auxiliar para criar uma versão vazia
export const createEmptyVersao = (numero: number = 1): PautaVersao => ({
  numero,
  ativa: true,
  blocos: []
});

// Função auxiliar para criar o form data inicial
export const createInitialFormData = (): PautaFormData => ({
  titulo: '',
  cliente_id: '',
  data_prevista: '',
  tags: [],
  observacoes_internas: '',
  legenda_final: '',
  hashtags_principais: [],
  versoes: [createEmptyVersao(1)],
  versao_ativa: 1
});

// Tipos legados para compatibilidade
export type PostType = "feed" | "story" | "reel" | "carousel" | "facebook" | "twitter";

export interface PostData {
  legenda: string;
  hashtags: string;
  arquivo?: File;
}

export interface FormData {
  titulo: string;
  tipo_post: PostType | "";
  quantidade_materiais: number;
  data_prazo: string;
  responsavel: string;
  tags: string[];
  cliente_id: string;
  observacoes: string;
  posts: PostData[];
}
