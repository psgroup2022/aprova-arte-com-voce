import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Save, Eye, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePautaFormV2 } from '@/hooks/usePautaFormV2';
import { usePautaSubmit } from '@/hooks/usePautaSubmit';
import { VersaoSelector } from '@/components/criar-pauta/VersaoSelector';
import { PautaInfoBasicaV2 } from '@/components/criar-pauta/PautaInfoBasicaV2';
import { BlocosContainer } from '@/components/criar-pauta/BlocosContainer';
import { LegendaFinalSection } from '@/components/criar-pauta/LegendaFinalSection';
import { ApprovalLinkDisplay } from '@/components/ApprovalLinkDisplay';
import { NovoClienteDialog } from '@/components/NovoClienteDialog';

export const CriarPauta = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false);

  const {
    formData,
    getVersaoAtiva,
    updateField,
    addBloco,
    removeBloco,
    updateBloco,
    addItemToBloco,
    removeItemFromBloco,
    updateBlocoItem,
    createNewVersion,
    setVersaoAtiva,
    updateTags,
    updateHashtagsPrincipais,
  } = usePautaFormV2();

  const { submitPauta, isSubmitting, approvalLink, setApprovalLink } = usePautaSubmit();

  const versaoAtiva = getVersaoAtiva();
  const isVersaoReadOnly = !versaoAtiva?.ativa;

  const handleSubmit = async (status: 'rascunho' | 'aguardando_aprovacao') => {
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
        title: 'Campos obrigatórios',
        description: 'Título e cliente são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      await submitPauta(formData, user.id, status);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleClienteCreated = (clienteId: string) => {
    updateField('cliente_id', clienteId);
    setShowNovoClienteDialog(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">
              Você precisa estar logado para criar uma pauta.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/login')}
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground">
            Criar Pauta
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie pautas com múltiplos formatos de conteúdo para aprovação
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Versão Selector */}
          <VersaoSelector
            versoes={formData.versoes}
            versaoAtiva={formData.versao_ativa}
            onVersaoChange={setVersaoAtiva}
            onCreateNewVersion={createNewVersion}
            disabled={isSubmitting}
          />

          {/* Informações básicas da pauta */}
          <div className="bg-card rounded-xl border-2 p-6">
            <PautaInfoBasicaV2
              titulo={formData.titulo}
              clienteId={formData.cliente_id}
              dataPrevista={formData.data_prevista}
              tags={formData.tags}
              observacoesInternas={formData.observacoes_internas}
              onTituloChange={(value) => updateField('titulo', value)}
              onClienteChange={(value) => updateField('cliente_id', value)}
              onDataPrevistaChange={(value) => updateField('data_prevista', value)}
              onTagsChange={updateTags}
              onObservacoesChange={(value) => updateField('observacoes_internas', value)}
              onNovoCliente={() => setShowNovoClienteDialog(true)}
              disabled={isSubmitting || isVersaoReadOnly}
            />
          </div>

          {/* Blocos de Material */}
          <BlocosContainer
            blocos={versaoAtiva?.blocos || []}
            onAddBloco={addBloco}
            onRemoveBloco={removeBloco}
            onUpdateBloco={updateBloco}
            onAddItem={addItemToBloco}
            onRemoveItem={removeItemFromBloco}
            onUpdateItem={updateBlocoItem}
            disabled={isSubmitting || isVersaoReadOnly}
          />

          {/* Legenda Final e Hashtags */}
          <LegendaFinalSection
            legenda={formData.legenda_final}
            hashtags={formData.hashtags_principais}
            onLegendaChange={(value) => updateField('legenda_final', value)}
            onHashtagsChange={updateHashtagsPrincipais}
            disabled={isSubmitting || isVersaoReadOnly}
          />

          {/* Link de aprovação (após criar) */}
          {approvalLink && (
            <ApprovalLinkDisplay
              approvalLink={approvalLink}
              onNavigateHome={() => navigate('/')}
            />
          )}

          {/* Botões de ação */}
          {!approvalLink && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('rascunho')}
                disabled={isSubmitting || isVersaoReadOnly}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Rascunho
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isVersaoReadOnly}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </Button>
              
              <Button
                type="button"
                onClick={() => handleSubmit('aguardando_aprovacao')}
                disabled={isSubmitting || isVersaoReadOnly}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar para Aprovação
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog novo cliente */}
      <NovoClienteDialog
        open={showNovoClienteDialog}
        onOpenChange={setShowNovoClienteDialog}
        onClienteCreated={handleClienteCreated}
      />
    </Layout>
  );
};
