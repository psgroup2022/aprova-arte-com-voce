import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle } from "lucide-react";

interface PautaFormOptionsProps {
  observacoes: string;
  onObservacoesChange: (value: string) => void;
  autoSchedule: boolean;
  onAutoScheduleChange: (checked: boolean) => void;
  notifyTeam: boolean;
  onNotifyTeamChange: (checked: boolean) => void;
  requireApproval: boolean;
  onRequireApprovalChange: (checked: boolean) => void;
}

export const PautaFormOptions = ({
  observacoes,
  onObservacoesChange,
  autoSchedule,
  onAutoScheduleChange,
  notifyTeam,
  onNotifyTeamChange,
  requireApproval,
  onRequireApprovalChange
}: PautaFormOptionsProps) => {
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="observacoes" className="text-sm font-medium mb-1">
          Observações Internas (não visível para o cliente)
        </Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          placeholder="Adicione observações internas aqui..."
          rows={6}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-schedule" 
              checked={autoSchedule}
              onCheckedChange={(checked) => onAutoScheduleChange(checked === true)}
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
              onCheckedChange={(checked) => onNotifyTeamChange(checked === true)}
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
              onCheckedChange={(checked) => onRequireApprovalChange(checked === true)}
            />
            <Label htmlFor="require-approval" className="text-sm">
              Requer aprovação do cliente antes de publicar
            </Label>
          </div>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};