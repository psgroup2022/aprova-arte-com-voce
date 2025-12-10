import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefingUploadProps {
  onBriefingParsed?: (data: {
    titulo?: string;
    dataPrevista?: string;
    conteudo?: string;
  }) => void;
  disabled?: boolean;
}

export const BriefingUpload: React.FC<BriefingUploadProps> = ({
  onBriefingParsed,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Por favor, selecione um arquivo PDF, DOC, DOCX ou TXT.');
      return;
    }

    setFile(selectedFile);
    
    // TODO: Implementar parser de briefing com Lovable AI
    // Por enquanto, apenas armazena o arquivo
    if (onBriefingParsed) {
      setIsParsing(true);
      // Simular parsing (será substituído por chamada real à API)
      setTimeout(() => {
        setIsParsing(false);
      }, 1000);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Upload de Briefing
        <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
      </label>
      
      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <FileText className="w-8 h-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {isParsing ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
            "hover:border-primary hover:bg-primary/5",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">
            Arraste um arquivo ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX ou TXT (máx. 10MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <p className="text-xs text-muted-foreground">
        O briefing será analisado automaticamente para preencher os campos da pauta.
      </p>
    </div>
  );
};
