export interface ComentarioPontual {
  id: string;
  pauta_id: string;
  arquivo_id?: string | null;
  x_coordenada?: number | null;
  y_coordenada?: number | null;
  comentario: string;
  resolvido: boolean;
  criado_por?: string | null;
  created_at: string;
}

export interface PendingPin {
  x: number;
  y: number;
  arquivoId: string;
}
