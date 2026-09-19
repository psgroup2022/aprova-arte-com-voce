import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, Link2Off, PenLine, Send } from 'lucide-react';
import { ComentariosPontuais } from '@/components/ComentariosPontuais';
import { useAprovacaoPublica } from '@/hooks/useAprovacaoPublica';
import { useRevisor } from '@/hooks/useRevisor';
import { ITEM_LABEL, TIPO_LABEL, type PecaPublica } from '@/types/aprovacao-publica';

/**
 * A tela do cliente. Fora do `ProtectedRoute`: quem abre não tem conta.
 *
 * A aprovação aqui é peça a peça, não da pauta inteira. É a lacuna que o
 * step-12 do Mirador Team exige fechar — ele decide por peça, e uma decisão
 * única sobre o conjunto não diz para qual arte mandar o ajuste.
 *
 * Nenhuma regra é aplicada só aqui. Reprovar sem motivo, decidir sem se
 * identificar e peça que não é deste link o banco recusa, e o que a tela
 * mostra quando isso acontece é a mensagem dele, palavra por palavra. Esconder
 * um botão não protege nada: quem fala com a API não passa pela tela.
 */

/**
 * `data_postagem` é `date`. `new Date('2026-10-03')` é meia-noite UTC, que a
 * oeste de Greenwich cai no dia anterior — daí a formatação na mão.
 */
const formatarData = (iso: string | null) => {
  if (!iso) return null;
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
};

const Moldura = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-muted/30">
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* A marca vive aqui, e não em cada tela: `Moldura` envolve todos os
          estados desta página — pedir nome, revisar, link inválido, enviado —
          e o cliente precisa saber onde está em todos eles. */}
      <img src="/miracheck.svg" alt="MiraCheck" className="mb-8 h-6 w-auto" />
      {children}
    </div>
  </div>
);

// ── Identificação ───────────────────────────────────────────────────────────

const PedirNome = ({ onDeclarar }: { onDeclarar: (nome: string) => boolean }) => {
  const [valor, setValor] = useState('');

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">
          Quem está revisando? O nome fica junto de cada aprovação e de cada apontamento, para a
          equipe saber com quem falar.
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            onDeclarar(valor);
          }}
        >
          <Input
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Seu nome"
            aria-label="Seu nome"
          />
          <Button type="submit" disabled={!valor.trim()}>
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// ── Uma peça ────────────────────────────────────────────────────────────────

interface CartaoPecaProps {
  peca: PecaPublica;
  /** Sem nome não se decide: ele fica junto da decisão e é como a equipe sabe
   *  com quem falar. O pedido está no topo da página, junto do conteúdo. */
  identificado: boolean;
  salvandoDecisao: boolean;
  salvandoComentario: boolean;
  erro: string | null;
  onDecidir: (status: 'aprovada' | 'reprovada', nota?: string) => Promise<unknown>;
  onComentar: (arquivoId: string, x: number, y: number, texto: string) => Promise<unknown>;
}

const CartaoPeca = ({
  peca,
  identificado,
  salvandoDecisao,
  salvandoComentario,
  erro,
  onDecidir,
  onComentar,
}: CartaoPecaProps) => {
  const [pedindoAjuste, setPedindoAjuste] = useState(false);
  const [motivo, setMotivo] = useState('');

  /**
   * Isto é uma pauta, não uma peça pronta.
   *
   * O cliente entra duas vezes no ciclo: valida a ideia antes de a redação
   * começar, e valida a peça no fim. São materiais diferentes, e mostrar a
   * ideia com a ficha da peça — "Chamada", "Legenda", e um aviso de arte
   * faltando — faz a pauta parecer um briefing pela metade.
   *
   * A ausência de arquivo é sinal confiável do estágio: publicar na etapa
   * final recusa peça sem arte, com erro, em `publicar.ts`. Bloco publicado
   * sem arquivo só pode ter vindo da pauta.
   */
  const ehPauta = peca.arquivos.length === 0;

  const data = formatarData(peca.data_postagem);
  const varias = peca.arquivos.length > 1;
  const rotuloItem = ITEM_LABEL[peca.tipo];

  const pedirAjuste = async () => {
    // O banco também recusa motivo vazio; a checagem aqui evita a ida à rede.
    if (!motivo.trim()) return;
    await onDecidir('reprovada', motivo.trim());
    setPedindoAjuste(false);
    setMotivo('');
  };

  return (
    <Card data-testid={`peca-${peca.peca ?? peca.id}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {peca.peca && <Badge variant="secondary">{peca.peca}</Badge>}
          <Badge variant="outline">{TIPO_LABEL[peca.tipo] ?? peca.tipo}</Badge>
          {data && <span className="text-xs text-muted-foreground">{data}</span>}
          <span className="ml-auto">
            {peca.decisao === 'aprovada' && (
              <Badge className="bg-success text-success-foreground hover:bg-success">
                Aprovada
              </Badge>
            )}
            {peca.decisao === 'reprovada' && <Badge variant="destructive">Ajuste pedido</Badge>}
            {peca.decisao === 'pendente' && <Badge variant="outline">A decidir</Badge>}
          </span>
        </div>

        {ehPauta ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nesta etapa você aprova a ideia. A arte vem depois, e volta para você aprovar de novo.
          </p>
        ) : (
          <div className="space-y-5">
            {peca.arquivos.map((arte, i) => (
              <ComentariosPontuais
                key={arte.id}
                arte={arte}
                rotulo={varias ? `${rotuloItem ?? 'Arte'} ${i + 1}` : null}
                comentarios={peca.comentarios.filter((c) => c.arquivo_id === arte.id)}
                salvando={salvandoComentario}
                onComentar={(x, y, texto) => onComentar(arte.id, x, y, texto)}
              />
            ))}
          </div>
        )}

        {/* A chamada aparece duas vezes: gravada na arte e aqui como texto. Sem
            rótulo isso parece defeito de renderização. Com rótulo vira ficha da
            peça — e fica claro que a legenda é o que acompanha o post, não algo
            que já estivesse na imagem. Vale também para a peça cuja arte ainda
            não foi composta: aí este é o único lugar onde a chamada existe. */}
        {peca.chamada && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chamada
            </p>
            {/* A quebra de linha é decisão editorial — é assim que ela vai sobre
                a arte. Colapsar em parágrafo corrido descaracterizaria. */}
            <p className="whitespace-pre-line text-lg font-semibold leading-snug">{peca.chamada}</p>
          </div>
        )}

        {(peca.legenda || peca.hashtags) && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {ehPauta ? 'Abordagem' : 'Legenda'}
            </p>
            {peca.legenda && <p className="whitespace-pre-wrap text-sm">{peca.legenda}</p>}
            {peca.hashtags && <p className="mt-2 text-sm text-muted-foreground">{peca.hashtags}</p>}
          </div>
        )}

        {erro && (
          <Alert variant="destructive" data-testid="erro-decisao">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {peca.decisao !== 'pendente' && !pedindoAjuste && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>
              {peca.decisao === 'aprovada' ? 'Aprovada' : 'Ajuste pedido'}
              {peca.decisao_por ? ` por ${peca.decisao_por}` : ''}.
            </p>
            {peca.decisao_nota && <p className="mt-1 italic">&ldquo;{peca.decisao_nota}&rdquo;</p>}
          </div>
        )}

        {pedindoAjuste ? (
          <div className="space-y-2">
            <Textarea
              autoFocus
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="O que precisa mudar nesta peça?"
              aria-label="Motivo do ajuste"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={pedirAjuste}
                disabled={!motivo.trim() || salvandoDecisao}
              >
                {salvandoDecisao ? 'Enviando...' : 'Enviar pedido'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPedindoAjuste(false);
                  setMotivo('');
                }}
                disabled={salvandoDecisao}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {peca.decisao !== 'aprovada' && (
              <Button
                size="sm"
                variant="success"
                onClick={() => onDecidir('aprovada')}
                disabled={salvandoDecisao || !identificado}
              >
                <Check className="h-4 w-4" />
                {peca.decisao === 'reprovada' ? 'Retirar o pedido e aprovar' : 'Aprovar'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMotivo(peca.decisao_nota ?? '');
                setPedindoAjuste(true);
              }}
              disabled={salvandoDecisao || !identificado}
            >
              <PenLine className="h-4 w-4" />
              {peca.decisao === 'reprovada' ? 'Editar o pedido' : 'Pedir ajuste'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── A tela ──────────────────────────────────────────────────────────────────

export const AprovacaoPublica = () => {
  const { token = '' } = useParams();
  const { nome, identificado, declarar } = useRevisor();
  const {
    pauta,
    pecas,
    linkInvalido,
    decididas,
    total,
    completa,
    carregando,
    erro,
    entregue,
    entreguePor,
    decidir,
    comentar,
    enviarRevisao,
  } = useAprovacaoPublica(token);

  if (carregando) {
    return (
      <Moldura>
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Moldura>
    );
  }

  // Link inválido e falha de rede são coisas diferentes: uma não adianta tentar
  // de novo, a outra sim. Dizer "não encontrado" para as duas mandaria o cliente
  // conferir um link que está certo.
  if (erro) {
    return (
      <Moldura>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não consegui carregar esta pauta. Verifique a conexão e tente de novo.
          </AlertDescription>
        </Alert>
      </Moldura>
    );
  }

  if (linkInvalido || !pauta) {
    return (
      <Moldura>
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <Link2Off className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Este link não abre nenhuma pauta</h1>
            <p className="text-sm text-muted-foreground">
              Ele pode ter sido revogado ou substituído por um mais recente. Peça um novo link a
              quem enviou.
            </p>
          </CardContent>
        </Card>
      </Moldura>
    );
  }

  // As mutações são uma só para todas as peças, então o erro precisa voltar
  // para a peça que o provocou — senão o cartão errado fica vermelho.
  const erroDe = (blocoId: string) => {
    const daDecisao =
      decidir.error && decidir.variables?.blocoId === blocoId ? decidir.error.message : null;
    const doComentario =
      comentar.error && comentar.variables?.blocoId === blocoId ? comentar.error.message : null;
    return daDecisao ?? doComentario;
  };

  return (
    <Moldura>
      <header className="mb-6 space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{pauta.cliente}</p>
          <h1 className="text-2xl font-semibold">{pauta.titulo}</h1>
          {pauta.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{pauta.descricao}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span data-testid="progresso">
              {decididas} de {total} decididas
            </span>
            {identificado && <span className="text-muted-foreground">Revisando como {nome}</span>}
          </div>
          <Progress value={total ? (decididas / total) * 100 : 0} />
        </div>

        {/* O nome vem junto do conteúdo, não antes dele.
            Era uma tela inteira barrando a entrada: o cliente abria o link e a
            primeira coisa era um formulário, sem ter visto nada do que veio
            revisar. Aqui ele lê primeiro e se identifica na hora de decidir —
            que é quando o nome passa a servir para alguma coisa, porque fica
            junto de cada aprovação e de cada apontamento. */}
        {!identificado && <PedirNome onDeclarar={declarar} />}

        {entregue && (
          <Alert data-testid="revisao-entregue">
            <Check className="h-4 w-4" />
            <AlertDescription>
              Revisão entregue{entreguePor ? ` por ${entreguePor}` : ''}. A equipe já foi avisada.
              Se você mudar alguma peça a partir de agora, é só entregar de novo.
            </AlertDescription>
          </Alert>
        )}
      </header>

      {pecas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Esta pauta ainda não tem peças publicadas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {pecas.map((peca) => (
            <CartaoPeca
              key={peca.id}
              peca={peca}
              identificado={identificado}
              salvandoDecisao={decidir.isPending && decidir.variables?.blocoId === peca.id}
              salvandoComentario={comentar.isPending && comentar.variables?.blocoId === peca.id}
              erro={erroDe(peca.id)}
              onDecidir={(status, nota) =>
                decidir.mutateAsync({ blocoId: peca.id, status, nota, por: nome })
              }
              onComentar={(arquivoId, x, y, texto) =>
                comentar.mutateAsync({ blocoId: peca.id, arquivoId, x, y, texto, por: nome })
              }
            />
          ))}
        </div>
      )}

      {/* Entregar.
          Sem este momento o cliente decide peça a peça e não sabe se já pode
          fechar a aba — e a equipe não sabe se ele terminou ou parou no meio.
          O banco recusa entregar com peça pendente, que é a condição do
          step-12 para o ciclo seguir. */}
      {pecas.length > 0 && (
        <Card className="mt-6" data-testid="entrega">
          <CardContent className="space-y-3 p-5">
            {entregue ? (
              <p className="text-sm">
                Revisão entregue{entreguePor ? ` por ${entreguePor}` : ''}. Pode fechar esta página.
                Se mudar de ideia em alguma peça, entregue de novo.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {completa
                  ? 'Todas as peças foram decididas. Entregue para a equipe começar os ajustes.'
                  : `Faltam ${total - decididas} peça(s) para decidir antes de entregar.`}
              </p>
            )}

            {enviarRevisao.error && (
              <Alert variant="destructive" data-testid="erro-entrega">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{enviarRevisao.error.message}</AlertDescription>
              </Alert>
            )}

            <Button
              variant={entregue ? 'outline' : 'default'}
              disabled={!completa || enviarRevisao.isPending}
              onClick={() => void enviarRevisao.mutateAsync({ por: nome }).catch(() => undefined)}
            >
              <Send className="h-4 w-4" />
              {enviarRevisao.isPending
                ? 'Enviando...'
                : entregue
                  ? 'Entregar de novo'
                  : 'Entregar minha revisão'}
            </Button>
          </CardContent>
        </Card>
      )}
    </Moldura>
  );
};

export default AprovacaoPublica;
