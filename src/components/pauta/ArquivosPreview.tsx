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

export const ArquivosPreview = ({ 
  arquivos, 
  comentarios, 
  pendingPin, 
  onImageClick, 
  descricao, 
  onShowAddComment,
  blocos = [],
}: ArquivosPreviewProps) => {
  // Se temos blocos com itens, renderizar por bloco
  const hasBlocos = blocos.length > 0 && blocos.some(b => b.itens.length > 0);

  if (hasBlocos) {
    return (
      <div className="w-full md:w-3/5 bg-gray-50 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {blocos.map((bloco, blocoIndex) => (
            <div key={bloco.id} className="mb-10">
              {/* Header do Bloco */}
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm font-medium">
                  {tipoLabels[bloco.tipo_material] || bloco.tipo_material}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Material {blocoIndex + 1} de {blocos.length}
                </span>
              </div>

              {/* Carrossel - lado a lado */}
              {bloco.tipo_material === 'carrossel' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bloco.itens.map((item, itemIndex) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Imagem do Slide */}
                      {item.arquivos.length > 0 ? (
                        item.arquivos.map(arquivo => (
                          <div key={arquivo.id} className="relative aspect-square bg-gray-100">
                            <img 
                              src={arquivo.url} 
                              alt={arquivo.nome_arquivo}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={(e) => onImageClick(e, arquivo.id)}
                            />
                            {/* Pins de comentários */}
                            {comentarios
                              .filter(c => c.arquivo_id === arquivo.id && c.x_coordenada && c.y_coordenada)
                              .map((comentario, pinIndex) => (
                                <div 
                                  key={comentario.id}
                                  className="absolute h-5 w-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-blue-600"
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
                        <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          Sem mídia
                        </div>
                      )}
                      
                      {/* Info do Slide */}
                      <div className="p-3 space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">
                          Slide {itemIndex + 1}
                        </div>
                        {item.titulo && (
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{item.titulo}</p>
                        )}
                        {item.texto_conteudo && (
                          <p className="text-xs text-muted-foreground line-clamp-3">{item.texto_conteudo}</p>
                        )}
                        {item.hashtags && (
                          <div className="flex flex-wrap gap-1">
                            {item.hashtags.split(',').map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                                #{tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Outros tipos - layout vertical */
                <div className="space-y-6">
                  {bloco.itens.map((item, itemIndex) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Mídia */}
                        <div className="md:w-1/2">
                          {item.arquivos.length > 0 ? (
                            item.arquivos.map(arquivo => (
                              <div key={arquivo.id} className="relative">
                                {arquivo.tipo === 'video' ? (
                                  <video 
                                    src={arquivo.url} 
                                    controls 
                                    className="w-full aspect-square object-cover"
                                    preload="metadata"
                                  />
                                ) : (
                                  <>
                                    <img 
                                      src={arquivo.url} 
                                      alt={arquivo.nome_arquivo}
                                      className="w-full aspect-square object-cover cursor-pointer"
                                      onClick={(e) => onImageClick(e, arquivo.id)}
                                    />
                                    {/* Pin temporário */}
                                    {pendingPin && pendingPin.arquivoId === arquivo.id && (
                                      <div 
                                        className="absolute h-6 w-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold animate-pulse"
                                        style={{
                                          left: `${pendingPin.x}%`,
                                          top: `${pendingPin.y}%`,
                                          transform: 'translate(-50%, -50%)'
                                        }}
                                      >
                                        ?
                                      </div>
                                    )}
                                    {/* Pins de comentários */}
                                    {comentarios
                                      .filter(c => c.arquivo_id === arquivo.id && c.x_coordenada && c.y_coordenada)
                                      .map((comentario, pinIndex) => (
                                        <div 
                                          key={comentario.id}
                                          className="absolute h-6 w-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-blue-600"
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
                            <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
                              Sem mídia enviada
                            </div>
                          )}
                        </div>

                        {/* Informações da Peça */}
                        <div className="md:w-1/2 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {bloco.tipo_material === 'reels' ? `Cena ${itemIndex + 1}` : `Peça ${itemIndex + 1}`}
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
                                Chamada / Legenda
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
                                {item.hashtags.split(',').map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    #{tag.trim()}
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
          ))}

          {/* Descrição/Legenda Final */}
          {descricao && (
            <div className="mb-12 bg-white rounded-lg shadow-sm p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-slate-700">Legenda Final</h3>
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
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap">{descricao}</p>
              </div>
              
              {/* Comentários da legenda */}
              {comentarios.filter(c => c.comentario.startsWith('[LEGENDA]')).map((comentario) => (
                <div key={comentario.id} className="mt-3 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700">{comentario.comentario.replace('[LEGENDA] ', '')}</p>
                  <p className="text-xs text-gray-500 mt-1">
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

  // Fallback para sistema legado (sem blocos)
  return (
    <div className="w-full md:w-3/5 bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {arquivos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum arquivo foi enviado para esta pauta.</p>
          </div>
        ) : (
          arquivos.map((arquivo, index) => (
            <div key={arquivo.id} className="mb-12">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-700">
                  {arquivo.tipo === 'video' ? 'Vídeo' : arquivo.tipo === 'imagem' ? 'Imagem' : 'Documento'} {index + 1} de {arquivos.length}
                </h3>
                <div className="flex space-x-2">
                  <button className="text-gray-500 hover:text-gray-700">
                    <Expand className="w-4 h-4" />
                  </button>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => window.open(arquivo.url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
                {arquivo.tipo === 'video' ? (
                  <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                    <video 
                      src={arquivo.url} 
                      controls 
                      className="w-full h-full"
                      preload="metadata"
                    />
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
                    
                    {/* Pin temporário enquanto aguarda comentário */}
                    {pendingPin && pendingPin.arquivoId === arquivo.id && (
                      <div 
                        className="absolute h-6 w-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold animate-pulse cursor-pointer"
                        style={{
                          left: `${pendingPin.x}%`,
                          top: `${pendingPin.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        ?
                      </div>
                    )}
                    
                    {/* Comment Pins existentes */}
                    {comentarios
                      .filter(c => c.arquivo_id === arquivo.id && c.x_coordenada && c.y_coordenada)
                      .map((comentario, pinIndex) => (
                        <div 
                          key={comentario.id}
                          className="absolute h-6 w-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-blue-600"
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
                    <p className="text-gray-600 mb-2">{arquivo.nome_arquivo}</p>
                    <button 
                      onClick={() => window.open(arquivo.url, '_blank')}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Baixar arquivo
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Description/Caption Preview */}
        {descricao && (
          <div className="mb-12 bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-slate-700">Descrição</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={onShowAddComment}
                className="flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Comentar legenda
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-wrap">{descricao}</p>
            </div>
            
            {/* Comentários da legenda */}
            {comentarios.filter(c => c.comentario.startsWith('[LEGENDA]')).map((comentario) => (
              <div key={comentario.id} className="mt-3 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">{comentario.comentario.replace('[LEGENDA] ', '')}</p>
                <p className="text-xs text-gray-500 mt-1">
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