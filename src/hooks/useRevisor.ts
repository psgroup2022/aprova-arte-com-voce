import { useCallback, useState } from 'react';

/**
 * Quem está revisando, declarado uma vez por sessão.
 *
 * O cliente não tem conta, então o nome é a única coisa que liga um apontamento
 * a uma pessoa — e o banco exige: `decidir_bloco` recusa decisão sem alguém
 * identificado. Perguntar de novo a cada peça seria pedágio; perguntar uma vez
 * e guardar resolve.
 *
 * `sessionStorage`, não `localStorage`: fechou a aba, acabou. Um link de
 * aprovação costuma circular por e-mail e ser aberto em máquina compartilhada —
 * o nome de quem revisou ontem não deve ser atribuído a quem abrir amanhã.
 */

export const CHAVE_REVISOR = 'aprovaarte:revisor';

/** Nome vazio ou só espaços não identifica ninguém, e o banco recusaria. */
const limpar = (valor: string | null) => (valor ?? '').trim();

const ler = (): string => {
  try {
    return limpar(sessionStorage.getItem(CHAVE_REVISOR));
  } catch {
    // Navegador com armazenamento bloqueado ainda deve deixar revisar; só
    // perguntará o nome de novo se a página recarregar.
    return '';
  }
};

export const useRevisor = () => {
  const [nome, setNome] = useState<string>(ler);

  const declarar = useCallback((valor: string) => {
    const limpo = limpar(valor);
    if (!limpo) return false;
    try {
      sessionStorage.setItem(CHAVE_REVISOR, limpo);
    } catch {
      /* segue sem lembrar */
    }
    setNome(limpo);
    return true;
  }, []);

  const esquecer = useCallback(() => {
    try {
      sessionStorage.removeItem(CHAVE_REVISOR);
    } catch {
      /* nada a limpar */
    }
    setNome('');
  }, []);

  return { nome, identificado: nome.length > 0, declarar, esquecer };
};
