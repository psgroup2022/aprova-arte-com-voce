import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAprovacaoPublica } from '../useAprovacaoPublica';
import type { PautaPublica, PecaPublica } from '@/types/aprovacao-publica';

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
  chamada: 'Uma chamada',
  legenda: 'Uma legenda',
  hashtags: null,
  arquivos: [],
  comentarios: [],
  ...over,
});

const carga = (pecas: PecaPublica[]): PautaPublica => ({
  pauta: {
    id: 'p1',
    titulo: 'Dezembro 2026',
    cliente: 'VWPP',
    descricao: null,
    data_prazo: null,
    status: 'aguardando_aprovacao',
    revisao_enviada_em: null,
    revisao_enviada_por: null,
  },
  pecas,
});

type Resposta =
  | { data: unknown; error: unknown }
  | ((args: unknown) => { data: unknown; error: unknown });

function fakeCliente(respostas: Record<string, Resposta>) {
  const chamadas: Array<{ nome: string; args: Record<string, unknown> }> = [];
  const client = {
    rpc: (nome: string, args: Record<string, unknown>) => {
      chamadas.push({ nome, args });
      const r = respostas[nome];
      if (!r) throw new Error(`teste não preparou resposta para ${nome}`);
      return Promise.resolve(typeof r === 'function' ? r(args) : r);
    },
  };
  return { chamadas, client } as const;
}

const montar = (client: unknown) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useAprovacaoPublica(TOKEN, client as never), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
};

describe('useAprovacaoPublica', () => {
  it('lê a pauta pelo token e conta o que falta decidir', async () => {
    const { client } = fakeCliente({
      pauta_publica: {
        data: carga([peca(), peca({ id: 'b2', peca: 'P02', decisao: 'aprovada' })]),
        error: null,
      },
    });
    const { result } = montar(client);

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.pauta?.titulo).toBe('Dezembro 2026');
    expect(result.current.total).toBe(2);
    expect(result.current.decididas).toBe(1);
    expect(result.current.completa).toBe(false);
  });

  // A função devolve nulo para token desconhecido, e nulo não é erro. Confundir
  // os dois mandaria o cliente conferir um link que está certo.
  it('distingue link que não abre nada de falha de rede', async () => {
    const { client } = fakeCliente({ pauta_publica: { data: null, error: null } });
    const { result } = montar(client);

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.linkInvalido).toBe(true);
    expect(result.current.erro).toBeNull();
  });

  it('trata erro de rede como erro, não como link inválido', async () => {
    const { client } = fakeCliente({
      pauta_publica: { data: null, error: new Error('fetch failed') },
    });
    const { result } = montar(client);

    await waitFor(() => expect(result.current.erro).not.toBeNull());
    expect(result.current.linkInvalido).toBe(false);
  });

  it('marca a pauta como completa quando nada fica pendente', async () => {
    const { client } = fakeCliente({
      pauta_publica: {
        data: carga([peca({ decisao: 'aprovada' }), peca({ id: 'b2', decisao: 'reprovada' })]),
        error: null,
      },
    });
    const { result } = montar(client);

    await waitFor(() => expect(result.current.completa).toBe(true));
  });

  // As funções de escrita devolvem a pauta já atualizada. Aproveitar isso evita
  // uma segunda ida ao servidor — e o que a tela mostra passa a ser o que o
  // banco gravou, não um palpite otimista.
  it('guarda a resposta da decisão sem buscar de novo', async () => {
    const { chamadas, client } = fakeCliente({
      pauta_publica: { data: carga([peca()]), error: null },
      decidir_bloco: {
        data: carga([peca({ decisao: 'aprovada', decisao_por: 'Ana' })]),
        error: null,
      },
    });
    const { result } = montar(client);
    await waitFor(() => expect(result.current.carregando).toBe(false));

    const lidasAntes = chamadas.filter((c) => c.nome === 'pauta_publica').length;
    await act(async () => {
      await result.current.decidir.mutateAsync({ blocoId: 'b1', status: 'aprovada', por: 'Ana' });
    });

    await waitFor(() => expect(result.current.pecas[0].decisao).toBe('aprovada'));
    expect(result.current.decididas).toBe(1);
    // O ponto do teste: a pauta atualizou sem uma segunda leitura.
    expect(chamadas.filter((c) => c.nome === 'pauta_publica').length).toBe(lidasAntes);
  });

  // O banco faz `nullif(trim(coalesce(p_nota,'')),'')`. Mandar string vazia em
  // vez de undefined mantém o parâmetro com o tipo que a função declara.
  it('manda nota vazia como string ao aprovar sem observação', async () => {
    const { chamadas, client } = fakeCliente({
      pauta_publica: { data: carga([peca()]), error: null },
      decidir_bloco: { data: carga([peca({ decisao: 'aprovada' })]), error: null },
    });
    const { result } = montar(client);
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.decidir.mutateAsync({ blocoId: 'b1', status: 'aprovada', por: 'Ana' });
    });

    const enviado = chamadas.find((c) => c.nome === 'decidir_bloco');
    expect(enviado?.args.p_nota).toBe('');
    expect(enviado?.args.p_token).toBe(TOKEN);
  });

  // A mensagem do banco é a regra em texto ("Diga no comentário o que precisa
  // mudar."). Trocá-la por uma genérica esconderia do cliente o que fazer.
  it('propaga a mensagem do banco quando ele recusa', async () => {
    const { client } = fakeCliente({
      pauta_publica: { data: carga([peca()]), error: null },
      decidir_bloco: {
        data: null,
        error: new Error('Diga no comentário o que precisa mudar.'),
      },
    });
    const { result } = montar(client);
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.decidir
        .mutateAsync({ blocoId: 'b1', status: 'reprovada', nota: '', por: 'Ana' })
        .catch(() => undefined);
    });

    await waitFor(() =>
      expect(result.current.decidir.error?.message).toBe('Diga no comentário o que precisa mudar.'),
    );
  });

  // O cliente precisa de um momento de entregar: sem ele, decide peça a peça e
  // não sabe se já pode fechar a aba.
  it('entrega a revisão e passa a se declarar entregue', async () => {
    const entregue = carga([peca({ decisao: 'aprovada' })]);
    entregue.pauta.revisao_enviada_em = '2026-09-17T22:00:00+00:00';
    entregue.pauta.revisao_enviada_por = 'Ana';
    const { chamadas, client } = fakeCliente({
      pauta_publica: { data: carga([peca({ decisao: 'aprovada' })]), error: null },
      enviar_revisao: { data: entregue, error: null },
    });
    const { result } = montar(client);
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.entregue).toBe(false);

    await act(async () => {
      await result.current.enviarRevisao.mutateAsync({ por: 'Ana' });
    });

    await waitFor(() => expect(result.current.entregue).toBe(true));
    expect(result.current.entreguePor).toBe('Ana');
    expect(chamadas.find((c) => c.nome === 'enviar_revisao')?.args.p_por).toBe('Ana');
  });

  it('propaga a recusa do banco ao entregar pela metade', async () => {
    const { client } = fakeCliente({
      pauta_publica: { data: carga([peca()]), error: null },
      enviar_revisao: { data: null, error: new Error('Faltam 1 peça(s) para decidir.') },
    });
    const { result } = montar(client);
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.enviarRevisao.mutateAsync({ por: 'Ana' }).catch(() => undefined);
    });

    await waitFor(() =>
      expect(result.current.enviarRevisao.error?.message).toBe('Faltam 1 peça(s) para decidir.'),
    );
  });

  it('arredonda a coordenada do apontamento antes de mandar', async () => {
    const { chamadas, client } = fakeCliente({
      pauta_publica: { data: carga([peca()]), error: null },
      comentar_bloco: { data: carga([peca()]), error: null },
    });
    const { result } = montar(client);
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.comentar.mutateAsync({
        blocoId: 'b1',
        arquivoId: 'a1',
        x: 79.9712,
        y: 11.9954,
        texto: 'logo perto da borda',
        por: 'Ana',
      });
    });

    const enviado = chamadas.find((c) => c.nome === 'comentar_bloco');
    // A coluna é `integer`; mandar fracionário faria o Postgres recusar.
    expect(enviado?.args.p_x).toBe(80);
    expect(enviado?.args.p_y).toBe(12);
  });
});
