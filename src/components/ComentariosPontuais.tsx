import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Check, MessageCircle, X } from 'lucide-react';
import type { ApontamentoPublico, ArteDaPeca } from '@/types/aprovacao-publica';

/**
 * Uma arte com os apontamentos cravados sobre ela.
 *
 * O pino é gravado em percentual da largura e da altura, nunca em pixel: o
 * cliente aponta no celular, a equipe lê no monitor, e o dedo tem de continuar
 * sobre o mesmo detalhe. O banco prende o valor em 0..100.
 *
 * Só imagem aceita pino. Vídeo aparece para ser visto — marcar um ponto sobre
 * um quadro que passa não diz nada sem o instante, e instante não é o que esta
 * etapa coleta.
 */

interface ComentariosPontuaisProps {
  arte: ArteDaPeca;
  /** "Slide 2", "Cena 3" — só quando a peça tem mais de uma arte. */
  rotulo?: string | null;
  comentarios: ApontamentoPublico[];
  salvando?: boolean;
  somenteLeitura?: boolean;
  onComentar: (x: number, y: number, texto: string) => Promise<unknown> | void;
}

interface PinoPendente {
  x: number;
  y: number;
}

export const ComentariosPontuais = ({
  arte,
  rotulo,
  comentarios,
  salvando = false,
  somenteLeitura = false,
  onComentar,
}: ComentariosPontuaisProps) => {
  const [pendente, setPendente] = useState<PinoPendente | null>(null);
  const [texto, setTexto] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);

  const aceitaPino = arte.tipo === 'imagem' && !somenteLeitura;

  const marcar = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!aceitaPino) return;
    const area = e.currentTarget.getBoundingClientRect();
    // `detail === 0` é ativação por teclado: não há ponto clicado, então o pino
    // vai ao centro em vez de ir parar no canto superior esquerdo.
    const porTeclado = e.detail === 0;
    const x = porTeclado ? 50 : ((e.clientX - area.left) / area.width) * 100;
    const y = porTeclado ? 50 : ((e.clientY - area.top) / area.height) * 100;
    setPendente({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
    setAberto(null);
  };

  const enviar = async () => {
    if (!pendente || !texto.trim()) return;
    await onComentar(pendente.x, pendente.y, texto.trim());
    setPendente(null);
    setTexto('');
  };

  const cancelar = () => {
    setPendente(null);
    setTexto('');
  };

  return (
    <div className="space-y-3">
      {rotulo && <p className="text-xs font-medium uppercase tracking-wide">{rotulo}</p>}

      <div className="relative">
        {arte.tipo === 'video' ? (
          <video src={arte.url} controls className="w-full rounded-lg border" />
        ) : (
          <button
            type="button"
            onClick={marcar}
            disabled={!aceitaPino}
            aria-label={aceitaPino ? `Marcar um ponto em ${arte.nome}` : `Arte ${arte.nome}`}
            data-testid="area-da-arte"
            className={`group relative block w-full overflow-hidden rounded-lg border p-0 ${
              aceitaPino ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            <img
              src={arte.url}
              alt={arte.item_titulo || arte.nome}
              className="block h-auto w-full"
            />

            {aceitaPino && !pendente && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs text-white">
                  Clique sobre a arte para pedir um ajuste num ponto
                </span>
              </span>
            )}

            {comentarios.map((c, i) => (
              <span
                key={c.id}
                data-testid="pino"
                title={c.texto}
                onClick={(e) => {
                  e.stopPropagation();
                  setAberto(aberto === c.id ? null : c.id);
                }}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold shadow-md ring-2 ring-white transition-transform hover:scale-110 ${
                  c.resolvido ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {c.resolvido ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
            ))}

            {pendente && (
              <span
                data-testid="pino-pendente"
                style={{ left: `${pendente.x}%`, top: `${pendente.y}%` }}
                className="absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full bg-slate-900 text-white ring-2 ring-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        )}

        {aberto && (
          <Card className="absolute right-3 top-3 z-20 w-72 shadow-xl">
            <CardContent className="space-y-2 p-3">
              {(() => {
                const c = comentarios.find((x) => x.id === aberto);
                if (!c) return null;
                return (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold">{c.autor || 'Cliente'}</span>
                      <button
                        type="button"
                        onClick={() => setAberto(null)}
                        aria-label="Fechar"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm">{c.texto}</p>
                    {c.resposta && (
                      <p className="rounded-md bg-muted p-2 text-xs">
                        <span className="font-semibold">Resposta: </span>
                        {c.resposta}
                      </p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {pendente && (
        <Card>
          <CardContent className="space-y-2 p-3">
            <Textarea
              autoFocus
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="O que precisa mudar neste ponto?"
              aria-label="Texto do apontamento"
            />
            {/* Pedir um ajuste num ponto é pedir que a peça mude. Dizer isso
                aqui evita o que aconteceu antes: a pessoa apontava três coisas
                e a peça continuava marcada como aprovada. */}
            <p className="text-xs text-muted-foreground">
              Ao apontar, esta peça passa a constar como &ldquo;ajuste pedido&rdquo;.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={enviar} disabled={!texto.trim() || salvando}>
                {salvando ? 'Enviando...' : 'Pedir este ajuste'}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelar} disabled={salvando}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {comentarios.length > 0 && (
        <ol className="space-y-2">
          {comentarios.map((c, i) => (
            <li key={c.id} className="flex gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                  c.resolvido ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              >
                {c.resolvido ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="break-words">{c.texto}</span>
                {c.autor && <span className="text-muted-foreground"> — {c.autor}</span>}
                {c.resposta && (
                  <span className="mt-1 block rounded-md bg-muted p-2 text-xs">
                    <span className="font-semibold">Resposta: </span>
                    {c.resposta}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
