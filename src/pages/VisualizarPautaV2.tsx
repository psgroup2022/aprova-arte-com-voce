import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import previewPlaceholder from "@/assets/preview-placeholder.jpg";
import { ComentariosPontuais } from "@/components/ComentariosPontuais";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Tag, Check, Edit, X, MessageCircle, ArrowLeft, Share, Download, Activity, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Arte {
  id: string;
  url: string;
  legenda: string;
  tipo: 'imagem' | 'video';
  status?: 'aprovada' | 'aprovada-com-alteracoes' | 'reprovada' | null;
  comentarios: any[];
}

interface Comentario {
  id: string;
  autor: string;
  tempo: string;
  texto: string;
  posicao?: { x: number; y: number };
  resolvido: boolean;
  tipo: 'pontual' | 'geral';
}

// Mock data - será substituído por dados reais
const mockPauta = {
  id: "1",
  titulo: "Weekend Sale Announcement",
  cliente: "Loja XYZ",
  dataPublicacao: "2024-07-08",
  tipoPost: "Instagram Story",
  status: "needs-revision",
  observacoes: "Manter identidade visual da marca, usar cores predominantes azul e branco.",
  designer: "John Smith",
  version: "v2 (Current)",
  artes: [
    {
      id: "1",
      url: previewPlaceholder,
      legenda: "Weekend FLASH SALE! 40% OFF all accessories. Shop now before it's gone! #FlashSale #WeekendDeals",
      tipo: "imagem" as const,
      status: null,
      comentarios: []
    }
  ]
};

const mockAtividades = [
  {
    id: "1",
    tipo: "client_requested_changes",
    usuario: "Jane Cooper",
    tempo: "5 hours ago",
    descricao: "Jane Cooper requested changes to the Weekend Sale Announcement",
    detalhes: "3 comments added"
  },
  {
    id: "2",
    tipo: "client_viewed",
    usuario: "Jane Cooper",
    tempo: "5 hours ago",
    descricao: "Jane Cooper viewed the Weekend Sale Announcement Pauta"
  }
];

export const VisualizarPauta = () => {
  const { id } = useParams();
  const [artes, setArtes] = useState<Arte[]>(mockPauta.artes);
  const [comentarios, setComentarios] = useState<Comentario[]>([
    {
      id: "1",
      autor: "Jane Cooper",
      tempo: "Hoje às 10:23",
      texto: "The discount percentage should be 50% instead of 40% as we discussed in the meeting.",
      posicao: { x: 30, y: 40 },
      resolvido: false,
      tipo: 'pontual'
    }
  ]);
  const [comentarioGeral, setComentarioGeral] = useState("");
  const [arteAtiva, setArteAtiva] = useState(0);

  const handleAdicionarComentario = (novoComentario: Omit<Comentario, 'id'>) => {
    const comentario: Comentario = {
      ...novoComentario,
      id: Date.now().toString()
    };
    setComentarios(prev => [...prev, comentario]);
  };

  const handleResolverComentario = (comentarioId: string) => {
    setComentarios(prev => prev.map(c => 
      c.id === comentarioId ? { ...c, resolvido: true } : c
    ));
  };

  const handleAvaliacaoArte = (status: 'aprovada' | 'aprovada-com-alteracoes' | 'reprovada') => {
    // Aqui seria a lógica para enviar a avaliação
    toast.success(`Arte ${status === 'aprovada' ? 'aprovada' : status === 'aprovada-com-alteracoes' ? 'aprovada com alterações' : 'reprovada'} com sucesso!`);
  };

  const comentariosAtivos = comentarios.filter(c => !c.resolvido);
  const comentariosResolvidos = comentarios.filter(c => c.resolvido);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {mockPauta.titulo}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{mockPauta.tipoPost}</span>
                    <span>•</span>
                    <span>Vence em {new Date(mockPauta.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Needs Revision</Badge>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Arte Principal */}
            <div className="col-span-8">
              <div className="bg-card rounded-lg p-6 h-full">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Clique em qualquer local na imagem para adicionar um comentário
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      100%
                    </Button>
                  </div>
                </div>
                
                <ComentariosPontuais
                  imagemUrl={artes[arteAtiva]?.url || previewPlaceholder}
                  comentarios={comentarios}
                  onAdicionarComentario={handleAdicionarComentario}
                  onResolverComentario={handleResolverComentario}
                />
              </div>
            </div>

            {/* Sidebar de Comentários */}
            <div className="col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Review this content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Botões de Aprovação */}
                  <div className="space-y-2">
                    <Button 
                      variant="success" 
                      className="w-full justify-start"
                      onClick={() => handleAvaliacaoArte('aprovada')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="warning" 
                      className="w-full justify-start"
                      onClick={() => handleAvaliacaoArte('aprovada-com-alteracoes')}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Approve with Changes
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={() => handleAvaliacaoArte('reprovada')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  {/* Seção de Comentários */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Comments</h4>
                      <Badge variant="secondary">{comentarios.length}</Badge>
                    </div>

                    {/* Lista de Comentários */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {comentarios.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                      ) : (
                        comentarios.map((comentario) => (
                          <div key={comentario.id} className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                comentario.resolvido 
                                  ? 'bg-success text-success-foreground' 
                                  : 'bg-primary text-primary-foreground'
                              }`}>
                                {comentario.resolvido ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <MessageCircle className="w-3 h-3" />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{comentario.autor}</span>
                                  <span className="text-xs text-muted-foreground">{comentario.tempo}</span>
                                </div>
                                <p className="text-sm">{comentario.texto}</p>
                                {comentario.resolvido && (
                                  <Badge variant="outline" className="text-xs">Resolved</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Adicionar Novo Comentário */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your comment here..."
                        rows={3}
                        value={comentarioGeral}
                        onChange={(e) => setComentarioGeral(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          if (comentarioGeral.trim()) {
                            handleAdicionarComentario({
                              autor: "Cliente",
                              tempo: "Agora",
                              texto: comentarioGeral,
                              resolvido: false,
                              tipo: 'geral'
                            });
                            setComentarioGeral("");
                          }
                        }}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="border-t bg-card">
          <div className="px-6 py-4">
            <h4 className="font-semibold mb-2">Caption</h4>
            <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
              {artes[arteAtiva]?.legenda}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar Direita - Detalhes */}
      <div className="w-80 border-l bg-card">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">Pauta Details</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">POST TYPE</div>
                <div className="font-medium">{mockPauta.tipoPost}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">STATUS</div>
                <Badge variant="destructive">Needs Revision</Badge>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">DUE DATE</div>
                <div className="font-medium">{new Date(mockPauta.dataPublicacao).toLocaleDateString('pt-BR')}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">ASSIGNED TO</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                    JS
                  </div>
                  <span className="font-medium">{mockPauta.designer}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Client Requested Changes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Jane Cooper requested changes 5 hours ago
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <Button variant="default" className="w-full">
                Upload Revision
              </Button>
              <Button variant="outline" className="w-full">
                Export Feedback
              </Button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Activity Timeline</h4>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            
            <div className="space-y-4">
              {mockAtividades.map((atividade) => (
                <div key={atividade.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    atividade.tipo === 'client_requested_changes' ? 'bg-destructive' : 'bg-primary'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">{atividade.descricao}</div>
                    {atividade.detalhes && (
                      <div className="text-xs text-muted-foreground">{atividade.detalhes}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{atividade.tempo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Summary */}
          <div>
            <h4 className="font-semibold mb-4">Feedback Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Comments</span>
                <span className="font-medium">{comentarios.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resolved Comments</span>
                <span className="font-medium">{comentariosResolvidos.length} / {comentarios.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending Approval</span>
                <span className="font-medium text-warning">Yes</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-1">
                {Math.round((comentariosResolvidos.length / Math.max(comentarios.length, 1)) * 100)}% of feedback resolved
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-success h-2 rounded-full transition-all" 
                  style={{ width: `${(comentariosResolvidos.length / Math.max(comentarios.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};