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
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerate = async () => {
    const result = await generateReviewDoc(formData, clienteNome);
    if (result.success && result.url) {
      setGeneratedUrl(result.url);
      setShowDialog(true);
    }
  };

  const versaoAtiva = formData.versoes.find(
    (v) => v.numero === formData.versao_ativa
  );
  const hasMidias = versaoAtiva?.blocos.some((bloco) =>
    bloco.itens.some((item) => item.arquivos && item.arquivos.length > 0)
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGenerate}
        disabled={disabled || isGenerating || !hasMidias}
        className="gap-2"
        title={!hasMidias ? 'Adicione mídias primeiro para gerar o documento' : undefined}
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
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Link do documento:
              </p>
              <p className="text-sm font-mono break-all text-foreground">
                {generatedUrl}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (generatedUrl) {
                    const a = document.createElement('a');
                    a.href = generatedUrl;
                    a.download = `revisao_${formData.titulo || 'pauta'}.pdf`;
                    a.click();
                  }
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
              <Button
                onClick={() => {
                  if (generatedUrl) {
                    window.open(generatedUrl, '_blank');
                  }
                }}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no Navegador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
