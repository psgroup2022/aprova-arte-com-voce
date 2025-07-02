import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApprovalLinkDisplayProps {
  approvalLink: string;
  onNavigateHome: () => void;
}

export const ApprovalLinkDisplay = ({ approvalLink, onNavigateHome }: ApprovalLinkDisplayProps) => {
  const { toast } = useToast();

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

  return (
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
      <div className="mt-4 flex justify-end">
        <Button 
          type="button" 
          onClick={onNavigateHome}
        >
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
};