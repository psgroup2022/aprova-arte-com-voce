import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Plus, Loader2, Image as ImageIcon, AtSign } from "lucide-react";
import { ComentarioPontual, PendingPin } from "@/types/comentario";

interface CommentsSectionProps {
  comentarios: ComentarioPontual[];
  showAddComment: boolean;
  newComment: string;
  pendingPin: PendingPin | null;
  isPending: boolean;
  onNewCommentChange: (value: string) => void;
  onShowAddComment: () => void;
  onAddComment: () => void;
  onCancelComment: () => void;
}

export const CommentsSection = ({
  comentarios,
  showAddComment,
  newComment,
  pendingPin,
  isPending,
  onNewCommentChange,
  onShowAddComment,
  onAddComment,
  onCancelComment
}: CommentsSectionProps) => {
  return (
    <div className="flex-grow overflow-y-auto bg-gray-50">
      <div className="p-5">
        <h3 className="text-base font-medium text-slate-700 mb-4">Comentários</h3>
        
        {/* Comentários pontuais */}
        {comentarios.filter(c => c.arquivo_id && c.x_coordenada && c.y_coordenada).map((comentario, index) => (
          <div key={comentario.id} className="mb-4 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold mr-2">
                {index + 1}
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-slate-800">Comentário na imagem</h4>
                <p className="text-sm text-gray-700 mt-1">{comentario.comentario}</p>
                <span className="text-xs text-gray-500">
                  {new Date(comentario.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Comentários gerais */}
        {comentarios.filter(c => c.arquivo_id === 'geral' || (!c.arquivo_id && !c.comentario.startsWith('[LEGENDA]'))).map((comentario) => (
          <div key={comentario.id} className="mb-4 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-bold mr-2">
                <MessageCircle className="w-3 h-3" />
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-slate-800">Comentário geral</h4>
                <p className="text-sm text-gray-700 mt-1">{comentario.comentario}</p>
                <span className="text-xs text-gray-500">
                  {new Date(comentario.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Comment */}
        {showAddComment && (
          <div className="mb-4 bg-white rounded-lg shadow-sm p-4 border-2 border-blue-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              {pendingPin ? (
                <span className="text-blue-600">
                  ✓ Adicionar comentário na imagem (posição marcada)
                </span>
              ) : (
                'Adicionar novo comentário geral'
              )}
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <Textarea 
                placeholder="Digite seu comentário aqui..." 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px] mb-3 bg-white"
                value={newComment}
                onChange={(e) => onNewCommentChange(e.target.value)}
                autoFocus
              />
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button className="text-gray-500 hover:text-gray-700 p-1 rounded">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 p-1 rounded">
                    <AtSign className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={onCancelComment}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={onAddComment}
                    size="sm"
                    disabled={isPending || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Postar Comentário
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showAddComment && (
          <Button
            onClick={onShowAddComment}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar comentário geral
          </Button>
        )}
      </div>
    </div>
  );
};