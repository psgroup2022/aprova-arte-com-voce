import { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import { PautaFormData, MATERIAL_CONFIG } from '@/types/pauta-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateDocResult {
  success: boolean;
  url?: string;
  localUrl?: string;
  downloadFilename?: string;
  error?: string;
}

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
};

export const useGenerateReviewDoc = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const urlToArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    return response.arrayBuffer();
  };

  const getImageDimensions = (arrayBuffer: ArrayBuffer, mimeType: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  };

  const calculateDocxDimensions = (
    originalWidth: number,
    originalHeight: number,
    maxWidthPx: number = 500
  ): { width: number; height: number } => {
    const aspectRatio = originalWidth / originalHeight;
    let width = Math.min(originalWidth, maxWidthPx);
    let height = width / aspectRatio;

    const maxHeightPx = 400;
    if (height > maxHeightPx) {
      height = maxHeightPx;
      width = height * aspectRatio;
    }

    return { width, height };
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  };

  const generateReviewDoc = async (
    formData: PautaFormData,
    clienteNome: string
  ): Promise<GenerateDocResult> => {
    setIsGenerating(true);

    try {
      const children: Paragraph[] = [];

      // === CABEÇALHO DO DOCUMENTO ===
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SRP Mirador - Sistema de Revisão de Pautas',
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Cliente: ${clienteNome}`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );

      // Linha divisória
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '─────────────────────────────────────────────────────────────',
              color: '9CA3AF',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // === DATA E TÍTULO ===
      const dataFormatada = formData.data_prevista 
        ? new Date(formData.data_prevista).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');
      
      const tituloTexto = formData.titulo 
        ? `${dataFormatada} - ${formData.titulo}`
        : dataFormatada;

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: tituloTexto,
              bold: true,
              size: 28,
            }),
          ],
          spacing: { after: 300 },
        })
      );

      // === BLOCOS DE MATERIAL ===
      const versaoAtiva = formData.versoes.find(
        (v) => v.numero === formData.versao_ativa
      );

      console.log('🔍 Gerando documento de revisão (DOCX)...');
      console.log(`   Versão ativa: ${formData.versao_ativa}`);
      console.log(`   Blocos encontrados: ${versaoAtiva?.blocos.length || 0}`);

      if (versaoAtiva && versaoAtiva.blocos.length > 0) {
        for (let blocoIdx = 0; blocoIdx < versaoAtiva.blocos.length; blocoIdx++) {
          const bloco = versaoAtiva.blocos[blocoIdx];
          const config = MATERIAL_CONFIG[bloco.tipo];

          console.log(`\n📦 Bloco ${blocoIdx + 1}: ${config.label}`);

          for (let itemIdx = 0; itemIdx < bloco.itens.length; itemIdx++) {
            const item = bloco.itens[itemIdx];

            // ORDEM: 1. Imagem, 2. Chamada, 3. Legenda

            // 1. IMAGENS - Processar arquivos (File objects)
            if (item.arquivos && item.arquivos.length > 0) {
              for (const arquivo of item.arquivos) {
                const isImage = arquivo.type.startsWith('image/');

                if (isImage) {
                  try {
                    console.log(`📷 Processando imagem: ${arquivo.name}`);
                    const arrayBuffer = await fileToArrayBuffer(arquivo);
                    const dimensions = await getImageDimensions(arrayBuffer, arquivo.type);
                    const { width, height } = calculateDocxDimensions(dimensions.width, dimensions.height);

                    children.push(
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: arrayBuffer,
                            transformation: { width, height },
                            type: 'png',
                          }),
                        ],
                        spacing: { before: 100, after: 150 },
                      })
                    );
                  } catch (error) {
                    console.error('❌ Erro ao adicionar imagem:', error);
                  }
                }
              }
            }

            // 1. IMAGENS - Processar URLs (arquivos salvos no Supabase)
            if (item.arquivosUrls && item.arquivosUrls.length > 0) {
              for (const url of item.arquivosUrls) {
                const urlLower = url.toLowerCase();
                const isImage = urlLower.includes('.jpg') || urlLower.includes('.jpeg') ||
                               urlLower.includes('.png') || urlLower.includes('.gif') ||
                               urlLower.includes('.webp');

                if (isImage) {
                  try {
                    const fileName = url.split('/').pop() || 'imagem';
                    console.log(`🌐 Processando imagem da URL: ${decodeURIComponent(fileName)}`);
                    const arrayBuffer = await urlToArrayBuffer(url);
                    const mimeType = getMimeType(fileName);
                    const dimensions = await getImageDimensions(arrayBuffer, mimeType);
                    const { width, height } = calculateDocxDimensions(dimensions.width, dimensions.height);

                    children.push(
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: arrayBuffer,
                            transformation: { width, height },
                            type: 'png',
                          }),
                        ],
                        spacing: { before: 100, after: 150 },
                      })
                    );
                  } catch (error) {
                    console.error('❌ Erro ao adicionar imagem da URL:', error);
                  }
                }
              }
            }

            // 2. CHAMADA - texto original
            if (item.texto_conteudo) {
              children.push(
                new Paragraph({
                  text: item.texto_conteudo,
                  spacing: { before: 200, after: 150 },
                })
              );
            }

            // 3. LEGENDA - texto original
            if (item.legenda) {
              children.push(
                new Paragraph({
                  text: item.legenda,
                  spacing: { after: 200 },
                })
              );
            }
          }
        }
      }

      // Criar documento
      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      });

      // Gerar blob
      const blob = await Packer.toBlob(doc);
      const localUrl = URL.createObjectURL(blob);
      const downloadFilename = `${sanitizeFilename(formData.titulo || 'pauta')}_revisao_${new Date().toISOString().split('T')[0]}.docx`;

      console.log('✅ Documento DOCX gerado com sucesso');

      // Upload para Supabase (opcional)
      let supabaseUrl: string | undefined;
      try {
        const filePath = `review-docs/${formData.cliente_id || 'sem-cliente'}/${downloadFilename}`;
        const { data, error } = await supabase.storage
          .from('pauta-arquivos')
          .upload(filePath, blob, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('pauta-arquivos')
            .getPublicUrl(filePath);
          supabaseUrl = publicUrlData.publicUrl;
          console.log('✅ Documento salvo no Supabase:', supabaseUrl);
        }
      } catch (uploadError) {
        console.warn('⚠️ Não foi possível salvar no Supabase:', uploadError);
      }

      setIsGenerating(false);

      toast({
        title: 'Documento gerado!',
        description: 'O documento Word foi gerado com sucesso.',
      });

      return {
        success: true,
        url: supabaseUrl,
        localUrl,
        downloadFilename,
      };
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      setIsGenerating(false);

      toast({
        title: 'Erro ao gerar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  return {
    generateReviewDoc,
    isGenerating,
  };
};
