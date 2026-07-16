import React from 'react';
import { useParams } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { usePautaData } from '@/hooks/usePautaData';
import { useComentarios } from '@/hooks/useComentarios';
import { useAprovacao } from '@/hooks/useAprovacao';
import { PautaHeader } from '@/components/pauta/PautaHeader';
import { ArquivosPreview } from '@/components/pauta/ArquivosPreview';
import { ApprovalActions } from '@/components/pauta/ApprovalActions';
import { CommentsSection } from '@/components/pauta/CommentsSection';
import { LoadingState } from '@/components/pauta/LoadingState';
import { NotFoundState } from '@/components/pauta/NotFoundState';

export const VisualizarPauta = () => {
  const { id } = useParams();

  const { pauta, arquivos, blocos, comentarios, isLoading, error } = usePautaData(id!);

  const {
    newComment,
    setNewComment,
    showAddComment,
    setShowAddComment,
    pendingPin,
    editingComment,
    setEditingComment,
    addComentarioMutation,
    handleAddComment,
    handleImageClick,
    handleEditComment,
    handleSaveEdit,
    handleDeleteComment,
    cancelComment,
    cancelEdit,
  } = useComentarios(id!);

  const { selectedApproval, handleApprovalClick } = useAprovacao(id!);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar a pauta</h2>
          <p className="text-muted-foreground">Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  if (!pauta) {
    return <NotFoundState />;
  }

  return (
    <div className="min-h-screen bg-card font-sans">
      <PautaHeader
        titulo={pauta.titulo}
        cliente={pauta.cliente}
        dataPrazo={pauta.data_prazo ?? undefined}
      />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col md:flex-row">
        <ArquivosPreview
          arquivos={arquivos}
          blocos={blocos}
          comentarios={comentarios}
          pendingPin={pendingPin}
          onImageClick={handleImageClick}
          descricao={pauta.descricao ?? undefined}
          onShowAddComment={() => setShowAddComment(true)}
        />

        {/* Feedback Section */}
        <div className="w-full md:w-2/5 border-l border-border flex flex-col md:sticky md:top-[81px] md:self-start md:h-[calc(100vh-81px)] md:overflow-y-auto">
          <ApprovalActions
            selectedApproval={selectedApproval}
            onApprovalClick={handleApprovalClick}
          />

          <CommentsSection
            comentarios={comentarios}
            showAddComment={showAddComment}
            newComment={newComment}
            pendingPin={pendingPin}
            isPending={addComentarioMutation.isPending}
            editingComment={editingComment}
            onNewCommentChange={setNewComment}
            onShowAddComment={() => setShowAddComment(true)}
            onAddComment={handleAddComment}
            onCancelComment={cancelComment}
            onEditComment={handleEditComment}
            onSaveEdit={handleSaveEdit}
            onDeleteComment={handleDeleteComment}
            onCancelEdit={cancelEdit}
            setEditingComment={setEditingComment}
          />
        </div>
      </div>

      {/* Help Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-lg border border-border hover:bg-muted">
        <HelpCircle className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
};
