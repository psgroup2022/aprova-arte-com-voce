import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BlocoMaterial,
  BlocoItem,
  BlocoStatus,
  MATERIAL_CONFIG,
  BLOCO_STATUS_LABELS,
} from '@/types/pauta-form';
import { BlocoItemEditor } from './BlocoItemEditor';
import { BlocoUploadHeader } from './BlocoUploadHeader';
import {
  Images,
  Smartphone,
  Film,
  Image,
  Linkedin,
  Mail,
  MessageCircle,
  Trash2,
  Plus,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlocoMaterialCardProps {
  bloco: BlocoMaterial;
  blocoIndex: number;
  onUpdate: (updates: Partial<BlocoMaterial>) => void;
  onRemove: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemIndex: number) => void;
  onUpdateItem: (itemIndex: number, updates: Partial<BlocoItem>) => void;
  disabled?: boolean;
}

const iconMap = {
  Images,
  Smartphone,
  Film,
  Image,
  Linkedin,
  Mail,
  MessageCircle,
};

const statusColorMap: Record<BlocoStatus, string> = {
  aguardando_midia: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  pronto: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  enviado_aprovacao: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  em_revisao: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export const BlocoMaterialCard: React.FC<BlocoMaterialCardProps> = ({
  bloco,
  blocoIndex,
  onUpdate,
  onRemove,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  disabled = false,
}) => {
  const config = MATERIAL_CONFIG[bloco.tipo];
  const Icon = iconMap[config.icon as keyof typeof iconMap];
  const hasBlockLevelUpload = config.singleUploadAtBlock;

  const handleUpdateItens = (newItens: BlocoItem[]) => {
    onUpdate({ itens: newItens });
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 bg-card shadow-sm transition-all',
        'hover:shadow-md',
        disabled && 'opacity-60',
      )}
    >
      {/* Header do bloco */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <span>{blocoIndex + 1}</span>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.label}</h3>
            <p className="text-xs text-muted-foreground">
              {bloco.itens.length}{' '}
              {bloco.itens.length === 1
                ? config.itemLabel.toLowerCase()
                : `${config.itemLabel.toLowerCase()}s`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status selector */}
          <Select
            value={bloco.status}
            onValueChange={(val) => onUpdate({ status: val as BlocoStatus })}
            disabled={disabled}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(BLOCO_STATUS_LABELS) as [BlocoStatus, string][]).map(
                ([status, label]) => (
                  <SelectItem key={status} value={status}>
                    <Badge className={cn('text-xs', statusColorMap[status])}>{label}</Badge>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {/* Botão remover bloco */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Upload no nível do bloco (Reels e Carrossel) */}
      {hasBlockLevelUpload && (
        <BlocoUploadHeader
          tipoMaterial={bloco.tipo}
          itens={bloco.itens}
          onUpdateItens={handleUpdateItens}
          disabled={disabled}
        />
      )}

      {/* Itens do bloco */}
      <div className="p-4 space-y-4">
        {bloco.itens.map((item, itemIndex) => (
          <BlocoItemEditor
            key={itemIndex}
            item={item}
            itemIndex={itemIndex}
            tipoMaterial={bloco.tipo}
            onUpdate={(updates) => onUpdateItem(itemIndex, updates)}
            onRemove={() => onRemoveItem(itemIndex)}
            canRemove={bloco.itens.length > 1}
            disabled={disabled}
            hideUpload={hasBlockLevelUpload}
          />
        ))}

        {/* Botão adicionar item */}
        {config.hasMultipleItems && (
          <Button
            type="button"
            variant="outline"
            onClick={onAddItem}
            disabled={disabled}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar {config.itemLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
