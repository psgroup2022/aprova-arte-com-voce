export interface ComentarioPontual {
  id: string;
  pauta_id: string;
  arquivo_id?: string;
  x_coordenada?: number;
  y_coordenada?: number;
  comentario: string;
  resolvido: boolean;
  criado_por?: string;
  created_at: string;
}

export interface PendingPin {
  x: number;
  y: number;
  arquivoId: string;
}