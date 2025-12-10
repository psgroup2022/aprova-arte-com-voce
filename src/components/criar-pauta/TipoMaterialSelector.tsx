import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TipoMaterial, MATERIAL_CONFIG } from '@/types/pauta-form';
import { 
  Images, 
  Smartphone, 
  Film, 
  Image, 
  Linkedin, 
  Mail, 
  MessageCircle 
} from 'lucide-react';

interface TipoMaterialSelectorProps {
  value?: TipoMaterial;
  onSelect: (tipo: TipoMaterial) => void;
  disabled?: boolean;
}

const iconMap = {
  Images,
  Smartphone,
  Film,
  Image,
  Linkedin,
  Mail,
  MessageCircle
};

export const TipoMaterialSelector: React.FC<TipoMaterialSelectorProps> = ({
  value,
  onSelect,
  disabled = false
}) => {
  return (
    <Select 
      value={value} 
      onValueChange={(val) => onSelect(val as TipoMaterial)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione o tipo de material" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(MATERIAL_CONFIG) as [TipoMaterial, typeof MATERIAL_CONFIG[TipoMaterial]][]).map(([tipo, config]) => {
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          return (
            <SelectItem key={tipo} value={tipo}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

// Componente para adicionar novo bloco
interface AddBlocoButtonProps {
  onAdd: (tipo: TipoMaterial) => void;
  disabled?: boolean;
}

export const AddBlocoButton: React.FC<AddBlocoButtonProps> = ({
  onAdd,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (tipo: TipoMaterial) => {
    onAdd(tipo);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Select 
        open={isOpen} 
        onOpenChange={setIsOpen}
        onValueChange={(val) => handleSelect(val as TipoMaterial)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full border-dashed border-2 bg-muted/30 hover:bg-muted/50 transition-colors">
          <SelectValue placeholder="+ Adicionar bloco de material" />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(MATERIAL_CONFIG) as [TipoMaterial, typeof MATERIAL_CONFIG[TipoMaterial]][]).map(([tipo, config]) => {
            const Icon = iconMap[config.icon as keyof typeof iconMap];
            return (
              <SelectItem key={tipo} value={tipo}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
