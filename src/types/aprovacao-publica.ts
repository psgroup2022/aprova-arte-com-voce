/**
 * O que o cliente recebe pelo link.
 *
 * Isto não é o formato das tabelas: é o que `pauta_publica(token)` monta e
 * devolve. O cliente não tem permissão em tabela alguma — o `types.ts` gerado
 * descreve essa função apenas como `Returns: Json`, porque o Postgres não sabe
 * o formato de um `jsonb` montado à mão. Então o contrato mora aqui.
 *
 * Quem mexer na função em `supabase/migrations/` mexe aqui junto. Não há
 * verificação automática entre os dois — o que cobre isso é o teste de
 * `useAprovacaoPublica`, que responde com uma carga neste mesmo formato.
 */

export type DecisaoCliente = 'pendente' | 'aprovada' | 'reprovada';

/** Uma arte da peça. Num carrossel há várias, uma por slide. */
export interface ArteDaPeca {
  id: string;
  url: string;
  tipo: 'imagem' | 'video' | 'documento';
  nome: string;
  /** Posição do item dono desta arte. 0 é o primeiro. */
  item_ordem: number;
  item_titulo: string | null;
}

/** Apontamento sobre um ponto da arte. `x`/`y` em percentual, nunca em pixel. */
export interface ApontamentoPublico {
  id: string;
  x: number;
  y: number;
  /** A arte em que o pino foi cravado. Nulo em observação sobre a peça inteira. */
  arquivo_id: string | null;
  texto: string;
  autor: string | null;
  resolvido: boolean;
  /** Resposta da equipe, quando houver. */
  resposta: string | null;
  criado_em: string;
}

export interface PecaPublica {
  id: string;
  /** "P01", "P02"... a identidade da peça no ciclo. */
  peca: string | null;
  tipo: string;
  data_postagem: string | null;
  ordem: number;
  decisao: DecisaoCliente;
  decisao_nota: string | null;
  decisao_por: string | null;
  decisao_em: string | null;
  chamada: string | null;
  legenda: string | null;
  hashtags: string | null;
  arquivos: ArteDaPeca[];
  comentarios: ApontamentoPublico[];
}

export interface PautaPublica {
  pauta: {
    id: string;
    titulo: string;
    cliente: string;
    descricao: string | null;
    data_prazo: string | null;
    status: string;
    /** Quando o cliente declarou a revisão terminada. Zerado por qualquer
     *  mudança posterior: revisão alterada não está mais entregue. */
    revisao_enviada_em: string | null;
    revisao_enviada_por: string | null;
  };
  pecas: PecaPublica[];
}

/** Rótulos por tipo de material, iguais aos do painel interno. */
export const TIPO_LABEL: Record<string, string> = {
  carrossel: 'Carrossel',
  story: 'Story',
  reels: 'Reels',
  estatico: 'Post estático',
  linkedin_artigo: 'LinkedIn',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
};

/** Como se chama cada arte quando a peça tem mais de uma. */
export const ITEM_LABEL: Record<string, string> = {
  carrossel: 'Slide',
  reels: 'Cena',
  story: 'Tela',
};
