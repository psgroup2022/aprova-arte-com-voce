import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Clock, Edit } from 'lucide-react';
import { PautaVersao } from '@/types/pauta-form';
import { cn } from '@/lib/utils';

interface VersaoSelectorProps {
  versoes: PautaVersao[];
  versaoAtiva: number;
  onVersaoChange: (numero: number) => void;
  onCreateNewVersion: () => void;
  disabled?: boolean;
}

export const VersaoSelector: React.FC<VersaoSelectorProps> = ({
  versoes,
  versaoAtiva,
  onVersaoChange,
  onCreateNewVersion,
  disabled = false
}) => {
  const getVersaoStatus = (versao: PautaVersao) => {
    if (versao.ativa && versao.numero === versaoAtiva) {
      return { label: 'Em edição', icon: Edit, color: 'bg-primary text-primary-foreground' };
    }
    if (!versao.ativa) {
      return { label: 'Concluída', icon: Check, color: 'bg-muted text-muted-foreground' };
    }
    return { label: 'Pendente', icon: Clock, color: 'bg-secondary text-secondary-foreground' };
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        Versões:
      </span>
      
      {versoes.map((versao) => {
        const status = getVersaoStatus(versao);
        const isActive = versao.numero === versaoAtiva;
        const StatusIcon = status.icon;
        
        return (
          <button
            key={versao.numero}
            onClick={() => onVersaoChange(versao.numero)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "border-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isActive 
                ? "border-primary bg-primary text-primary-foreground shadow-md" 
                : "border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            V{versao.numero}
            {!versao.ativa && (
              <Badge variant="outline" className="ml-1 text-xs py-0 h-4">
                Bloqueada
              </Badge>
            )}
          </button>
        );
      })}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCreateNewVersion}
        disabled={disabled || versoes.length === 0}
        className="ml-2 gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Criar nova versão
      </Button>
    </div>
  );
};
