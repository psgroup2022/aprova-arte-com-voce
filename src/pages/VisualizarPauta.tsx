import React, { useState } from "react";
import { useParams } from "react-router-dom";
import previewPlaceholder from "@/assets/preview-placeholder.jpg";
import { ComentariosPontuais } from "@/components/ComentariosPontuais";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Tag, Check, Edit, X, MessageCircle, ArrowLeft, Share, Download, Activity } from "lucide-react";
import { toast } from "sonner";

interface Arte {
  id: string;
  url: string;
  legenda: string;
  tipo: 'imagem' | 'video';
  status?: 'aprovada' | 'aprovada-com-alteracoes' | 'reprovada' | null;
  comentarios: string;
}

// Mock data - será substituído por dados reais
const mockPauta = {
  id: "1",
  titulo: "Campanha Black Friday - Loja XYZ",
  cliente: "Loja XYZ",
  dataPublicacao: "2024-07-15",
  tipoPost: "feed",
  observacoes: "Manter identidade visual da marca, usar cores predominantes azul e branco.",
  artes: [
    {
      id: "1",
      url: previewPlaceholder,
      legenda: "🔥 BLACK FRIDAY CHEGOU! 🔥\n\nDescontos de até 70% em toda loja!\nCorra que é por tempo limitado! ⏰\n\n#BlackFriday #Promoção #LojaXYZ",
      tipo: "imagem" as const,
      status: null,
      comentarios: ""
    },
    {
      id: "2", 
      url: previewPlaceholder,
      legenda: "✨ OFERTAS IMPERDÍVEIS ✨\n\nNão deixe essa oportunidade passar!\nAcesse nosso site e confira! 🛍️\n\n#Ofertas #Desconto #Compras",
      tipo: "imagem" as const,
      status: null,
      comentarios: ""
    }
  ]
};

export const VisualizarPauta = () => {
  const { id } = useParams();
  const [artes, setArtes] = useState<Arte[]>(mockPauta.artes);
  const [comentarioGeral, setComentarioGeral] = useState("");

  const handleAvaliacaoArte = (arteId: string, status: Arte['status'], comentario: string = "") => {
    setArtes(prev => prev.map(arte => 
      arte.id === arteId 
        ? { ...arte, status, comentarios: comentario }
        : arte
    ));
  };

  const handleEnviarFeedback = () => {
    const artesNaoAvaliadas = artes.filter(arte => !arte.status);
    
    if (artesNaoAvaliadas.length > 0) {
      toast.error("Por favor, avalie todas as artes antes de enviar o feedback.");
      return;
    }

    // Aqui seria a lógica para enviar o feedback
    toast.success("Feedback enviado com sucesso! A agência será notificada.");
  };

  const statusConfig = {
    aprovada: { 
      icon: Check, 
      label: "Aprovada", 
      variant: "default" as const,
      color: "text-success"
    },
    'aprovada-com-alteracoes': { 
      icon: Edit, 
      label: "Aprovada com alterações", 
      variant: "outline" as const,
      color: "text-warning"
    },
    reprovada: { 
      icon: X, 
      label: "Reprovada", 
      variant: "destructive" as const,
      color: "text-destructive"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {mockPauta.titulo}
            </h1>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {mockPauta.cliente}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(mockPauta.dataPublicacao).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {mockPauta.tipoPost}
              </div>
            </div>
            {mockPauta.observacoes && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {mockPauta.observacoes}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Artes */}
          {artes.map((arte, index) => (
            <Card key={arte.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Arte {index + 1}
                  </CardTitle>
                  {arte.status && (
                    <Badge variant={statusConfig[arte.status].variant}>
                      {React.createElement(statusConfig[arte.status].icon, { className: "w-4 h-4 mr-1" })}
                      {statusConfig[arte.status].label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Arte */}
                  <div className="space-y-4">
                    <div className="relative">
                      {arte.tipo === 'imagem' ? (
                        <img
                          src={arte.url}
                          alt={`Arte ${index + 1}`}
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                      ) : (
                        <video
                          src={arte.url}
                          controls
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                      )}
                    </div>
                  </div>

                  {/* Legenda e Avaliação */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Legenda:</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap text-sm">
                          {arte.legenda}
                        </p>
                      </div>
                    </div>

                    {/* Comentários */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Comentários:
                      </h4>
                      <Textarea
                        placeholder="Adicione seus comentários sobre esta arte..."
                        rows={4}
                        value={arte.comentarios}
                        onChange={(e) => {
                          const novoComentario = e.target.value;
                          setArtes(prev => prev.map(a => 
                            a.id === arte.id 
                              ? { ...a, comentarios: novoComentario }
                              : a
                          ));
                        }}
                      />
                    </div>

                    {/* Botões de Aprovação */}
                    <div>
                      <h4 className="font-semibold mb-3">Sua avaliação:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={arte.status === 'aprovada' ? 'success' : 'outline'}
                          onClick={() => handleAvaliacaoArte(arte.id, 'aprovada')}
                          className="justify-start"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Aprovar sem alterações
                        </Button>
                        
                        <Button
                          variant={arte.status === 'aprovada-com-alteracoes' ? 'warning' : 'outline'}
                          onClick={() => handleAvaliacaoArte(arte.id, 'aprovada-com-alteracoes', arte.comentarios)}
                          className="justify-start"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Aprovar com alterações
                        </Button>
                        
                        <Button
                          variant={arte.status === 'reprovada' ? 'destructive' : 'outline'}
                          onClick={() => handleAvaliacaoArte(arte.id, 'reprovada', arte.comentarios)}
                          className="justify-start"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reprovar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Comentário Geral */}
          <Card>
            <CardHeader>
              <CardTitle>Comentário Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Adicione comentários gerais sobre toda a pauta (opcional)..."
                rows={4}
                value={comentarioGeral}
                onChange={(e) => setComentarioGeral(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Botão Enviar */}
          <div className="text-center">
            <Button 
              variant="hero" 
              size="xl" 
              onClick={handleEnviarFeedback}
              className="px-12"
            >
              Enviar Feedback
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};