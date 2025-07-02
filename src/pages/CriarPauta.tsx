import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Image as ImageIcon, Calendar, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Arte {
  id: string;
  file: File;
  preview: string;
  legenda: string;
}

export const CriarPauta = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: "",
    cliente: "",
    dataPublicacao: "",
    tipoPost: "",
    observacoes: ""
  });
  const [artes, setArtes] = useState<Arte[]>([]);

  const tiposPost = [
    { value: "feed", label: "Post Feed" },
    { value: "reels", label: "Reels" },
    { value: "stories", label: "Stories" },
    { value: "carrossel", label: "Carrossel" },
    { value: "igtv", label: "IGTV" }
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const novaArte: Arte = {
            id: Date.now() + Math.random().toString(),
            file,
            preview: e.target?.result as string,
            legenda: ""
          };
          setArtes(prev => [...prev, novaArte]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeArte = (id: string) => {
    setArtes(prev => prev.filter(arte => arte.id !== id));
  };

  const updateLegenda = (id: string, legenda: string) => {
    setArtes(prev => prev.map(arte => 
      arte.id === id ? { ...arte, legenda } : arte
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.cliente || !formData.dataPublicacao || !formData.tipoPost || artes.length === 0) {
      toast.error("Preencha todos os campos obrigatórios e adicione pelo menos uma arte");
      return;
    }

    // Aqui seria a lógica para salvar a pauta
    toast.success("Pauta criada com sucesso!");
    navigate("/");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Criar Nova Pauta
          </h1>
          <p className="text-muted-foreground mt-1">
            Adicione as informações e artes para aprovação do cliente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Informações da Pauta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título da Pauta *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Campanha Black Friday"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Input
                    id="cliente"
                    placeholder="Nome do cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataPublicacao" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data de Publicação *
                  </Label>
                  <Input
                    id="dataPublicacao"
                    type="date"
                    value={formData.dataPublicacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataPublicacao: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label>Tipo de Post *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, tipoPost: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposPost.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais para o cliente..."
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload de Artes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Artes ({artes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Arraste arquivos ou clique para enviar</p>
                  <p className="text-sm text-muted-foreground">
                    Suporta imagens (JPG, PNG, GIF) e vídeos (MP4, MOV)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Artes Carregadas */}
              {artes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {artes.map((arte) => (
                    <Card key={arte.id} className="overflow-hidden">
                      <div className="relative">
                        {arte.file.type.startsWith('image/') ? (
                          <img
                            src={arte.preview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <video
                            src={arte.preview}
                            className="w-full h-48 object-cover"
                            controls
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => removeArte(arte.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <Label htmlFor={`legenda-${arte.id}`}>Legenda</Label>
                        <Textarea
                          id={`legenda-${arte.id}`}
                          placeholder="Adicione a legenda para esta arte..."
                          rows={3}
                          value={arte.legenda}
                          onChange={(e) => updateLegenda(arte.id, e.target.value)}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/")}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="hero" size="lg">
              Criar Pauta
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};