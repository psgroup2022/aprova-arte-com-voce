import { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
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

    // Limitar altura máxima
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
      const children: (Paragraph | Table)[] = [];

      // === HEADER SIMPLES: Data e Título ===
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: new Date().toLocaleDateString('pt-BR'),
              size: 22,
              color: '6B7280',
            }),
          ],
          spacing: { after: 200 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formData.titulo || 'Sem título',
              bold: true,
              size: 36,
            }),
          ],
          spacing: { after: 400 },
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

          // Itens do bloco - sem header de tipo
          for (let itemIdx = 0; itemIdx < bloco.itens.length; itemIdx++) {
            const item = bloco.itens[itemIdx];

            // Chamada - texto original sem label
            if (item.texto_conteudo) {
              children.push(
                new Paragraph({
                  text: item.texto_conteudo,
                  spacing: { before: 200, after: 150 },
                })
              );
            }

            // Legenda - texto original sem label
            if (item.legenda) {
              children.push(
                new Paragraph({
                  text: item.legenda,
                  spacing: { after: 150 },
                })
              );
            }

            // Hashtags - texto original sem label
            if (item.hashtags) {
              children.push(
                new Paragraph({
                  text: item.hashtags,
                  spacing: { after: 100 },
                  run: { color: '6B7280' },
                })
              );
            }

            // Processar arquivos (File objects)
            if (item.arquivos && item.arquivos.length > 0) {
              for (const arquivo of item.arquivos) {
                const isVideo = arquivo.type.startsWith('video/');
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
                        spacing: { before: 100, after: 50 },
                      })
                    );

                    children.push(
                      new Paragraph({
                        children: [
                          new TextRun({ text: `📷 ${arquivo.name}`, size: 18, color: '6B7280' }),
                        ],
                        spacing: { after: 150 },
                      })
                    );
                  } catch (error) {
                    console.error('❌ Erro ao adicionar imagem:', error);
                    children.push(
                      new Paragraph({
                        children: [
                          new TextRun({ text: `[Imagem: ${arquivo.name}] - Erro ao processar`, color: '9CA3AF' }),
                        ],
                        spacing: { after: 100 },
                      })
                    );
                  }
                } else if (isVideo) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `🎬 Vídeo: ${arquivo.name}`,
                          bold: true,
                          color: '92400E',
                          shading: { fill: 'FEF3C7' },
                        }),
                      ],
                      shading: { fill: 'FEF3C7' },
                      spacing: { before: 100, after: 150 },
                    })
                  );
                }
              }
            }

            // Processar URLs (arquivos salvos no Supabase)
            if (item.arquivosUrls && item.arquivosUrls.length > 0) {
              for (const url of item.arquivosUrls) {
                const urlLower = url.toLowerCase();
                const isVideo = urlLower.includes('.mp4') || urlLower.includes('.mov') ||
                               urlLower.includes('.avi') || urlLower.includes('.webm');
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
                        spacing: { before: 100, after: 50 },
                      })
                    );

                    children.push(
                      new Paragraph({
                        children: [
                          new TextRun({ text: `📷 ${decodeURIComponent(fileName)}`, size: 18, color: '6B7280' }),
                        ],
                        spacing: { after: 150 },
                      })
                    );
                  } catch (error) {
                    console.error('❌ Erro ao adicionar imagem da URL:', error);
                    const fileName = url.split('/').pop() || 'imagem';
                    children.push(
                      new Paragraph({
                        children: [
                          new TextRun({ text: `[Imagem: ${decodeURIComponent(fileName)}] - Erro ao processar`, color: '9CA3AF' }),
                        ],
                        spacing: { after: 100 },
                      })
                    );
                  }
                } else if (isVideo) {
                  const fileName = url.split('/').pop() || 'vídeo';
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `🎬 Vídeo: ${decodeURIComponent(fileName)}`, bold: true }),
                      ],
                      shading: { fill: 'FEF3C7' },
                      spacing: { before: 100, after: 50 },
                    })
                  );
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'Link: ', bold: true }),
                        new TextRun({ text: url, color: '3B82F6' }),
                      ],
                      spacing: { after: 150 },
                    })
                  );
                }
              }
            }
          }
        }
      }

      // === LEGENDA FINAL - texto original sem label ===
      if (formData.legenda_final) {
        children.push(
          new Paragraph({
            text: formData.legenda_final,
            spacing: { before: 300, after: 100 },
          })
        );
      }

      // === HASHTAGS PRINCIPAIS - texto original sem label ===
      if (formData.hashtags_principais && formData.hashtags_principais.length > 0) {
        children.push(
          new Paragraph({
            text: formData.hashtags_principais.join(' '),
            spacing: { before: 200, after: 100 },
          })
        );
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
