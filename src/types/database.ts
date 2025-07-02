export type PautaStatus = 'rascunho' | 'aguardando_aprovacao' | 'aprovada' | 'rejeitada';
export type ArquivoTipo = 'imagem' | 'video' | 'documento';

export interface Pauta {
  id: string;
  titulo: string;
  descricao?: string;
  cliente: string;
  data_prazo?: string;
  status: PautaStatus;
  observacoes?: string;
  criado_por?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  created_at: string;
  updated_at: string;
}

export interface PautaArquivo {
  id: string;
  pauta_id: string;
  nome_arquivo: string;
  tipo: ArquivoTipo;
  url: string;
  tamanho?: number;
  ordem: number;
  created_at: string;
}

export interface ComentarioPontual {
  id: string;
  pauta_id: string;
  arquivo_id: string;
  x_coordenada: number;
  y_coordenada: number;
  comentario: string;
  resolvido: boolean;
  criado_por?: string;
  respondido_por?: string;
  resposta?: string;
  data_resposta?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoAprovacao {
  id: string;
  pauta_id: string;
  status_anterior?: PautaStatus;
  status_novo: PautaStatus;
  comentario?: string;
  usuario_id?: string;
  created_at: string;
}

export interface CreatePautaData {
  titulo: string;
  descricao?: string;
  cliente: string;
  data_prazo?: string;
  observacoes?: string;
}

export interface UpdatePautaData {
  titulo?: string;
  descricao?: string;
  cliente?: string;
  data_prazo?: string;
  status?: PautaStatus;
  observacoes?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
}