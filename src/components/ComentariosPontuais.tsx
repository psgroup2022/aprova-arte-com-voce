import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Clock, Check } from 'lucide-react';

interface Comentario {
  id: string;
  autor: string;
  tempo: string;
  texto: string;
  posicao?: { x: number; y: number };
  resolvido: boolean;
  tipo: 'pontual' | 'geral';
}

interface ComentariosPontuaisProps {
  imagemUrl: string;
  comentarios: Comentario[];
  onAdicionarComentario: (comentario: Omit<Comentario, 'id'>) => void;
  onResolverComentario: (id: string) => void;
}

export const ComentariosPontuais = ({
  imagemUrl,
  comentarios,
  onAdicionarComentario,
  onResolverComentario,
}: ComentariosPontuaisProps) => {
  const [novoComentario, setNovoComentario] = useState<{
    x: number;
    y: number;
    texto: string;
  } | null>(null);
  const [comentarioSelecionado, setComentarioSelecionado] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNovoComentario({ x, y, texto: '' });
  };

  const handleSalvarComentario = () => {
    if (novoComentario && novoComentario.texto.trim()) {
      onAdicionarComentario({
        autor: 'Cliente',
        tempo: 'Agora',
        texto: novoComentario.texto,
        posicao: { x: novoComentario.x, y: novoComentario.y },
        resolvido: false,
        tipo: 'pontual',
      });
      setNovoComentario(null);
    }
  };

  const comentariosPontuais = comentarios.filter((c) => c.tipo === 'pontual');

  return (
    <div className="space-y-4">
      {/* Área da Imagem com Comentários */}
      <div className="relative">
        <div className="relative cursor-crosshair group" onClick={handleImageClick}>
          <img
            src={imagemUrl}
            alt="Arte para revisão"
            className="w-full h-auto rounded-lg shadow-md"
          />

          {/* Overlay de instrução */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm">
              Clique em qualquer local para adicionar um comentário
            </div>
          </div>

          {/* Marcadores de Comentários Existentes */}
          {comentariosPontuais.map((comentario, index) => (
            <div
              key={comentario.id}
              className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
                comentario.resolvido
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
              style={{
                left: `${comentario.posicao?.x}%`,
                top: `${comentario.posicao?.y}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setComentarioSelecionado(
                  comentario.id === comentarioSelecionado ? null : comentario.id,
                );
              }}
            >
              {comentario.resolvido ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
          ))}

          {/* Novo Comentário */}
          {novoComentario && (
            <div
              className="absolute w-8 h-8 bg-warning text-warning-foreground rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${novoComentario.x}%`,
                top: `${novoComentario.y}%`,
              }}
            >
              <MessageCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Popup do Comentário Selecionado */}
        {comentarioSelecionado && (
          <Card className="absolute top-4 right-4 w-80 z-10 shadow-lg">
            <CardContent className="p-4">
              {(() => {
                const comentario = comentarios.find((c) => c.id === comentarioSelecionado);
                if (!comentario) return null;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{comentario.autor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{comentario.tempo}</span>
                      </div>
                    </div>

                    <p className="text-sm">{comentario.texto}</p>

                    {!comentario.resolvido && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => onResolverComentario(comentario.id)}
                        className="w-full"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Marcar como Resolvido
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setComentarioSelecionado(null)}
                      className="w-full"
                    >
                      Fechar
                    </Button>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário de Novo Comentário */}
      {novoComentario && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Adicionar Comentário</h4>
              <Textarea
                placeholder="Digite seu comentário sobre este ponto da imagem..."
                value={novoComentario.texto}
                onChange={(e) => setNovoComentario({ ...novoComentario, texto: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSalvarComentario}>
                  Adicionar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setNovoComentario(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Comentários */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">
          Comentários nesta Arte ({comentariosPontuais.length})
        </h4>
        {comentariosPontuais.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum comentário ainda. Clique na imagem para adicionar.
          </p>
        ) : (
          <div className="space-y-2">
            {comentariosPontuais.map((comentario, index) => (
              <Card
                key={comentario.id}
                className={`p-3 ${comentario.resolvido ? 'bg-success/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      comentario.resolvido
                        ? 'bg-success text-success-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {comentario.resolvido ? <Check className="w-3 h-3" /> : index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comentario.autor}</span>
                      <span className="text-xs text-muted-foreground">{comentario.tempo}</span>
                      {comentario.resolvido && (
                        <Badge variant="default" className="text-xs">
                          Resolvido
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{comentario.texto}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
