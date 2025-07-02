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