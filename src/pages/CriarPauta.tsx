import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePautas } from "@/hooks/usePautas";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CriarPauta = () => {
  const navigate = useNavigate();
  const { createPauta, isCreating } = usePautas();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    cliente: "",
    data_prazo: "",
    observacoes: "",
  });
  
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setArquivos(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, pautaId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pautaId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('pauta-arquivos')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pauta-arquivos')
      .getPublicUrl(fileName);

    // Determinar tipo do arquivo
    const tipo = file.type.startsWith('image/') ? 'imagem' : 
                 file.type.startsWith('video/') ? 'video' : 'documento';

    // Salvar registro do arquivo no banco
    const { error: dbError } = await supabase
      .from('pauta_arquivos')
      .insert({
        pauta_id: pautaId,
        nome_arquivo: file.name,
        tipo,
        url: publicUrl,
        tamanho: file.size,
        ordem: 0,
      });

    if (dbError) {
      throw dbError;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma pauta",
        variant: "destructive",
      });
      return;
    }

    if (!formData.titulo || !formData.cliente) {
      toast({
        title: "Erro", 
        description: "Título e cliente são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Criar pauta
      const novaPauta = await new Promise<any>((resolve, reject) => {
        createPauta(formData, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      // Upload dos arquivos se houver
      if (arquivos.length > 0) {
        await Promise.all(
          arquivos.map(arquivo => uploadFile(arquivo, novaPauta.id))
        );
      }

      toast({
        title: "Sucesso",
        description: "Pauta criada com sucesso!",
      });
      
      navigate("/");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro ao criar pauta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center">
          <p>Você precisa estar logado para criar uma pauta.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Pauta</h1>
            <p className="text-muted-foreground">Crie uma nova pauta para aprovação</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Pauta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange("titulo", e.target.value)}
                  placeholder="Ex: Campanha Verão 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleInputChange("cliente", e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  placeholder="Descreva os detalhes da pauta..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_prazo">Prazo</Label>
                <Input
                  id="data_prazo"
                  type="date"
                  value={formData.data_prazo}
                  onChange={(e) => handleInputChange("data_prazo", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivos</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Clique para selecionar arquivos ou arraste aqui
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Suporte para imagens, vídeos e documentos
                      </p>
                    </div>
                  </label>
                </div>

                {arquivos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
                    {arquivos.map((arquivo, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{arquivo.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={isCreating || uploading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || uploading}
                  className="flex-1"
                >
                  {(isCreating || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Pauta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};