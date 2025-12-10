import React from "react";
import { Button } from "@/components/ui/button";
import { Expand, Download, MessageCircle } from "lucide-react";
import { ComentarioPontual, PendingPin } from "@/types/comentario";
import { Badge } from "@/components/ui/badge";

interface Arquivo {
  id: string;
  nome_arquivo: string;
  tipo: string;
  url: string;
}

interface ItemInfo {
  id: string;
  titulo: string | null;
  texto_conteudo: string | null;
  hashtags: string | null;
  ordem: number;
}

interface BlocoComItens {
  id: string;
  tipo_material: string;
  ordem: number;
  status: string;
  itens: Array<ItemInfo & { arquivos: Arquivo[] }>;
}

interface ArquivosPreviewProps {
  arquivos: Arquivo[];
  comentarios: ComentarioPontual[];
  pendingPin: PendingPin | null;
  onImageClick: (e: React.MouseEvent<HTMLImageElement>, arquivoId: string) => void;
  descricao?: string;
  onShowAddComment: () => void;
  blocos?: BlocoComItens[];
}

const tipoLabels: Record<string, string> = {
  carrossel: 'Carrossel',
  story: 'Story',
  reels: 'Reels',
  estatico: 'Post Estático',
  linkedin_artigo: 'LinkedIn',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
};

const itemLabels: Record<string, string> = {
  carrossel: 'Slide',
  reels: 'Cena',
  story: 'Tela',
  default: 'Peça'
};

export const ArquivosPreview = ({ 
  arquivos, 
  comentarios, 
  pendingPin, 
  onImageClick, 
  descricao, 
  onShowAddComment,
  blocos = [],
}: ArquivosPreviewProps) => {
  const hasBlocos = blocos.length > 0 && blocos.some(b => b.itens.length > 0);

  if (hasBlocos) {
    return (
      <div className="w-full md:w-3/5 bg-muted/30 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">
          {blocos.map((bloco, blocoIndex) => {
            const itemLabel = itemLabels[bloco.tipo_material] || itemLabels.default;
            const isCarrossel = bloco.tipo_material === 'carrossel';
            const isReels = bloco.tipo_material === 'reels';

            return (
              <div key={bloco.id} className="bg-card rounded-xl shadow-sm border overflow-hidden">
                {/* Header do Bloco */}
                <div className="px-5 py-3 bg-muted/50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm font-medium">
                      {tipoLabels[bloco.tipo_material] || bloco.tipo_material}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      • {bloco.itens.length} {bloco.itens.length === 1 ? itemLabel.toLowerCase() : `${itemLabel.toLowerCase()}s`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Material {blocoIndex + 1} de {blocos.length}
                  </span>
                </div>

                {/* Conteúdo do Bloco */}
                <div className="p-5">
                  {/* CARROSSEL - Preview lado a lado */}
                  {isCarrossel && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {bloco.itens.map((item, itemIndex) => (
                        <div key={item.id} className="bg-background rounded-lg border overflow-hidden">
                          <div className="relative bg-muted">
                            {item.arquivos.length > 0 ? (
                              item.arquivos.map(arquivo => (
                                <div key={arquivo.id} className="relative">
                                  <img 
                                    src={arquivo.url} 
                                    alt={arquivo.nome_arquivo}
                                    className="w-full h-auto max-h-64 object-contain cursor-pointer"
                                    onClick={(e) => onImageClick(e, arquivo.id)}
                                  />
                                  {comentarios
                                    .filter(c => c.arquivo_id === arquivo.id && c.x_coordenada && c.y_coordenada)
                                    .map((comentario, pinIndex) => (
                                      <div 
                                        key={comentario.id}
                                        className="absolute h-5 w-5 bg-primary rounded-full border-2 border-white flex items-center justify-center text-primary-foreground text-xs font-bold cursor-pointer"
                                        style={{
                                          left: `${comentario.x_coordenada}%`,
                                          top: `${comentario.y_coordenada}%`,
                                          transform: 'translate(-50%, -50%)'
                                        }}
                                        title={comentario.comentario}
                                      >
                                        {pinIndex + 1}
                                      </div>
                                    ))
                                  }
                                </div>
                              ))
                            ) : (
                              <div className="aspect-square flex items-center justify-center text-muted-foreground text-sm">
                                Sem mídia
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 space-y-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              {itemLabel} {itemIndex + 1}
                            </Badge>
                            {item.titulo && (
                              <p className="text-sm font-semibold text-foreground">{item.titulo}</p>
                            )}
                            {item.texto_conteudo && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.texto_conteudo}</p>
                            )}
                            {item.hashtags && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {item.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                                    #{tag.replace('#', '').trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* REELS - Vídeo único + lista de cenas */}
                  {isReels && (
                    <div className="space-y-4">
                      {(() => {
                        const videoArquivo = bloco.itens
                          .flatMap(item => item.arquivos)
                          .find(arq => arq.tipo === 'video');
                        
                        if (videoArquivo) {
                          return (
                            <div className="bg-black rounded-lg overflow-hidden max-w-md mx-auto">
                              <video 
                                src={videoArquivo.url} 
                                controls 
                                className="w-full aspect-[9/16] object-contain"
                                preload="metadata"
                                playsInline
                              >
                                Seu navegador não suporta vídeos.
                              </video>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-muted rounded-lg p-8 text-center">
                            <p className="text-muted-foreground">Vídeo não enviado</p>
                          </div>
                        );
                      })()}

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-foreground">Cenas e Chamadas</h4>
                        {bloco.itens.map((item, itemIndex) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                            <Badge variant="outline" className="h-fit">
                              {itemLabel} {itemIndex + 1}
                            </Badge>
                            <div className="flex-1 space-y-1">
                              {item.titulo && (
                                <p className="text-sm font-semibold text-foreground">{item.titulo}</p>
                              )}
                              {item.texto_conteudo && (
                                <p className="text-sm text-foreground whitespace-pre-wrap">{item.texto_conteudo}</p>
                              )}
                              {item.hashtags && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {item.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      #{tag.replace('#', '').trim()}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OUTROS TIPOS - Layout vertical */}
                  {!isCarrossel && !isReels && (
                    <div className="space-y-6">
                      {bloco.itens.map((item, itemIndex) => (
                        <div key={item.id} className="bg-background rounded-lg border overflow-hidden">
                          <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-1/2 bg-muted">
                              {item.arquivos.length > 0 ? (
                                item.arquivos.map(arquivo => (
                                  <div key={arquivo.id} className="relative">
                                    {arquivo.tipo === 'video' ? (
                                      <video 
                                        src={arquivo.url} 
                                        controls 
                                        className="w-full h-auto max-h-96 object-contain"
                                        preload="metadata"
                                        playsInline
                                      >
                                        Seu navegador não suporta vídeos.
                                      </video>
                                    ) : (
                                      <>
                                        <img 
                                          src={arquivo.url} 
                                          alt={arquivo.nome_arquivo}
                                          className="w-full h-auto max-h-96 object-contain cursor-pointer"
                                          onClick={(e) => onImageClick(e, arquivo.id)}
                                        />
                                        {pendingPin && pendingPin.arquivoId === arquivo.id && (
                                          <div 
                                            className="absolute h-6 w-6 bg-destructive rounded-full border-2 border-white flex items-center justify-center text-destructive-foreground text-xs font-bold animate-pulse"
                                            style={{
                                              left: `${pendingPin.x}%`,
                                              top: `${pendingPin.y}%`,
                                              transform: 'translate(-50%, -50%)'
                                            }}
                                          >
                                            ?
                                          </div>
                                        )}
                                        {comentarios
                                          .filter(c => c.arquivo_id === arquivo.id && c.x_coordenada && c.y_coordenada)
                                          .map((comentario, pinIndex) => (
                                            <div 
                                              key={comentario.id}
                                              className="absolute h-6 w-6 bg-primary rounded-full border-2 border-white flex items-center justify-center text-primary-foreground text-xs font-bold cursor-pointer"
                                              style={{
                                                left: `${comentario.x_coordenada}%`,
                                                top: `${comentario.y_coordenada}%`,
                                                transform: 'translate(-50%, -50%)'
                                              }}
                                              title={comentario.comentario}
                                            >
                                              {pinIndex + 1}
                                            </div>
                                          ))
                                        }
                                      </>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="aspect-square flex items-center justify-center text-muted-foreground">
                                  Sem mídia enviada
                                </div>
                              )}
                            </div>

                            <div className="lg:w-1/2 p-5 space-y-4">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">
                                  {itemLabel} {itemIndex + 1}
                                </Badge>
                                {item.arquivos[0] && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(item.arquivos[0].url, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              {item.titulo && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Título
                                  </label>
                                  <p className="text-sm font-semibold text-foreground mt-1">{item.titulo}</p>
                                </div>
                              )}

                              {item.texto_conteudo && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Legenda
                                  </label>
                                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{item.texto_conteudo}</p>
                                </div>
                              )}

                              {item.hashtags && (
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Hashtags
                                  </label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        #{tag.replace('#', '').trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Descrição/Legenda Final */}
          {descricao && (
            <div className="bg-card rounded-xl shadow-sm p-5 border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-foreground">Legenda Final</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShowAddComment}
                  className="flex items-center"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comentar
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-foreground whitespace-pre-wrap">{descricao}</p>
              </div>
              
              {comentarios.filter(c => c.comentario.startsWith('[LEGENDA]')).map((comentario) => (
                <div key={comentario.id} className="mt-3 p-3 bg-primary/10 rounded-md border-l-4 border-primary">
                  <p className="text-sm text-foreground">{comentario.comentario.replace('[LEGENDA] ', '')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comentario.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback para sistema legado
  return (
    <div className="w-full md:w-3/5 bg-muted/30 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {arquivos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum arquivo foi enviado para esta pauta.</p>
          </div>
        ) : (
          arquivos.map((arquivo, index) => (
            <div key={arquivo.id} className="mb-12">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-foreground">
                  {arquivo.tipo === 'video' ? 'Vídeo' : arquivo.tipo === 'imagem' ? 'Imagem' : 'Documento'} {index + 1} de {arquivos.length}
                </h3>
                <div className="flex space-x-2">
                  <button className="text-muted-foreground hover:text-foreground">
                    <Expand className="w-4 h-4" />
                  </button>
                  <button 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => window.open(arquivo.url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative bg-card rounded-lg shadow-sm overflow-hidden border">
                {arquivo.tipo === 'video' ? (
                  <div className="relative bg-black">
                    <video 
                      src={arquivo.url} 
                      controls 
                      className="w-full h-auto"
                      preload="metadata"
                      playsInline
                    >
                      Seu navegador não suporta vídeos.
                    </video>
                  </div>
                ) : arquivo.tipo === 'imagem' ? (
                  <div className="relative">
                    <img 
                      className="w-full h-auto cursor-pointer" 
                      src={arquivo.url} 
                      alt={arquivo.nome_arquivo}
                      onClick={(e) => onImageClick(e, arquivo.id)}
                      style={{ userSelect: 'none' }}
                    />
                    
                    {pendingPin && pendingPin.arquivoId === arquivo.id && (
                      <div 
                        className="absolute h-6 w-6 bg-destructive rounded-full border-2 border-white flex items-center justify-center text-destructive-foreground text-xs font-bold animate-pulse cursor-pointer"
                        style={{
                          left: `${pendingPin.x}%`,
                          top: `${pendingPin.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        ?
                      </div>
                    )}
                    
                    {comentarios
                      .filter(c => c.arquivo_id === arquivo.id && c.x_coordenada && c.y_coordenada)
                      .map((comentario, pinIndex) => (
                        <div 
                          key={comentario.id}
                          className="absolute h-6 w-6 bg-primary rounded-full border-2 border-white flex items-center justify-center text-primary-foreground text-xs font-bold cursor-pointer"
                          style={{
                            left: `${comentario.x_coordenada}%`,
                            top: `${comentario.y_coordenada}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          title={comentario.comentario}
                        >
                          {pinIndex + 1}
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">{arquivo.nome_arquivo}</p>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(arquivo.url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {descricao && (
          <div className="mb-12 bg-card rounded-lg shadow-sm p-5 border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-foreground">Legenda / Descrição</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={onShowAddComment}
                className="flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Comentar na legenda
              </Button>
            </div>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-foreground whitespace-pre-wrap">{descricao}</p>
            </div>
            
            {comentarios.filter(c => c.comentario.startsWith('[LEGENDA]')).map((comentario) => (
              <div key={comentario.id} className="mt-3 p-3 bg-primary/10 rounded-md border-l-4 border-primary">
                <p className="text-sm text-foreground">{comentario.comentario.replace('[LEGENDA] ', '')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(comentario.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
