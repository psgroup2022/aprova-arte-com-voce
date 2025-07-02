import React from "react";
import { Button } from "@/components/ui/button";
import { Expand, Download, MessageCircle } from "lucide-react";
import { ComentarioPontual, PendingPin } from "@/types/comentario";

interface Arquivo {
  id: string;
  nome_arquivo: string;
  tipo: string;
  url: string;
}

interface ArquivosPreviewProps {
  arquivos: Arquivo[];
  comentarios: ComentarioPontual[];
  pendingPin: PendingPin | null;
  onImageClick: (e: React.MouseEvent<HTMLImageElement>, arquivoId: string) => void;
  descricao?: string;
  onShowAddComment: () => void;
}

export const ArquivosPreview = ({ 
  arquivos, 
  comentarios, 
  pendingPin, 
  onImageClick, 
  descricao, 
  onShowAddComment 
}: ArquivosPreviewProps) => {
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