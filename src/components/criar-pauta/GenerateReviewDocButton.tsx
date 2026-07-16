import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react';
import { useGenerateReviewDoc } from '@/hooks/useGenerateReviewDoc';
import { PautaFormData } from '@/types/pauta-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GenerateReviewDocButtonProps {
  formData: PautaFormData;
  clienteNome: string;
  disabled?: boolean;
}

export const GenerateReviewDocButton: React.FC<GenerateReviewDocButtonProps> = ({
  formData,
  clienteNome,
  disabled = false,
}) => {
  const { generateReviewDoc, isGenerating } = useGenerateReviewDoc();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('revisao.pdf');
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerate = async () => {
    const result = await generateReviewDoc(formData, clienteNome);
    if (result.success) {
      setGeneratedUrl(result.url || null);
      setLocalUrl(result.localUrl || null);
      setDownloadFilename(result.downloadFilename || 'revisao.pdf');

      // Se tem URL local, fazer download automático
      if (result.localUrl && result.downloadFilename) {
        const a = document.createElement('a');
        a.href = result.localUrl;
        a.download = result.downloadFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setShowDialog(true);
    }
  };

  const versaoAtiva = formData.versoes.find((v) => v.numero === formData.versao_ativa);
  const hasConteudo = versaoAtiva?.blocos.some((bloco) =>
    bloco.itens.some(
      (item) =>
        (item.arquivos && item.arquivos.length > 0) ||
        (item.arquivosUrls && item.arquivosUrls.length > 0) ||
        item.titulo ||
        item.assunto ||
        item.texto_conteudo ||
        item.legenda,
    ),
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGenerate}
        disabled={disabled || isGenerating || !hasConteudo}
        className="gap-2"
        title={
          !hasConteudo
            ? 'Adicione conteúdo (mídia ou texto) primeiro para gerar o documento'
            : undefined
        }
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {isGenerating ? 'Gerando...' : 'Gerar Doc de Revisão'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documento Gerado!
            </DialogTitle>
            <DialogDescription>
              O documento de revisão foi gerado e salvo com sucesso.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-4">
            {generatedUrl && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Link do documento (salvo no servidor):
                </p>
                <p className="text-sm font-mono break-all text-foreground">{generatedUrl}</p>
              </div>
            )}

            {!generatedUrl && localUrl && (
              <div className="p-4 bg-primary/10 dark:bg-blue-950/30 rounded-lg border border-primary/30 dark:border-primary/30">
                <p className="text-sm text-primary dark:text-blue-300 mb-2">
                  ℹ️ Download iniciado automaticamente
                </p>
                <p className="text-xs text-primary dark:text-blue-400">
                  O PDF foi gerado localmente. Se o download não iniciou, clique no botão abaixo.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const url = localUrl || generatedUrl;
                  if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = downloadFilename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
              {generatedUrl && (
                <Button
                  onClick={() => {
                    window.open(generatedUrl, '_blank');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Navegador
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
