import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Edit3, X } from 'lucide-react';

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
        <Button
          onClick={() => onApprovalClick('approved-changes')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'approved-changes'
              ? 'bg-warning'
              : 'bg-warning/60 hover:bg-warning'
          } text-warning-foreground`}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Aprovar com alterações
        </Button>
        <Button
          onClick={() => onApprovalClick('rejected')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'rejected'
              ? 'bg-destructive'
              : 'bg-destructive/80 hover:bg-destructive'
          } text-destructive-foreground`}
        >
          <X className="w-4 h-4 mr-2" />
          Reprovar
        </Button>
      </div>
    </div>
  );
};
