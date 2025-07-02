import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Edit3, X } from "lucide-react";

interface ApprovalActionsProps {
  selectedApproval: string;
  onApprovalClick: (type: string) => void;
}

export const ApprovalActions = ({ selectedApproval, onApprovalClick }: ApprovalActionsProps) => {
  return (
    <div className="p-5 border-b border-gray-200 bg-white">
      <h3 className="text-base font-medium text-slate-700 mb-4">Revisar este conteúdo</h3>
      <div className="flex space-x-2">
        <Button 
          onClick={() => onApprovalClick('approved')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'approved' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          <Check className="w-4 h-4 mr-2" />
          Aprovar
        </Button>
        <Button 
          onClick={() => onApprovalClick('approved-changes')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'approved-changes' ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'
          } text-white`}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Aprovar com alterações
        </Button>
        <Button 
          onClick={() => onApprovalClick('rejected')}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md ${
            selectedApproval === 'rejected' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'
          } text-white`}
        >
          <X className="w-4 h-4 mr-2" />
          Reprovar
        </Button>
      </div>
    </div>
  );
};