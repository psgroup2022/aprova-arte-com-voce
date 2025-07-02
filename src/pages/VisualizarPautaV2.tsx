import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePauta } from "@/hooks/usePautas";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  X, Mail, Send, Expand, Download, Play, 
  VolumeX, Check, Edit3, Hash, AtSign, 
  Image as ImageIcon, HelpCircle, Video, Type,
  Loader2, Plus, MessageCircle
} from "lucide-react";

interface ComentarioPontual {
  id: string;
  pauta_id: string;
  arquivo_id?: string;
  x_coordenada?: number;
  y_coordenada?: number;
  comentario: string;
  resolvido: boolean;
  criado_por?: string;
  created_at: string;
}

export const VisualizarPautaV2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<string>("");
  const [showAddComment, setShowAddComment] = useState(false);
  const [pendingPin, setPendingPin] = useState<{x: number, y: number, arquivoId: string} | null>(null);

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

  // Buscar comentários da pauta
  const { data: comentarios = [], isLoading: comentariosLoading } = useQuery({
    queryKey: ['comentarios', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('comentarios_pontuais')
        .select('*')
        .eq('pauta_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const addComentarioMutation = useMutation({
    mutationFn: async (comentario: any) => {
      const { data, error } = await supabase
        .from('comentarios_pontuais')
        .insert(comentario)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios', id] });
      toast({ title: "Comentário adicionado com sucesso!" });
      setNewComment("");
      setPendingPin(null);
      setShowAddComment(false);
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao adicionar comentário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updatePautaMutation = useMutation({
    mutationFn: async ({ status, comentario }: { status: string, comentario?: string }) => {
      const updateData: any = { status };
      
      if (status === 'aprovada') {
        updateData.aprovado_por = 'cliente'; // Em um sistema real, seria o ID do usuário
        updateData.data_aprovacao = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('pautas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Adicionar comentário de aprovação se houver
      if (comentario) {
        await supabase
          .from('comentarios_pontuais')
          .insert({
            pauta_id: id!,
            arquivo_id: 'geral',
            comentario,
            criado_por: null,
            x_coordenada: 0,
            y_coordenada: 0
          });
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pauta', id] });
      queryClient.invalidateQueries({ queryKey: ['comentarios', id] });
      
      const statusText = data.status === 'aprovada' ? 'aprovada' : 
                        data.status === 'rejeitada' ? 'rejeitada' : 'aprovada com alterações';
      
      toast({ 
        title: `Pauta ${statusText} com sucesso!`,
        description: "O responsável foi notificado sobre sua decisão."
      });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar pauta", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  if (pautaLoading || arquivosLoading || comentariosLoading) {
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

  const handleApprovalClick = (type: string) => {
    setSelectedApproval(type);
    
    let status = '';
    let comentario = '';
    
    switch(type) {
      case 'approved':
        status = 'aprovada';
        break;
      case 'approved-changes':
        status = 'aguardando_aprovacao'; // Continua aguardando até as alterações serem feitas
        comentario = 'Aprovado com alterações solicitadas nos comentários.';
        break;
      case 'rejected':
        status = 'rejeitada';
        comentario = 'Rejeitado. Por favor, verificar os comentários para mais detalhes.';
        break;
    }
    
    updatePautaMutation.mutate({ status, comentario });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      console.log('Comentário vazio, não enviando');
      return;
    }
    
    console.log('Enviando comentário:', newComment);
    console.log('PendingPin:', pendingPin);
    
    const comentario: any = {
      pauta_id: id!,
      comentario: newComment,
      criado_por: null
    };

    if (pendingPin) {
      comentario.arquivo_id = pendingPin.arquivoId;
      comentario.x_coordenada = Math.round(pendingPin.x);
      comentario.y_coordenada = Math.round(pendingPin.y);
      console.log('Comentário pontual:', comentario);
    } else {
      // Para comentários gerais, usar valores padrão
      comentario.arquivo_id = 'geral';
      comentario.x_coordenada = 0;
      comentario.y_coordenada = 0;
      console.log('Comentário geral:', comentario);
    }

    addComentarioMutation.mutate(comentario);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, arquivoId: string) => {
    e.preventDefault();
    console.log('Clique na imagem detectado:', arquivoId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    console.log('Posição calculada:', { x, y });
    
    setPendingPin({ x, y, arquivoId });
    setShowAddComment(true);
    console.log('Estado atualizado - showAddComment:', true);
  };

  const addLegendaComment = () => {
    if (!newComment.trim()) return;
    
    addComentarioMutation.mutate({
      pauta_id: id!,
      arquivo_id: 'legenda',
      comentario: `[LEGENDA] ${newComment}`,
      criado_por: null,
      x_coordenada: 0,
      y_coordenada: 0
    });
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
                          onClick={(e) => handleImageClick(e, arquivo.id)}
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
            {pauta.descricao && (
              <div className="mb-12 bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-slate-700">Descrição</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddComment(true)}
                    className="flex items-center"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comentar legenda
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-wrap">{pauta.descricao}</p>
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
                      onChange={(e) => setNewComment(e.target.value)}
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
                          onClick={() => {
                            console.log('Cancelando comentário');
                            setShowAddComment(false);
                            setPendingPin(null);
                            setNewComment("");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAddComment}
                          size="sm"
                          disabled={addComentarioMutation.isPending || !newComment.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {addComentarioMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Postar Comentário
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!showAddComment && (
                <Button
                  onClick={() => setShowAddComment(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar comentário geral
                </Button>
              )}
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