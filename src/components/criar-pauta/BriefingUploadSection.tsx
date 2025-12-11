import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import mammoth from 'mammoth';

export interface ParsedBriefingData {
  titulo?: string;
  cliente?: string;
  dataPrevista?: string | null;
  tags?: string[];
  materiais?: Array<{
    tipo: 'estatico' | 'carrossel' | 'story' | 'reels' | 'linkedin_artigo' | 'email' | 'whatsapp';
    itens: Array<{
      texto?: string;
      chamada?: string;
      hashtags?: string[];
    }>;
    legenda?: string;
  }>;
}

interface BriefingUploadSectionProps {
  onBriefingParsed: (data: ParsedBriefingData) => void;
  disabled?: boolean;
}

export const BriefingUploadSection: React.FC<BriefingUploadSectionProps> = ({
  onBriefingParsed,
  disabled = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const readFileContent = async (file: File): Promise<string> => {
    // Para arquivos DOCX, usar mammoth.js
    if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    // Para TXT, ler como texto
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
    
    // Para PDF e DOC antigos, retornar mensagem informativa
    if (file.name.endsWith('.pdf') || file.name.endsWith('.doc')) {
      throw new Error('Formato PDF/DOC antigo não suportado. Use DOCX ou TXT.');
    }
    
    throw new Error('Formato de arquivo não suportado');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const isAllowed = allowedTypes.includes(selectedFile.type) || 
      selectedFile.name.endsWith('.docx') || 
      selectedFile.name.endsWith('.txt');

    if (!isAllowed) {
      toast({
        title: 'Formato não suportado',
        description: 'Por favor, selecione um arquivo DOCX ou TXT.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessed(false);
    setIsReadingFile(true);
    
    try {
      const content = await readFileContent(selectedFile);
      setFileContent(content);
      console.log('Conteúdo extraído do documento:', content.substring(0, 500) + '...');
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast({
        title: 'Erro ao ler arquivo',
        description: error instanceof Error ? error.message : 'Não foi possível ler o conteúdo do arquivo.',
        variant: 'destructive'
      });
      setFile(null);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleProcessFile = async () => {
    if (!file || !fileContent) {
      toast({
        title: 'Nenhum arquivo',
        description: 'Selecione um arquivo primeiro.',
        variant: 'destructive'
      });
      return;
    }

    setIsParsing(true);

    try {
      console.log('Enviando para parse-briefing:', fileContent.substring(0, 300) + '...');
      
      const { data, error } = await supabase.functions.invoke('parse-briefing', {
        body: { documentContent: fileContent }
      });

      console.log('Resposta do parse-briefing:', data);

      if (error) throw error;

      if (data?.success && data?.data) {
        setIsProcessed(true);
        onBriefingParsed(data.data);
        toast({
          title: 'Briefing processado!',
          description: `Encontrados ${data.data.materiais?.length || 0} materiais.`,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao processar briefing:', error);
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsParsing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileContent('');
    setIsProcessed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Upload de Briefing
        </CardTitle>
        <CardDescription>
          Faça upload do arquivo de briefing e o sistema preencherá automaticamente os campos da pauta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {file ? (
          <div className="space-y-3">
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-lg border",
              isProcessed ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "bg-muted/50"
            )}>
              {isProcessed ? (
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <FileText className="w-8 h-8 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                  {isReadingFile && <span className="ml-2">• Lendo arquivo...</span>}
                  {isProcessed && <span className="text-green-600 dark:text-green-400 ml-2">• Processado com sucesso</span>}
                </p>
              </div>
              {!isParsing && !isReadingFile && (
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

            {!isProcessed && (
              <Button
                type="button"
                onClick={handleProcessFile}
                disabled={disabled || isParsing || isReadingFile || !fileContent}
                className="w-full gap-2"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando com IA...
                  </>
                ) : isReadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Lendo arquivo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Processar Arquivo
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              "hover:border-primary hover:bg-primary/5",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-base font-medium text-foreground mb-1">
              Arraste o arquivo ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              DOCX ou TXT (máx. 10MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
};
