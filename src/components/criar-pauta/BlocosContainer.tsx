import React from 'react';
import { BlocoMaterial, BlocoItem, TipoMaterial } from '@/types/pauta-form';
import { BlocoMaterialCard } from './BlocoMaterialCard';
import { AddBlocoButton } from './TipoMaterialSelector';
import { Layers } from 'lucide-react';

interface BlocosContainerProps {
  blocos: BlocoMaterial[];
  onAddBloco: (tipo: TipoMaterial) => void;
  onRemoveBloco: (index: number) => void;
  onUpdateBloco: (index: number, updates: Partial<BlocoMaterial>) => void;
  onAddItem: (blocoIndex: number) => void;
  onRemoveItem: (blocoIndex: number, itemIndex: number) => void;
  onUpdateItem: (blocoIndex: number, itemIndex: number, updates: Partial<BlocoItem>) => void;
  disabled?: boolean;
}

export const BlocosContainer: React.FC<BlocosContainerProps> = ({
  blocos,
  onAddBloco,
  onRemoveBloco,
  onUpdateBloco,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  disabled = false
}) => {
  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Blocos de Material
          </h2>
          {blocos.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({blocos.length} {blocos.length === 1 ? 'bloco' : 'blocos'})
            </span>
          )}
        </div>
      </div>

      {/* Lista de blocos */}
      {blocos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
          <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Nenhum bloco de material
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Adicione blocos de material como Carrossel, Story, Reels, etc.
          </p>
          <div className="max-w-xs mx-auto">
            <AddBlocoButton onAdd={onAddBloco} disabled={disabled} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {blocos.map((bloco, blocoIndex) => (
            <BlocoMaterialCard
              key={bloco.id || blocoIndex}
              bloco={bloco}
              blocoIndex={blocoIndex}
              onUpdate={(updates) => onUpdateBloco(blocoIndex, updates)}
              onRemove={() => onRemoveBloco(blocoIndex)}
              onAddItem={() => onAddItem(blocoIndex)}
              onRemoveItem={(itemIndex) => onRemoveItem(blocoIndex, itemIndex)}
              onUpdateItem={(itemIndex, updates) => onUpdateItem(blocoIndex, itemIndex, updates)}
              disabled={disabled}
            />
          ))}

          {/* Botão para adicionar mais blocos */}
          <div className="pt-2">
            <AddBlocoButton onAdd={onAddBloco} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
};
