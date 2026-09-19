import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PautaPublica, PecaPublica } from '@/types/aprovacao-publica';

// Só a ida ao servidor é substituída. `useRevisor` roda de verdade contra o
// sessionStorage do jsdom, porque o portão de identificação é parte do que esta
// tela promete — e é o único lugar onde ele aparece.
const estado = vi.hoisted(() => ({
  retorno: {} as Record<string, unknown>,
}));
vi.mock('@/hooks/useAprovacaoPublica', () => ({
  useAprovacaoPublica: () => estado.retorno,
}));

import { AprovacaoPublica } from '../AprovacaoPublica';

const TOKEN = 'a'.repeat(48);

const peca = (over: Partial<PecaPublica> = {}): PecaPublica => ({
  id: 'b1',
  peca: 'P01',
  tipo: 'estatico',
  data_postagem: '2026-12-03',
  ordem: 1,
  decisao: 'pendente',
  decisao_nota: null,
  decisao_por: null,
  decisao_em: null,
  chamada: 'Por que o 13º\nparece um dinheiro\nà parte',
  legenda: 'A legenda completa.',
  hashtags: '#EconomiaComportamental',
  arquivos: [],
  comentarios: [],
  ...over,
});

const pauta: PautaPublica['pauta'] = {
  id: 'p1',
  titulo: 'Dezembro 2026',
  cliente: 'VWPP',
  descricao: null,
  data_prazo: null,
  status: 'aguardando_aprovacao',
  revisao_enviada_em: null,
  revisao_enviada_por: null,
};

const mutacao = (over: Record<string, unknown> = {}) => ({
  isPending: false,
  error: null,
  variables: undefined,
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  ...over,
});

const preparar = (over: Record<string, unknown> = {}) => {
  const pecas = (over.pecas as PecaPublica[]) ?? [peca()];
  estado.retorno = {
    pauta,
    pecas,
    linkInvalido: false,
    decididas: pecas.filter((p) => p.decisao !== 'pendente').length,
    total: pecas.length,
    completa: pecas.length > 0 && pecas.every((p) => p.decisao !== 'pendente'),
    carregando: false,
    erro: null,
    entregue: false,
    entreguePor: '',
    decidir: mutacao(),
    comentar: mutacao(),
    enviarRevisao: mutacao(),
    ...over,
  };
  return estado.retorno;
};

const montar = () =>
  render(
    <MemoryRouter initialEntries={[`/aprovacao/${TOKEN}`]}>
      <Routes>
        <Route path="/aprovacao/:token" element={<AprovacaoPublica />} />
      </Routes>
    </MemoryRouter>,
  );

const identificar = (nome = 'Ana Beatriz') => {
  fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: nome } });
  fireEvent.click(screen.getByRole('button', { name: 'Começar' }));
};

const espiaoDe = (m: unknown) => (m as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync;

describe('AprovacaoPublica', () => {
  beforeEach(() => sessionStorage.clear());

  it('pede o nome antes de mostrar as peças', () => {
    preparar();
    montar();

    expect(screen.getByLabelText('Seu nome')).toBeInTheDocument();
    expect(screen.queryByTestId('peca-P01')).not.toBeInTheDocument();
  });

  it('mostra as peças depois que o revisor se identifica', async () => {
    preparar();
    montar();
    identificar();

    expect(await screen.findByTestId('peca-P01')).toBeInTheDocument();
    expect(screen.getByText(/Revisando como Ana Beatriz/)).toBeInTheDocument();
  });

  // O nome dura a sessão. Perguntar a cada peça seria pedágio; perguntar a cada
  // recarregamento também.
  it('não pergunta o nome de novo na mesma sessão', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana Beatriz');
    preparar();
    montar();

    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument();
    expect(screen.getByTestId('peca-P01')).toBeInTheDocument();
  });

  it('conta quantas peças faltam decidir', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar({ pecas: [peca(), peca({ id: 'b2', peca: 'P02', decisao: 'aprovada' })] });
    montar();

    expect(screen.getByTestId('progresso')).toHaveTextContent('1 de 2 decididas');
  });

  // Entregar é o momento que faltava: sem ele o cliente não sabe se já pode
  // fechar a aba, e a equipe não sabe se ele terminou ou parou no meio.
  it('só deixa entregar com todas as peças decididas', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar({ pecas: [peca(), peca({ id: 'b2', peca: 'P02', decisao: 'aprovada' })] });
    montar();

    const botao = screen.getByRole('button', { name: /Entregar minha revisão/ });
    expect(botao).toBeDisabled();
    expect(screen.getByTestId('entrega')).toHaveTextContent(/Faltam 1 peça/);
  });

  it('entrega quando nada fica pendente', async () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    const atual = preparar({ pecas: [peca({ decisao: 'aprovada' })] });
    montar();

    const botao = screen.getByRole('button', { name: /Entregar minha revisão/ });
    expect(botao).toBeEnabled();
    fireEvent.click(botao);

    await waitFor(() => expect(espiaoDe(atual.enviarRevisao)).toHaveBeenCalledWith({ por: 'Ana' }));
  });

  it('confirma quando a revisão já foi entregue', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar({
      pecas: [peca({ decisao: 'aprovada' })],
      entregue: true,
      entreguePor: 'Ana',
    });
    montar();

    expect(screen.getByTestId('revisao-entregue')).toHaveTextContent(/entregue por Ana/);
    expect(screen.getByRole('button', { name: /Entregar de novo/ })).toBeInTheDocument();
  });

  // `data_postagem` é `date`. `new Date('2026-12-03')` é meia-noite UTC, e a
  // oeste de Greenwich isso exibiria 02/12 — um dia antes do combinado.
  it('mostra a data de postagem sem deslocar pelo fuso', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar();
    montar();

    expect(screen.getByText('03/12/2026')).toBeInTheDocument();
  });

  it('não mostra pauta nenhuma quando o link não abre nada', () => {
    preparar({ linkInvalido: true, pauta: null, pecas: [], total: 0, decididas: 0 });
    montar();

    expect(screen.getByText(/Este link não abre nenhuma pauta/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument();
  });

  // Link inválido não melhora com insistência; falha de rede sim. Dizer
  // "não encontrado" para as duas mandaria o cliente conferir um link correto.
  it('separa falha de rede de link inválido', () => {
    preparar({ erro: new Error('fetch failed') });
    montar();

    expect(screen.getByText(/Verifique a conexão/)).toBeInTheDocument();
    expect(screen.queryByText(/Este link não abre/)).not.toBeInTheDocument();
  });

  it('exige motivo antes de deixar pedir ajuste', async () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    const atual = preparar();
    montar();

    fireEvent.click(screen.getByRole('button', { name: /Pedir ajuste/ }));
    const enviar = await screen.findByRole('button', { name: /Enviar pedido/ });
    expect(enviar).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Motivo do ajuste'), { target: { value: '   ' } });
    expect(enviar).toBeDisabled();
    expect(espiaoDe(atual.decidir)).not.toHaveBeenCalled();
  });

  it('manda o motivo junto da reprovação', async () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    const atual = preparar();
    montar();

    fireEvent.click(screen.getByRole('button', { name: /Pedir ajuste/ }));
    fireEvent.change(await screen.findByLabelText('Motivo do ajuste'), {
      target: { value: 'Escurecer o fundo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar pedido/ }));

    await waitFor(() =>
      expect(espiaoDe(atual.decidir)).toHaveBeenCalledWith({
        blocoId: 'b1',
        status: 'reprovada',
        nota: 'Escurecer o fundo',
        por: 'Ana',
      }),
    );
  });

  // A mensagem do banco é a regra em texto. Reescrevê-la esconderia do cliente
  // o que ele precisa fazer — e ela tem de aparecer na peça que a provocou,
  // porque a mutação é uma só para todas.
  it('mostra a recusa do banco na peça que a provocou', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar({
      pecas: [peca(), peca({ id: 'b2', peca: 'P02' })],
      decidir: mutacao({
        error: new Error('Diga no comentário o que precisa mudar.'),
        variables: { blocoId: 'b2' },
      }),
    });
    montar();

    const erros = screen.getAllByTestId('erro-decisao');
    expect(erros).toHaveLength(1);
    expect(screen.getByTestId('peca-P02')).toContainElement(erros[0]);
    expect(erros[0]).toHaveTextContent('Diga no comentário o que precisa mudar.');
  });

  // Bloco sem arquivo é pauta, não peça defeituosa: publicar na etapa final
  // recusa peça sem arte. O cliente precisa saber que está aprovando a ideia e
  // que a arte volta para ele depois — antes isto aparecia como aviso de arte
  // faltando, que lê como defeito.
  it('sem arte, o cartão se apresenta como pauta e explica o que vem depois', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar({ pecas: [peca({ arquivos: [] })] });
    montar();

    expect(screen.getByText(/aprova a ideia/)).toBeInTheDocument();
    expect(screen.getByText(/a arte vem depois/i)).toBeInTheDocument();
    expect(screen.queryByText(/ainda não tem arte publicada/)).toBeNull();
  });

  it('com arte, o texto continua rotulado como legenda', () => {
    sessionStorage.setItem('aprovaarte:revisor', 'Ana');
    preparar({
      pecas: [
        peca({
          arquivos: [
            {
              id: 'a1',
              url: 'https://exemplo/p01.png',
              tipo: 'imagem',
              nome: 'p01.png',
              item_ordem: 0,
              item_titulo: null,
            },
          ],
        }),
      ],
    });
    montar();

    expect(screen.getByText('Legenda')).toBeInTheDocument();
    expect(screen.queryByText('Abordagem')).toBeNull();
  });
});
