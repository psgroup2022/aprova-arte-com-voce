import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BlocoItem, TipoMaterial, MATERIAL_CONFIG } from '@/types/pauta-form';
import { Upload, X, Image as ImageIcon, Film, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlocoItemEditorProps {
  item: BlocoItem;
  itemIndex: number;
  tipoMaterial: TipoMaterial;
  onUpdate: (updates: Partial<BlocoItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

export const BlocoItemEditor: React.FC<BlocoItemEditorProps> = ({
  item,
  itemIndex,
  tipoMaterial,
  onUpdate,
  onRemove,
  canRemove,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = MATERIAL_CONFIG[tipoMaterial];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpdate({ arquivos: [...item.arquivos, ...files] });
    }
  };

  const removeFile = (fileIndex: number) => {
    onUpdate({ 
      arquivos: item.arquivos.filter((_, i) => i !== fileIndex) 
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Film;
    return FileText;
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border bg-card space-y-4",
      disabled && "opacity-60"
    )}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-foreground">
          {config.itemLabel} {itemIndex + 1}
        </h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Título (para LinkedIn Artigo) */}
        {config.fields.titulo && (
          <div className="space-y-2">
            <Label htmlFor={`titulo-${itemIndex}`}>Título</Label>
            <Input
              id={`titulo-${itemIndex}`}
              value={item.titulo}
              onChange={(e) => onUpdate({ titulo: e.target.value })}
              placeholder="Digite o título..."
              disabled={disabled}
            />
          </div>
        )}

        {/* Assunto (para Email) */}
        {config.fields.assunto && (
          <div className="space-y-2">
            <Label htmlFor={`assunto-${itemIndex}`}>Assunto</Label>
            <Input
              id={`assunto-${itemIndex}`}
              value={item.assunto}
              onChange={(e) => onUpdate({ assunto: e.target.value })}
              placeholder="Digite o assunto do email..."
              disabled={disabled}
            />
          </div>
        )}

        {/* Corpo/Texto do conteúdo */}
        {(config.fields.texto || config.fields.corpo) && (
          <div className="space-y-2">
            <Label htmlFor={`texto-${itemIndex}`}>
              {config.fields.corpo ? 'Corpo' : 'Texto'}
            </Label>
            <Textarea
              id={`texto-${itemIndex}`}
              value={item.texto_conteudo}
              onChange={(e) => onUpdate({ texto_conteudo: e.target.value })}
              placeholder={config.fields.corpo 
                ? "Digite o conteúdo completo..." 
                : "Digite o texto da peça..."}
              rows={config.fields.corpo ? 6 : 3}
              disabled={disabled}
            />
          </div>
        )}

        {/* Hashtags */}
        {config.fields.hashtags && (
          <div className="space-y-2">
            <Label htmlFor={`hashtags-${itemIndex}`}>Hashtags</Label>
            <Input
              id={`hashtags-${itemIndex}`}
              value={item.hashtags}
              onChange={(e) => onUpdate({ hashtags: e.target.value })}
              placeholder="#hashtag1 #hashtag2 #hashtag3"
              disabled={disabled}
            />
          </div>
        )}

        {/* Upload de mídia */}
        {config.fields.midia && (
          <div className="space-y-2">
            <Label>Mídia</Label>
            
            {/* Arquivos já adicionados */}
            {item.arquivos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.arquivos.map((file, fileIndex) => {
                  const FileIcon = getFileIcon(file);
                  return (
                    <div
                      key={fileIndex}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm"
                    >
                      <FileIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(fileIndex)}
                        disabled={disabled}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Área de upload */}
            <div
              onClick={() => !disabled && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-primary/5",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Clique ou arraste para adicionar imagem/vídeo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
