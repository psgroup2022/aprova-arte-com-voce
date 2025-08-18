import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientes } from '@/hooks/useClientes';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PautaFormHeader } from '@/components/PautaFormHeader';
import { PautaBasicInfoForm } from '@/components/PautaBasicInfoForm';
import { TagManager } from '@/components/TagManager';
import { PautaFormOptions } from '@/components/PautaFormOptions';
import { PostManager } from '@/components/PostManager';
import { ApprovalLinkDisplay } from '@/components/ApprovalLinkDisplay';
import { FormData, PostData } from '@/types/pauta-form';

export const CriarPauta = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { clientes } = useClientes();

  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    tipo_post: '',
    quantidade_materiais: 1,
    data_prazo: '',
    responsavel: '',
    tags: [],
    cliente_id: '',
    observacoes: '',
    posts: [{ legenda: '', hashtags: '', arquivo: undefined }],
  });

  const [uploading, setUploading] = useState(false);
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [approvalLink, setApprovalLink] = useState('');

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Quando a quantidade muda, ajusta os posts
      if (field === 'quantidade_materiais') {
        const quantidade = value as number;
        const currentPosts = updated.posts;

        if (quantidade > currentPosts.length) {
          // Adiciona novos posts
          const novoPosts = Array(quantidade - currentPosts.length)
            .fill(null)
            .map(() => ({
              legenda: '',
              hashtags: '',
              arquivo: undefined,
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
    setFormData((prev) => ({
      ...prev,
      posts: prev.posts.map((post, i) => (i === index ? { ...post, [field]: value } : post)),
    }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({ ...prev, tags }));
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

    const {
      data: { publicUrl },
    } = supabase.storage.from('pauta-arquivos').getPublicUrl(fileName);

    const tipo = file.type.startsWith('image/')
      ? 'imagem'
      : file.type.startsWith('video/')
        ? 'video'
        : 'documento';

    const { error: dbError } = await supabase.from('pauta_arquivos').insert({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para criar uma pauta',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.titulo || !formData.cliente_id) {
      toast({
        title: 'Erro',
        description: 'Título e cliente são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    // Validar se todos os posts têm legenda
    const postsValidos = formData.posts.every((post) => post.legenda.trim());
    if (!postsValidos) {
      toast({
        title: 'Erro',
        description: 'Todos os posts devem ter legenda',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      // Buscar nome do cliente
      const clienteSelecionado = clientes.find((c) => c.id === formData.cliente_id);
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
          status: 'aguardando_aprovacao',
        })
        .select()
        .single();

      if (pautaError) {
        throw pautaError;
      }

      // Upload dos arquivos
      const uploadPromises = formData.posts
        .filter((post) => post.arquivo)
        .map((post, index) => uploadFile(post.arquivo!, novaPauta.id, index));

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      const linkAprovacao = `${window.location.origin}/pauta/${novaPauta.id}`;
      setApprovalLink(linkAprovacao);

      toast({
        title: 'Pauta criada com sucesso!',
        description: 'Link de aprovação gerado.',
      });
    } catch (error) {
      console.error('Erro detalhado:', error);
      toast({
        title: 'Erro',
        description: `Erro ao criar pauta: ${(error as any)?.message || 'Tente novamente.'}`,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClienteCreated = (clienteId: string) => {
    setFormData((prev) => ({ ...prev, cliente_id: clienteId }));
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
      <PautaFormHeader />

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-card rounded-lg shadow-sm border">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <PautaBasicInfoForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    onClienteCreated={handleClienteCreated}
                  />

                  <TagManager tags={formData.tags} onTagsChange={handleTagsChange} />
                </div>

                {/* Right Column */}
                <PautaFormOptions
                  observacoes={formData.observacoes}
                  onObservacoesChange={(value) => handleInputChange('observacoes', value)}
                  autoSchedule={autoSchedule}
                  onAutoScheduleChange={setAutoSchedule}
                  notifyTeam={notifyTeam}
                  onNotifyTeamChange={setNotifyTeam}
                  requireApproval={requireApproval}
                  onRequireApprovalChange={setRequireApproval}
                />
              </div>

              <PostManager
                posts={formData.posts}
                tipoPost={formData.tipo_post}
                onPostChange={handlePostChange}
              />

              {/* Link de aprovação */}
              {approvalLink && (
                <ApprovalLinkDisplay
                  approvalLink={approvalLink}
                  onNavigateHome={() => navigate('/')}
                />
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
                  <Button type="submit" disabled={uploading} className="flex items-center">
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar e Compartilhar com Cliente
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
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
