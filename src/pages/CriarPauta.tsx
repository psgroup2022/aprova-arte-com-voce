import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Loader2, X, CloudUpload, Play, Edit, Trash2, HelpCircle, Bell, Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClientes } from "@/hooks/useClientes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClienteDialog } from "@/components/ClienteDialog";

type PostType = "feed" | "story" | "reel" | "carousel" | "facebook" | "twitter";

interface PostData {
  legenda: string;
  hashtags: string;
  arquivo?: File;
}

interface FormData {
  titulo: string;
  tipo_post: PostType | "";
  quantidade_materiais: number;
  data_prazo: string;
  responsavel: string;
  tags: string[];
  cliente_id: string;
  observacoes: string;
  posts: PostData[];
}

export const CriarPauta = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { clientes, isLoading: clientesLoading } = useClientes();
  
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    tipo_post: "",
    quantidade_materiais: 1,
    data_prazo: "",
    responsavel: "",
    tags: [],
    cliente_id: "",
    observacoes: "",
    posts: [{ legenda: "", hashtags: "", arquivo: undefined }],
  });
  
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [approvalLink, setApprovalLink] = useState("");

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Quando a quantidade muda, ajusta os posts
      if (field === 'quantidade_materiais') {
        const quantidade = value as number;
        const currentPosts = updated.posts;
        
        if (quantidade > currentPosts.length) {
          // Adiciona novos posts
          const novoPosts = Array(quantidade - currentPosts.length).fill(null).map(() => ({
            legenda: "",
            hashtags: "",
            arquivo: undefined
          }));
          updated.posts = [...currentPosts, ...novoPosts];
        } else if (quantidade < currentPosts.length) {
          // Remove posts extras
          updated.posts = currentPosts.slice(0, quantidade);
        }
      }
      
      return updated;
    });
  };

  const handlePostChange = (index: number, field: keyof PostData, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      posts: prev.posts.map((post, i) => 
        i === index ? { ...post, [field]: value } : post
      )
    }));
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

  const handleFileSelect = (postIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePostChange(postIndex, 'arquivo', file);
    }
  };

  const removeFile = (postIndex: number) => {
    handlePostChange(postIndex, 'arquivo', undefined as any);
  };

  const uploadFile = async (file: File, pautaId: string, ordem: number = 0) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pautaId}/${Date.now()}_${ordem}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('pauta-arquivos')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pauta-arquivos')
      .getPublicUrl(fileName);

    const tipo = file.type.startsWith('image/') ? 'imagem' : 
                 file.type.startsWith('video/') ? 'video' : 'documento';

    const { error: dbError } = await supabase
      .from('pauta_arquivos')
      .insert({
        pauta_id: pautaId,
        nome_arquivo: file.name,
        tipo,
        url: publicUrl,
        tamanho: file.size,
        ordem,
      });

    if (dbError) {
      throw dbError;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado!",
        description: "O link de aprovação foi copiado para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Copie manualmente.",
        variant: "destructive",
      });
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
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

    if (!formData.titulo || !formData.cliente_id) {
      toast({
        title: "Erro", 
        description: "Título e cliente são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar se todos os posts têm legenda
    const postsValidos = formData.posts.every(post => post.legenda.trim());
    if (!postsValidos) {
      toast({
        title: "Erro",
        description: "Todos os posts devem ter legenda",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Buscar nome do cliente
      const clienteSelecionado = clientes.find(c => c.id === formData.cliente_id);
      const nomeCliente = clienteSelecionado?.nome || formData.cliente_id;
      
      // Criar pauta
      const { data: novaPauta, error: pautaError } = await supabase
        .from('pautas')
        .insert({
          titulo: formData.titulo,
          descricao: `${formData.posts.length} ${formData.tipo_post === 'carousel' ? 'imagens no carrossel' : 'posts'}\n\n${formData.posts.map((p, i) => `Post ${i + 1}: ${p.legenda}`).join('\n\n')}`,
          cliente: nomeCliente,
          data_prazo: formData.data_prazo || null,
          observacoes: formData.observacoes || null,
          criado_por: user.id,
          status: 'aguardando_aprovacao'
        })
        .select()
        .single();

      if (pautaError) {
        throw pautaError;
      }

      // Upload dos arquivos
      const uploadPromises = formData.posts
        .filter(post => post.arquivo)
        .map((post, index) => uploadFile(post.arquivo!, novaPauta.id, index));

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      const linkAprovacao = `${window.location.origin}/pauta/${novaPauta.id}`;
      setApprovalLink(linkAprovacao);
      
      toast({
        title: "Pauta criada com sucesso!",
        description: "Link de aprovação gerado.",
      });
      
    } catch (error) {
      console.error("Erro detalhado:", error);
      toast({
        title: "Erro",
        description: `Erro ao criar pauta: ${error?.message || "Tente novamente."}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClienteCreated = (clienteId: string) => {
    setFormData(prev => ({ ...prev, cliente_id: clienteId }));
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
                    <Label htmlFor="quantidade_materiais" className="text-sm font-medium mb-1">Quantidade de Materiais *</Label>
                    <Select 
                      value={formData.quantidade_materiais.toString()} 
                      onValueChange={(value) => handleInputChange("quantidade_materiais", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a quantidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'material' : 'materiais'}
                            {formData.tipo_post === 'carousel' && num > 1 ? ' (imagens no carrossel)' : 
                             formData.tipo_post !== 'carousel' && num > 1 ? ' posts' : ' post'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.tipo_post === 'carousel' 
                        ? 'Para carrossel: cada material é uma imagem do carrossel'
                        : 'Cada material é um post separado'
                      }
                    </p>
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
                    <div className="flex gap-2">
                      <Select value={formData.cliente_id} onValueChange={(value) => handleInputChange("cliente_id", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                              {cliente.empresa && ` - ${cliente.empresa}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <ClienteDialog onClienteCreated={handleClienteCreated} />
                    </div>
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

                {/* Right Column - Observações */}
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="observacoes" className="text-sm font-medium mb-1">
                      Observações Internas (não visível para o cliente)
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      placeholder="Adicione observações internas aqui..."
                      rows={6}
                    />
                  </div>

                  {/* Additional Options */}
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
                </div>
              </div>

              {/* Posts dinamicos */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">
                  {formData.tipo_post === 'carousel' ? 'Imagens do Carrossel' : 'Posts'} 
                  ({formData.quantidade_materiais})
                </h3>
                
                <div className="space-y-6">
                  {formData.posts.map((post, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium">
                          {formData.tipo_post === 'carousel' ? `Imagem ${index + 1}` : `Post ${index + 1}`}
                        </h4>
                        {post.arquivo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`legenda-${index}`} className="text-sm font-medium mb-1">
                            {formData.tipo_post === 'carousel' ? 'Descrição da Imagem' : 'Legenda'} *
                          </Label>
                          <Textarea
                            id={`legenda-${index}`}
                            value={post.legenda}
                            onChange={(e) => handlePostChange(index, 'legenda', e.target.value)}
                            placeholder={formData.tipo_post === 'carousel' 
                              ? 'Descreva esta imagem...' 
                              : 'Digite a legenda do post...'}
                            rows={3}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`hashtags-${index}`} className="text-sm font-medium mb-1">Hashtags</Label>
                          <Input
                            id={`hashtags-${index}`}
                            value={post.hashtags}
                            onChange={(e) => handlePostChange(index, 'hashtags', e.target.value)}
                            placeholder="#hashtag1 #hashtag2"
                          />
                        </div>
                      </div>

                      {/* Upload de arquivo */}
                      <div className="mt-4">
                        <Label className="text-sm font-medium mb-2 block">Arquivo</Label>
                        {post.arquivo ? (
                          <div className="border rounded-lg p-4 bg-background">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                                {getFileType(post.arquivo) === 'image' ? (
                                  <img 
                                    src={URL.createObjectURL(post.arquivo)} 
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : getFileType(post.arquivo) === 'video' ? (
                                  <Play className="h-6 w-6 text-primary" />
                                ) : (
                                  <span className="text-primary font-medium text-xs">DOC</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{post.arquivo.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(post.arquivo.size)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                            <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">Arraste um arquivo ou clique para selecionar</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Selecionar Arquivo
                            </Button>
                            <input
                              type="file"
                              id={`file-upload-${index}`}
                              accept="image/*,video/*"
                              onChange={(e) => handleFileSelect(index, e)}
                              className="hidden"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Link de aprovação */}
              {approvalLink && (
                <div className="mt-8 p-4 bg-success/10 border border-success/20 rounded-lg">
                  <h3 className="text-lg font-medium text-success mb-2">Pauta criada com sucesso!</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Link de aprovação gerado. Compartilhe com o cliente para aprovação:
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={approvalLink}
                      readOnly
                      className="flex-1 bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(approvalLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openLink(approvalLink)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!approvalLink && (
                <div className="mt-8 flex justify-end space-x-3">
                  <Button type="button" variant="outline" disabled={uploading}>
                    Salvar como Rascunho
                  </Button>
                  <Button type="button" variant="outline" disabled={uploading}>
                    Visualizar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploading}
                    className="flex items-center"
                  >
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar e Compartilhar com Cliente
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              )}

              {approvalLink && (
                <div className="mt-8 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => navigate("/")}
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};