import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hash, X, Plus } from 'lucide-react';

interface LegendaFinalSectionProps {
  legenda: string;
  hashtags: string[];
  onLegendaChange: (value: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  disabled?: boolean;
}

export const LegendaFinalSection: React.FC<LegendaFinalSectionProps> = ({
  legenda,
  hashtags,
  onLegendaChange,
  onHashtagsChange,
  disabled = false
}) => {
  const [newHashtag, setNewHashtag] = useState('');

  const addHashtag = () => {
    const trimmed = newHashtag.trim().replace(/^#/, '');
    if (trimmed && !hashtags.includes(trimmed)) {
      onHashtagsChange([...hashtags, trimmed]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (index: number) => {
    onHashtagsChange(hashtags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  return (
    <div className="space-y-6 p-6 rounded-xl border-2 bg-card">
      <div className="flex items-center gap-2">
        <Hash className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Legenda Final e Hashtags
        </h2>
      </div>

      {/* Legenda final */}
      <div className="space-y-2">
        <Label htmlFor="legenda-final">
          Legenda Final
          <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
        </Label>
        <Textarea
          id="legenda-final"
          value={legenda}
          onChange={(e) => onLegendaChange(e.target.value)}
          placeholder="Digite a legenda principal que será usada nos posts..."
          rows={4}
          disabled={disabled}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Esta legenda será exibida como padrão para todos os materiais da pauta.
        </p>
      </div>

      {/* Hashtags principais */}
      <div className="space-y-2">
        <Label>
          Hashtags Principais
          <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
        </Label>
        
        {/* Tags adicionadas */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {hashtags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(index)}
                  disabled={disabled}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input para nova hashtag */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma hashtag..."
              disabled={disabled}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addHashtag}
            disabled={disabled || !newHashtag.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pressione Enter ou clique em "Adicionar" para incluir uma nova hashtag.
        </p>
      </div>
    </div>
  );
};
