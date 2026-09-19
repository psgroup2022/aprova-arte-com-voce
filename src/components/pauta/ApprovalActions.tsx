import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ApprovalActionsProps {
  selectedApproval: string;
  onApprovalClick: (type: string) => void;
}

export const ApprovalActions = ({ selectedApproval, onApprovalClick }: ApprovalActionsProps) => {
  return (
    <div className="p-5 border-b bg-card">
      <h3 className="text-base font-medium text-foreground mb-4">Revisar este conteúdo</h3>
      <div className="flex space-x-2">
        <Button
          onClick={() => onApprovalClick('approved')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'approved' ? 'bg-success' : 'bg-success/80 hover:bg-success'
          } text-success-foreground`}
        >
          <Check className="w-4 h-4 mr-2" />
          Aprovar
        </Button>
        {/* Duas decisões, não três. "Aprovar com alterações" devolvia a pauta
            ao mesmo `aguardando_aprovacao` de antes do clique e gravava um
            comentário pronto: parecia decisão e não registrava nenhuma. Quem
            aprova com ressalva escreve a ressalva no comentário, que já
            existe, e aprova. Quem quer mudança pede ajuste. */}
        <Button
          onClick={() => onApprovalClick('rejected')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'rejected'
              ? 'bg-destructive'
              : 'bg-destructive/80 hover:bg-destructive'
          } text-destructive-foreground`}
        >
          <X className="w-4 h-4 mr-2" />
          Pedir ajuste
        </Button>
      </div>
    </div>
  );
};
