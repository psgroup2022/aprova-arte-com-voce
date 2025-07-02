import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePauta } from "@/hooks/usePautas";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  X, Mail, Send, Expand, Download, Play, 
  VolumeX, Check, Edit3, Hash, AtSign, 
  Image as ImageIcon, HelpCircle, Video, Type,
  Loader2
} from "lucide-react";

interface Comment {
  id: string;
  pinNumber?: number;
  assetType: 'image' | 'video' | 'caption';
  assetIndex?: number;
  title: string;
  content: string;
  timestamp: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export const VisualizarPautaV2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<string>("");

  // Buscar dados reais da pauta
  const { data: pauta, isLoading: pautaLoading } = usePauta(id!);
  
  // Buscar arquivos da pauta
  const { data: arquivos = [], isLoading: arquivosLoading } = useQuery({
    queryKey: ['pauta-arquivos', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('pauta_arquivos')
        .select('*')
        .eq('pauta_id', id)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (pautaLoading || arquivosLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando pauta...</p>
        </div>
      </div>
    );
  }

  if (!pauta) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p>Pauta não encontrada</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sem prazo definido";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const [comments] = useState<Comment[]>([
    {
      id: "1",
      pinNumber: 1,
      assetType: "image",
      assetIndex: 0,
      title: "Imagem 1 - Seção superior",
      content: "Podemos tornar o logo mais proeminente nesta seção? Está se perdendo no fundo.",
      timestamp: "2 horas atrás",
      replies: [
        {
          id: "1-1",
          author: "João Silva",
          avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
          content: "Vou ajustar o tamanho do logo e adicionar uma sombra sutil para destacá-lo mais.",
          timestamp: "1 hora atrás"
        }
      ]
    },
    {
      id: "2", 
      pinNumber: 2,
      assetType: "image",
      assetIndex: 0,
      title: "Imagem 1 - Exibição do produto",
      content: "As cores estão um pouco desbotadas aqui. Podemos realçar a vibração para combinar com as cores da nossa marca?",
      timestamp: "1 hora atrás",
      replies: []
    },
    {
      id: "3",
      assetType: "video",
      assetIndex: 1,
      title: "Feedback do vídeo",
      content: "A transição aos 0:12 está um pouco abrupta. Podemos suavizá-la? Além disso, o volume da música deve ser reduzido ligeiramente durante a narração.",
      timestamp: "30 minutos atrás", 
      replies: [
        {
          id: "3-1",
          author: "Maria Santos",
          avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
          content: "Boa observação. Vou ajustar a transição e os níveis de áudio na próxima revisão.",
          timestamp: "15 minutos atrás"
        }
      ]
    },
    {
      id: "4",
      assetType: "caption",
      title: "Feedback da legenda",
      content: "Vamos adicionar nossa hashtag da campanha de verão #EssenciaisVerao à legenda também.",
      timestamp: "45 minutos atrás",
      replies: []
    }
  ]);

  const handleApprovalClick = (type: string) => {
    setSelectedApproval(type);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    // Aqui seria a lógica para adicionar o comentário
    setNewComment("");
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, assetIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Aqui seria a lógica para adicionar um novo pin de comentário
    console.log(`Pin adicionado na posição: ${xPercent}%, ${yPercent}% na imagem ${assetIndex + 1}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-slate-800">{pauta.titulo}</h1>
            <p className="text-sm text-gray-500">Cliente: {pauta.cliente} • Vence {formatDate(pauta.data_prazo)}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center text-sm font-medium">
            <Mail className="w-4 h-4 mr-2" />
            Compartilhar Feedback
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center text-sm font-medium">
            <Send className="w-4 h-4 mr-2" />
            Enviar Revisão
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Assets Preview Section */}
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
                          onClick={(e) => handleImageClick(e, index)}
                        />
                        
                        {/* Comment Pins */}
                        {comments
                          .filter(comment => comment.assetType === 'image' && comment.assetIndex === index && comment.pinNumber)
                          .map((comment) => (
                            <div 
                              key={comment.id}
                              className="absolute h-6 w-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold -ml-3 -mt-3"
                              style={{
                                top: comment.pinNumber === 1 ? '30%' : '45%',
                                left: comment.pinNumber === 1 ? '25%' : '70%'
                              }}
                            >
                              {comment.pinNumber}
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
            {pauta.descricao && (
              <div className="mb-12 bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Descrição</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-wrap">{pauta.descricao}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Feedback Section */}
        <div className="w-full md:w-2/5 border-l border-gray-200 flex flex-col">
          {/* Approval Actions */}
          <div className="p-5 border-b border-gray-200 bg-white">
            <h3 className="text-base font-medium text-slate-700 mb-4">Revisar este conteúdo</h3>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleApprovalClick('approved')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                  selectedApproval === 'approved' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                <Check className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button 
                onClick={() => handleApprovalClick('approved-changes')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                  selectedApproval === 'approved-changes' ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'
                } text-white`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Aprovar com alterações
              </Button>
              <Button 
                onClick={() => handleApprovalClick('rejected')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
                  selectedApproval === 'rejected' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                <X className="w-4 h-4 mr-2" />
                Reprovar
              </Button>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="flex-grow overflow-y-auto bg-gray-50">
            <div className="p-5">
              <h3 className="text-base font-medium text-slate-700 mb-4">Comentários</h3>
              
              {comments.map((comment) => (
                <div key={comment.id} className="mb-6 bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-start mb-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 ${
                      comment.pinNumber ? 'bg-blue-500' : 'bg-slate-500'
                    }`}>
                      {comment.pinNumber || (
                        comment.assetType === 'video' ? <Video className="w-3 h-3" /> :
                        comment.assetType === 'caption' ? <Type className="w-3 h-3" /> : 
                        comment.pinNumber
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-slate-800">{comment.title}</h4>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                  
                  {/* Replies */}
                  <div className="pl-8">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start mb-2 pb-2 border-b border-gray-100">
                        <img src={reply.avatar} alt={reply.author} className="w-7 h-7 rounded-full mr-2" />
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <h5 className="text-sm font-medium">{reply.author}</h5>
                            <span className="text-xs text-gray-500">{reply.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Reply Input */}
                    <div className="flex mt-2">
                      <img 
                        src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" 
                        alt="Cliente" 
                        className="w-7 h-7 rounded-full mr-2" 
                      />
                      <div className="flex-grow">
                        <Input 
                          type="text" 
                          placeholder="Responder este comentário..." 
                          className="w-full text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Comment */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Adicionar novo comentário</h4>
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <Textarea 
                    placeholder="Digite seu comentário aqui..." 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px] mb-3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button className="text-gray-500 hover:text-gray-700">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700">
                        <AtSign className="w-4 h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700">
                        <Hash className="w-4 h-4" />
                      </button>
                    </div>
                    <Button 
                      onClick={handleAddComment}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                    >
                      Postar Comentário
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50">
        <HelpCircle className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
};