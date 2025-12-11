import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TipoMaterial, BlocoItem, createEmptyItem } from '@/types/pauta-form';
import { X, Film, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlocoUploadHeaderProps {
  tipoMaterial: TipoMaterial;
  itens: BlocoItem[];
  onUpdateItens: (itens: BlocoItem[]) => void;
  disabled?: boolean;
}

export const BlocoUploadHeader: React.FC<BlocoUploadHeaderProps> = ({
  tipoMaterial,
  itens,
  onUpdateItens,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isReels = tipoMaterial === 'reels';
  const isCarrossel = tipoMaterial === 'carrossel';
  const isStory = tipoMaterial === 'story';

  // Para Reels: arquivo único no primeiro item
  const reelsVideo = isReels && itens[0]?.arquivos[0];

  // Para Carrossel e Stories: todas as imagens dos itens
  const batchImages = (isCarrossel || isStory) 
    ? itens.map((item, idx) => ({ index: idx, file: item.arquivos[0] })).filter(x => x.file)
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (isReels) {
      // Reels: apenas 1 vídeo, coloca no primeiro item
      const newItens = [...itens];
      if (newItens.length === 0) {
        newItens.push(createEmptyItem(0));
      }
      newItens[0] = { ...newItens[0], arquivos: [files[0]] };
      onUpdateItens(newItens);
    } else if (isCarrossel || isStory) {
      // Carrossel/Stories: cada imagem vira um slide/tela
      const newItens: BlocoItem[] = files.map((file, idx) => {
        const existingItem = itens[idx];
        return {
          ...(existingItem || createEmptyItem(idx)),
          arquivos: [file],
          ordem: idx
        };
      });
      // Mantém slides extras que já tinham texto
      itens.slice(files.length).forEach((item, idx) => {
        if (item.texto_conteudo || item.titulo || item.hashtags) {
          newItens.push({ ...item, arquivos: [], ordem: files.length + idx });
        }
      });
      onUpdateItens(newItens.length > 0 ? newItens : [createEmptyItem(0)]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeReelsVideo = () => {
    const newItens = [...itens];
    if (newItens[0]) {
      newItens[0] = { ...newItens[0], arquivos: [] };
      onUpdateItens(newItens);
    }
  };

  const removeBatchImage = (itemIndex: number) => {
    const newItens = itens.map((item, idx) => 
      idx === itemIndex ? { ...item, arquivos: [] } : item
    );
    onUpdateItens(newItens);
  };

  if (isReels) {
    return (
      <div className="p-4 border-b bg-muted/20">
        <Label className="text-sm font-medium mb-2 block">Vídeo do Reels</Label>
        {reelsVideo ? (
          <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
            <Film className="w-8 h-8 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{reelsVideo.name}</p>
              <p className="text-xs text-muted-foreground">
                {(reelsVideo.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeReelsVideo}
              disabled={disabled}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              "hover:border-primary hover:bg-primary/5",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Film className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Clique para adicionar vídeo</p>
            <p className="text-xs text-muted-foreground mt-1">Um único vídeo para todas as cenas</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  if (isCarrossel || isStory) {
    const label = isStory ? 'Imagens dos Stories' : 'Imagens do Carrossel';
    const itemLabel = isStory ? 'telas' : 'slides';
    
    return (
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">{label}</Label>
          <span className="text-xs text-muted-foreground">
            {batchImages.length} de {itens.length} {itemLabel} com imagem
          </span>
        </div>
        
        {batchImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {batchImages.map(({ index, file }) => (
              <div key={index} className="relative group">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted border">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`${isStory ? 'Tela' : 'Slide'} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                  {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeBatchImage(index)}
                  disabled={disabled}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <Plus className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione as imagens {isStory ? 'dos stories' : 'do carrossel'}
          </p>
          <p className="text-xs text-muted-foreground">
            Cada imagem será associada a {isStory ? 'uma tela' : 'um slide'}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  return null;
};
