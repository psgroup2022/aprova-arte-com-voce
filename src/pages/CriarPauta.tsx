import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Loader2, X, CloudUpload, Play, Edit, Trash2, HelpCircle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePautas } from "@/hooks/usePautas";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PostType = "feed" | "story" | "reel" | "carousel" | "facebook" | "twitter";

interface FormData {
  titulo: string;
  tipo_post: PostType | "";
  data_prazo: string;
  responsavel: string;
  tags: string[];
  legenda: string;
  hashtags: string;
  cliente: string;
  observacoes: string;
}

export const CriarPauta = () => {
  const navigate = useNavigate();
  const { createPauta, isCreating } = usePautas();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    tipo_post: "",
    data_prazo: "",
    responsavel: "",
    tags: [],
    legenda: "",
    hashtags: "",
    cliente: "",
    observacoes: "",
  });
  
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, newTag.trim()] 
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
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

    if (!formData.titulo || !formData.cliente || !formData.legenda) {
      toast({
        title: "Erro", 
        description: "Título, cliente e legenda são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Criar pauta
      const pautaData = {
        titulo: formData.titulo,
        descricao: formData.legenda,
        cliente: formData.cliente,
        data_prazo: formData.data_prazo || undefined,
        observacoes: formData.observacoes || undefined,
      };
      
      const novaPauta = await new Promise<any>((resolve, reject) => {
        createPauta(pautaData, {
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
      {/* Header */}
      <div className="bg-card p-4 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Criar Nova Pauta</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-1" />
            Ajuda
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </Button>
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-card rounded-lg shadow-sm border">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="titulo" className="text-sm font-medium mb-1">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => handleInputChange("titulo", e.target.value)}
                      placeholder="Digite o título da pauta"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_post" className="text-sm font-medium mb-1">Tipo de Post *</Label>
                    <Select value={formData.tipo_post} onValueChange={(value: PostType) => handleInputChange("tipo_post", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de post" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feed">Instagram Feed</SelectItem>
                        <SelectItem value="story">Instagram Story</SelectItem>
                        <SelectItem value="reel">Instagram Reel</SelectItem>
                        <SelectItem value="carousel">Instagram Carrossel</SelectItem>
                        <SelectItem value="facebook">Facebook Post</SelectItem>
                        <SelectItem value="twitter">Twitter Post</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data_prazo" className="text-sm font-medium mb-1">Data de Publicação *</Label>
                    <Input
                      id="data_prazo"
                      type="date"
                      value={formData.data_prazo}
                      onChange={(e) => handleInputChange("data_prazo", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cliente" className="text-sm font-medium mb-1">Cliente *</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => handleInputChange("cliente", e.target.value)}
                      placeholder="Nome do cliente"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1">Tags</Label>
                    <div className="flex flex-wrap items-center border rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-ring">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="bg-primary/10 text-primary text-xs rounded-full px-2 py-1 m-1 flex items-center">
                          {tag}
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="ml-1 h-4 w-4 p-0 hover:bg-destructive/20"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Adicionar tag..."
                        className="border-0 focus:ring-0 text-sm p-1 flex-grow"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="legenda" className="text-sm font-medium mb-1">Legenda/Caption *</Label>
                    <Textarea
                      id="legenda"
                      value={formData.legenda}
                      onChange={(e) => handleInputChange("legenda", e.target.value)}
                      placeholder="Digite a legenda do post..."
                      rows={4}
                      required
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{formData.legenda.length}/2200 caracteres</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hashtags" className="text-sm font-medium mb-1">Hashtags</Label>
                    <Input
                      id="hashtags"
                      value={formData.hashtags}
                      onChange={(e) => handleInputChange("hashtags", e.target.value)}
                      placeholder="Digite as hashtags separadas por espaços"
                      className="pl-7"
                    />
                    <span className="absolute left-2 top-2 text-muted-foreground">#</span>
                  </div>
                </div>
              </div>

              {/* Assets Upload Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Assets</h3>
                
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-lg font-medium mb-2">Arraste e solte arquivos aqui</h4>
                    <p className="text-sm text-muted-foreground mb-4">Envie JPG, PNG, GIF para imagens ou MP4 para vídeos</p>
                    <div className="flex justify-center">
                      <Button 
                        type="button" 
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivos
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Tamanho máximo: 100MB</p>
                  </div>
                </div>

                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {arquivos.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Arquivos Enviados ({arquivos.length})</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {arquivos.map((arquivo, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden bg-card">
                          <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                            {getFileType(arquivo) === 'image' ? (
                              <img 
                                src={URL.createObjectURL(arquivo)} 
                                alt={arquivo.name}
                                className="w-full h-full object-cover"
                              />
                            ) : getFileType(arquivo) === 'video' ? (
                              <Play className="h-12 w-12 text-muted-foreground" />
                            ) : (
                              <div className="text-center">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                                  <span className="text-primary font-medium">DOC</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <Button variant="secondary" size="sm" className="h-7 w-7 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-7 w-7 p-0"
                                onClick={() => removeFile(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <span className="text-white text-sm font-medium">{arquivo.name}</span>
                            </div>
                          </div>
                          
                          <div className="p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-muted-foreground">{formatFileSize(arquivo.size)}</span>
                              {index === 0 && (
                                <span className="text-xs text-success font-medium">Principal</span>
                              )}
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="bg-success h-1.5 rounded-full w-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Opções Adicionais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="auto-schedule" 
                          checked={autoSchedule}
                          onCheckedChange={(checked) => setAutoSchedule(checked === true)}
                        />
                        <Label htmlFor="auto-schedule" className="text-sm">
                          Agendar automaticamente para melhor engajamento
                        </Label>
                      </div>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="notify-team" 
                          checked={notifyTeam}
                          onCheckedChange={(checked) => setNotifyTeam(checked === true)}
                        />
                        <Label htmlFor="notify-team" className="text-sm">
                          Notificar equipe quando cliente revisar
                        </Label>
                      </div>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="require-approval" 
                          checked={requireApproval}
                          onCheckedChange={(checked) => setRequireApproval(checked === true)}
                        />
                        <Label htmlFor="require-approval" className="text-sm">
                          Requer aprovação do cliente antes de publicar
                        </Label>
                      </div>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacoes" className="text-sm font-medium mb-1">
                      Observações Internas (não visível para o cliente)
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      placeholder="Adicione observações internas aqui..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <Button type="button" variant="outline" disabled={isCreating || uploading}>
                  Salvar como Rascunho
                </Button>
                <Button type="button" variant="outline" disabled={isCreating || uploading}>
                  Visualizar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || uploading}
                  className="flex items-center"
                >
                  {(isCreating || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar e Compartilhar com Cliente
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};