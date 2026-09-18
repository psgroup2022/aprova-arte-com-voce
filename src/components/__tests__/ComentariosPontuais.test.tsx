import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComentariosPontuais } from '../ComentariosPontuais';
import type { ApontamentoPublico, ArteDaPeca } from '@/types/aprovacao-publica';

const arte = (over: Partial<ArteDaPeca> = {}): ArteDaPeca => ({
  id: 'a1',
  url: 'http://exemplo/p01.png',
  tipo: 'imagem',
  nome: 'p01.png',
  item_ordem: 0,
  item_titulo: null,
  ...over,
});

const apontamento = (over: Partial<ApontamentoPublico> = {}): ApontamentoPublico => ({
  id: 'c1',
  x: 80,
  y: 12,
  arquivo_id: 'a1',
  texto: 'O logo está perto da borda',
  autor: 'Ana',
  resolvido: false,
  resposta: null,
  criado_em: '2026-09-17T18:00:00+00:00',
  ...over,
});

/**
 * jsdom não faz layout: `getBoundingClientRect` devolve tudo zero, e aí toda
 * coordenada viraria 0/0 — o teste passaria sem provar nada. Fixar a área é o
 * que permite conferir a conversão para percentual.
 */
const fixarArea = (el: HTMLElement, box: { left: number; top: number; w: number; h: number }) => {
  el.getBoundingClientRect = () =>
    ({
      left: box.left,
      top: box.top,
      width: box.w,
      height: box.h,
      right: box.left + box.w,
      bottom: box.top + box.h,
      x: box.left,
      y: box.top,
      toJSON: () => ({}),
    }) as DOMRect;
};

describe('ComentariosPontuais', () => {
  // O pino é gravado em percentual, não em pixel: o cliente aponta no celular e
  // a equipe lê no monitor, e o dedo tem de continuar sobre o mesmo detalhe.
  it('converte o clique em percentual da área da arte', async () => {
    const onComentar = vi.fn().mockResolvedValue(undefined);
    render(<ComentariosPontuais arte={arte()} comentarios={[]} onComentar={onComentar} />);

    const area = screen.getByTestId('area-da-arte');
    fixarArea(area, { left: 100, top: 200, w: 500, h: 1000 });
    // 100 + 500*0.4 = 300 → 40% da largura; 200 + 1000*0.25 = 450 → 25% da altura.
    fireEvent.click(area, { clientX: 300, clientY: 450, detail: 1 });

    const pendente = await screen.findByTestId('pino-pendente');
    expect(pendente).toHaveStyle({ left: '40%', top: '25%' });

    fireEvent.change(screen.getByLabelText('Texto do apontamento'), {
      target: { value: 'corta o logo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pedir este ajuste' }));

    await waitFor(() => expect(onComentar).toHaveBeenCalledWith(40, 25, 'corta o logo'));
  });

  it('prende a coordenada na faixa quando o clique cai fora da arte', async () => {
    const onComentar = vi.fn().mockResolvedValue(undefined);
    render(<ComentariosPontuais arte={arte()} comentarios={[]} onComentar={onComentar} />);

    const area = screen.getByTestId('area-da-arte');
    fixarArea(area, { left: 100, top: 200, w: 500, h: 1000 });
    fireEvent.click(area, { clientX: 9999, clientY: -9999, detail: 1 });

    const pendente = await screen.findByTestId('pino-pendente');
    expect(pendente).toHaveStyle({ left: '100%', top: '0%' });
  });

  // `detail === 0` é ativação por teclado: não existe ponto clicado, e deixar o
  // pino ir para 0/0 gravaria um apontamento no canto que ninguém escolheu.
  it('põe o pino no centro quando a ativação vem do teclado', async () => {
    render(<ComentariosPontuais arte={arte()} comentarios={[]} onComentar={vi.fn()} />);

    const area = screen.getByTestId('area-da-arte');
    fixarArea(area, { left: 0, top: 0, w: 500, h: 500 });
    fireEvent.click(area, { clientX: 0, clientY: 0, detail: 0 });

    const pendente = await screen.findByTestId('pino-pendente');
    expect(pendente).toHaveStyle({ left: '50%', top: '50%' });
  });

  it('desenha os apontamentos que já existem na posição gravada', () => {
    render(
      <ComentariosPontuais
        arte={arte()}
        comentarios={[apontamento(), apontamento({ id: 'c2', x: 10, y: 90, resolvido: true })]}
        onComentar={vi.fn()}
      />,
    );

    const pinos = screen.getAllByTestId('pino');
    expect(pinos).toHaveLength(2);
    expect(pinos[0]).toHaveStyle({ left: '80%', top: '12%' });
    expect(pinos[1]).toHaveStyle({ left: '10%', top: '90%' });
  });

  it('não deixa apontar em vídeo', () => {
    render(
      <ComentariosPontuais
        arte={arte({ tipo: 'video', url: 'http://exemplo/reels.mp4' })}
        comentarios={[]}
        onComentar={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('area-da-arte')).not.toBeInTheDocument();
  });

  it('não deixa apontar em modo somente leitura', () => {
    render(
      <ComentariosPontuais arte={arte()} comentarios={[]} somenteLeitura onComentar={vi.fn()} />,
    );

    const area = screen.getByTestId('area-da-arte');
    fixarArea(area, { left: 0, top: 0, w: 500, h: 500 });
    fireEvent.click(area, { clientX: 250, clientY: 250, detail: 1 });

    expect(screen.queryByTestId('pino-pendente')).not.toBeInTheDocument();
  });

  it('não manda apontamento vazio', async () => {
    const onComentar = vi.fn();
    render(<ComentariosPontuais arte={arte()} comentarios={[]} onComentar={onComentar} />);

    const area = screen.getByTestId('area-da-arte');
    fixarArea(area, { left: 0, top: 0, w: 500, h: 500 });
    fireEvent.click(area, { clientX: 250, clientY: 250, detail: 1 });

    await screen.findByTestId('pino-pendente');
    fireEvent.change(screen.getByLabelText('Texto do apontamento'), {
      target: { value: '   ' },
    });

    expect(screen.getByRole('button', { name: 'Pedir este ajuste' })).toBeDisabled();
    expect(onComentar).not.toHaveBeenCalled();
  });

  it('mostra a resposta da equipe junto do apontamento', () => {
    render(
      <ComentariosPontuais
        arte={arte()}
        comentarios={[apontamento({ resposta: 'Ajustado na v2.' })]}
        onComentar={vi.fn()}
      />,
    );

    expect(screen.getByText(/Ajustado na v2\./)).toBeInTheDocument();
  });
});
