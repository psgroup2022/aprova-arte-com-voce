import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link2, ExternalLink } from 'lucide-react';
import { useMirapautaTasks } from '@/hooks/useMirapauta';
import { isMirapautaConfigured } from '@/integrations/mirapauta';

interface TarefaVinculadaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TarefaVinculadaSelector: React.FC<TarefaVinculadaSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const isConfigured = isMirapautaConfigured();
  const { data: tasks, isLoading } = useMirapautaTasks();

  if (!isConfigured) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Tarefa Vinculada (MiraPauta)
        <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
      </Label>
      <Select
        value={value || 'none'}
        onValueChange={(val) => onChange(val === 'none' ? '' : val)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma tarefa do MiraPauta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Nenhuma tarefa vinculada</span>
          </SelectItem>
          {tasks?.map((task) => (
            <SelectItem key={task.id} value={task.id}>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">
                  {task.ticket_number ? `#${task.ticket_number} - ` : ''}
                  {task.title || 'Sem título'}
                </span>
                {task.cliente && (
                  <span className="text-xs text-muted-foreground">
                    ({task.cliente.nome})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && tasks && (
        <p className="text-xs text-muted-foreground">
          Esta pauta será vinculada à tarefa selecionada do MiraPauta
        </p>
      )}
    </div>
  );
};
