import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { PautaFormData, MATERIAL_CONFIG } from '@/types/pauta-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateDocResult {
  success: boolean;
  url?: string;
  localUrl?: string;  // URL local (blob URL) quando não faz upload
  downloadFilename?: string;
  error?: string;
}

// Função para sanitizar nome de arquivo
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // Remove caracteres especiais
    .replace(/_{2,}/g, '_')  // Remove underscores duplicados
    .replace(/^_|_$/g, '');  // Remove underscores no início/fim
};

export const useGenerateReviewDoc = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read blob'));
      });
    } catch (error) {
      throw new Error(`Erro ao carregar imagem da URL: ${url}`);
    }
  };

  const getImageFormat = (base64OrUrl: string): 'PNG' | 'JPEG' | 'WEBP' => {
    if (base64OrUrl.includes('data:image/png') || base64OrUrl.toLowerCase().endsWith('.png')) {
      return 'PNG';
    }
    if (base64OrUrl.includes('data:image/webp') || base64OrUrl.toLowerCase().endsWith('.webp')) {
      return 'WEBP';
    }
    return 'JPEG'; // Default
  };

  const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  // Proporções comuns de redes sociais
  const SOCIAL_MEDIA_RATIOS = {
    '4:5': 4 / 5,      // Instagram Feed Portrait (1080x1350)
    '1:1': 1,          // Instagram Square (1080x1080)
    '16:9': 16 / 9,    // YouTube, Landscape (1920x1080)
    '9:16': 9 / 16,    // Instagram Stories, TikTok, Reels (1080x1920)
  };

  const detectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    const tolerance = 0.02; // 2% de tolerância

    for (const [name, value] of Object.entries(SOCIAL_MEDIA_RATIOS)) {
      if (Math.abs(ratio - value) < tolerance) {
        return name;
      }
    }
    return 'custom';
  };

  const calculateProportionalDimensions = (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number = 120  // Aumentado para acomodar melhor 9:16
  ): { width: number; height: number; ratio: string } => {
    const aspectRatio = originalWidth / originalHeight;
    const detectedRatio = detectRatio(originalWidth, originalHeight);

    let width: number;
    let height: number;

    // Otimizações por proporção
    if (detectedRatio === '9:16') {
      // Stories/Reels (vertical) - priorizar altura
      height = Math.min(maxHeight, 110);
      width = height * aspectRatio;
      // Se largura exceder, recalcular
      if (width > maxWidth * 0.6) {  // Não usar mais que 60% da largura para verticais
        width = maxWidth * 0.6;
        height = width / aspectRatio;
      }
    } else if (detectedRatio === '4:5') {
      // Instagram Portrait - equilíbrio entre largura e altura
      height = Math.min(maxHeight * 0.9, 95);
      width = height * aspectRatio;
      if (width > maxWidth * 0.7) {
        width = maxWidth * 0.7;
        height = width / aspectRatio;
      }
    } else if (detectedRatio === '16:9') {
      // YouTube/Landscape - priorizar largura
      width = maxWidth;
      height = width / aspectRatio;
      if (height > maxHeight * 0.6) {  // Limitar altura para não ocupar muito espaço
        height = maxHeight * 0.6;
        width = height * aspectRatio;
      }
    } else if (detectedRatio === '1:1') {
      // Square - usar menor dimensão
      const size = Math.min(maxWidth * 0.8, maxHeight * 0.8, 85);
      width = size;
      height = size;
    } else {
      // Custom ratio - comportamento padrão
      width = maxWidth;
      height = width / aspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    return { width, height, ratio: detectedRatio };
  };

  const generateReviewDoc = async (
    formData: PautaFormData,
    clienteNome: string
  ): Promise<GenerateDocResult> => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Cores
      const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
      const textColor: [number, number, number] = [31, 41, 55]; // gray-800
      const mutedColor: [number, number, number] = [107, 114, 128]; // gray-500

      // Helper para nova página
      const checkNewPage = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // === HEADER ===
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Sistema Aprova Pautas Mirador', margin, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, 28);

      yPos = 50;

      // === INFORMAÇÕES BÁSICAS ===
      doc.setTextColor(...textColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Informações da Pauta', margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.text('Título:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formData.titulo || 'Sem título', margin + 25, yPos);
      yPos += 7;

      // Cliente
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(clienteNome || 'Não definido', margin + 25, yPos);
      yPos += 7;

      // Data prevista
      if (formData.data_prevista) {
        doc.setFont('helvetica', 'bold');
        doc.text('Data Prevista:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(
          new Date(formData.data_prevista).toLocaleDateString('pt-BR'),
          margin + 40,
          yPos
        );
        yPos += 7;
      }

      // Tags
      if (formData.tags.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Tags:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.tags.join(', '), margin + 25, yPos);
        yPos += 7;
      }

      yPos += 10;

      // === BLOCOS DE MATERIAL ===
      const versaoAtiva = formData.versoes.find(
        (v) => v.numero === formData.versao_ativa
      );

      console.log('🔍 Gerando documento de revisão...');
      console.log(`   Versão ativa: ${formData.versao_ativa}`);
      console.log(`   Blocos encontrados: ${versaoAtiva?.blocos.length || 0}`);

      if (versaoAtiva && versaoAtiva.blocos.length > 0) {
        for (let blocoIdx = 0; blocoIdx < versaoAtiva.blocos.length; blocoIdx++) {
          const bloco = versaoAtiva.blocos[blocoIdx];
          const config = MATERIAL_CONFIG[bloco.tipo];

          console.log(`\n📦 Bloco ${blocoIdx + 1}: ${config.label}`);
          console.log(`   Itens: ${bloco.itens.length}`);
          bloco.itens.forEach((item, idx) => {
            const totalArquivos = (item.arquivos?.length || 0) + (item.arquivosUrls?.length || 0);
            console.log(`   - Item ${idx + 1}: ${totalArquivos} arquivo(s) (${item.arquivos?.length || 0} locais + ${item.arquivosUrls?.length || 0} URLs)`);
          });

          checkNewPage(30);

          // Header do bloco
          doc.setFillColor(243, 244, 246); // gray-100
          doc.rect(margin, yPos - 5, pageWidth - margin * 2, 12, 'F');

          doc.setTextColor(...primaryColor);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${config.label}`, margin + 5, yPos + 3);
          yPos += 15;

          // Itens do bloco
          for (let itemIdx = 0; itemIdx < bloco.itens.length; itemIdx++) {
            const item = bloco.itens[itemIdx];

            checkNewPage(50);

            doc.setTextColor(...textColor);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${config.itemLabel} ${itemIdx + 1}`, margin, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Texto/Chamada
            if (item.texto_conteudo) {
              doc.setFont('helvetica', 'bold');
              doc.text('Chamada:', margin, yPos);
              doc.setFont('helvetica', 'normal');
              yPos += 5;

              const lines = doc.splitTextToSize(
                item.texto_conteudo,
                pageWidth - margin * 2
              );
              for (const line of lines) {
                checkNewPage(6);
                doc.text(line, margin, yPos);
                yPos += 5;
              }
              yPos += 3;
            }

            // Legenda
            if (item.legenda) {
              checkNewPage(15);
              doc.setFont('helvetica', 'bold');
              doc.text('Legenda:', margin, yPos);
              doc.setFont('helvetica', 'normal');
              yPos += 5;

              const legendaLines = doc.splitTextToSize(
                item.legenda,
                pageWidth - margin * 2
              );
              for (const line of legendaLines) {
                checkNewPage(6);
                doc.text(line, margin, yPos);
                yPos += 5;
              }
              yPos += 3;
            }

            // Hashtags
            if (item.hashtags) {
              checkNewPage(10);
              doc.setTextColor(...mutedColor);
              doc.text(`Hashtags: ${item.hashtags}`, margin, yPos);
              doc.setTextColor(...textColor);
              yPos += 7;
            }

            // Arquivos/Mídias - Processar File objects (arquivos novos não salvos)
            if (item.arquivos && item.arquivos.length > 0) {
              for (const arquivo of item.arquivos) {
                const isVideo = arquivo.type.startsWith('video/');
                const isImage = arquivo.type.startsWith('image/');

                if (isImage) {
                  try {
                    console.log(`📷 Processando imagem: ${arquivo.name} (${arquivo.type}, ${(arquivo.size / 1024).toFixed(2)}KB)`);
                    const base64 = await fileToBase64(arquivo);
                    console.log(`✅ Base64 gerado (${base64.substring(0, 50)}...)`);

                    // Obter dimensões reais da imagem
                    const imgDimensions = await getImageDimensions(base64);
                    console.log(`📐 Dimensões originais: ${imgDimensions.width}x${imgDimensions.height}`);

                    const imgFormat = getImageFormat(base64);
                    console.log(`🎨 Formato detectado: ${imgFormat}`);

                    // Calcular dimensões proporcionais (max width = largura da página - margens, max height = 100mm)
                    const maxWidth = pageWidth - margin * 2;
                    const { width: imgWidth, height: imgHeight } = calculateProportionalDimensions(
                      imgDimensions.width,
                      imgDimensions.height,
                      maxWidth,
                      100  // altura máxima em mm
                    );
                    console.log(`📏 Dimensões no PDF: ${imgWidth.toFixed(2)}x${imgHeight.toFixed(2)}mm`);

                    checkNewPage(imgHeight + 15);
                    doc.addImage(base64, imgFormat, margin, yPos, imgWidth, imgHeight);
                    console.log(`✅ Imagem adicionada ao PDF na posição Y: ${yPos}`);
                    yPos += imgHeight + 5;

                    doc.setTextColor(...mutedColor);
                    doc.setFontSize(8);
                    doc.text(`📷 ${arquivo.name}`, margin, yPos);
                    doc.setFontSize(10);
                    doc.setTextColor(...textColor);
                    yPos += 8;
                  } catch (error) {
                    console.error('❌ Erro ao adicionar imagem:', error);
                    console.error('   Arquivo:', arquivo.name, arquivo.type);
                    doc.setTextColor(...mutedColor);
                    doc.text(`[Imagem: ${arquivo.name}] - Erro ao processar`, margin, yPos);
                    doc.setTextColor(...textColor);
                    yPos += 7;
                  }
                } else if (isVideo) {
                  checkNewPage(15);
                  doc.setFillColor(254, 243, 199); // yellow-100
                  doc.rect(margin, yPos - 3, pageWidth - margin * 2, 12, 'F');

                  doc.setTextColor(146, 64, 14); // yellow-800
                  doc.text(`🎬 Vídeo: ${arquivo.name}`, margin + 3, yPos + 4);
                  doc.setTextColor(...textColor);
                  yPos += 15;
                }
              }
            }

            // Arquivos/Mídias - Processar URLs (arquivos já salvos no Supabase)
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
                    console.log(`   URL: ${url.substring(0, 80)}...`);
                    const base64 = await urlToBase64(url);
                    console.log(`✅ Base64 gerado da URL (${base64.substring(0, 50)}...)`);

                    // Obter dimensões reais da imagem
                    const imgDimensions = await getImageDimensions(base64);
                    console.log(`📐 Dimensões originais: ${imgDimensions.width}x${imgDimensions.height}`);

                    const imgFormat = getImageFormat(url);
                    console.log(`🎨 Formato detectado: ${imgFormat}`);

                    // Calcular dimensões proporcionais
                    const maxWidth = pageWidth - margin * 2;
                    const { width: imgWidth, height: imgHeight } = calculateProportionalDimensions(
                      imgDimensions.width,
                      imgDimensions.height,
                      maxWidth,
                      100  // altura máxima em mm
                    );
                    console.log(`📏 Dimensões no PDF: ${imgWidth.toFixed(2)}x${imgHeight.toFixed(2)}mm`);

                    checkNewPage(imgHeight + 15);
                    doc.addImage(base64, imgFormat, margin, yPos, imgWidth, imgHeight);
                    console.log(`✅ Imagem da URL adicionada ao PDF na posição Y: ${yPos}`);
                    yPos += imgHeight + 5;

                    doc.setTextColor(...mutedColor);
                    doc.setFontSize(8);
                    doc.text(`📷 ${decodeURIComponent(fileName)}`, margin, yPos);
                    doc.setFontSize(10);
                    doc.setTextColor(...textColor);
                    yPos += 8;
                  } catch (error) {
                    console.error('❌ Erro ao adicionar imagem da URL:', error);
                    console.error('   URL:', url);
                    const fileName = url.split('/').pop() || 'imagem';
                    doc.setTextColor(...mutedColor);
                    doc.text(`[Imagem: ${decodeURIComponent(fileName)}] - Erro ao processar URL`, margin, yPos);
                    doc.setTextColor(...textColor);
                    yPos += 7;
                  }
                } else if (isVideo) {
                  checkNewPage(15);
                  const fileName = url.split('/').pop() || 'vídeo';
                  doc.setFillColor(254, 243, 199); // yellow-100
                  doc.rect(margin, yPos - 3, pageWidth - margin * 2, 12, 'F');

                  doc.setTextColor(146, 64, 14); // yellow-800
                  doc.text(`🎬 Vídeo: ${decodeURIComponent(fileName)}`, margin + 3, yPos + 4);
                  doc.setTextColor(...textColor);
                  yPos += 15;
                }
              }
            }

            yPos += 5;
          }

          yPos += 10;
        }
      }

      // === LEGENDA FINAL ===
      if (formData.legenda_final) {
        checkNewPage(40);

        doc.setFillColor(219, 234, 254); // blue-100
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Legenda Final', margin + 5, yPos + 2);
        yPos += 12;

        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const legendaLines = doc.splitTextToSize(
          formData.legenda_final,
          pageWidth - margin * 2
        );
        for (const line of legendaLines) {
          checkNewPage(6);
          doc.text(line, margin, yPos);
          yPos += 5;
        }
        yPos += 5;
      }

      // === HASHTAGS PRINCIPAIS ===
      if (formData.hashtags_principais.length > 0) {
        checkNewPage(20);

        doc.setTextColor(...mutedColor);
        doc.setFontSize(10);
        doc.text(
          `Hashtags principais: ${formData.hashtags_principais.join(' ')}`,
          margin,
          yPos
        );
        yPos += 10;
      }

      // === FOOTER ===
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...mutedColor);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text('Documento gerado pelo AprovaArte', margin, pageHeight - 10);
      }

      // Gerar blob do PDF
      const pdfBlob = doc.output('blob');
      const sanitizedTitle = sanitizeFilename(formData.titulo || 'pauta');
      const downloadFilename = `revisao_${sanitizedTitle}_${Date.now()}.pdf`;

      // Criar URL local para download imediato
      const localUrl = URL.createObjectURL(pdfBlob);
      console.log('✅ PDF gerado localmente. Blob URL:', localUrl);

      // Tentar fazer upload para Supabase (opcional - não bloqueia se falhar)
      let uploadedUrl: string | undefined;
      try {
        const fileName = `revisoes/${downloadFilename}`;
        console.log('📤 Tentando upload para Supabase:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pauta-arquivos')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.warn('⚠️ Erro ao fazer upload (não crítico):', uploadError.message);
        } else {
          const { data: urlData } = supabase.storage
            .from('pauta-arquivos')
            .getPublicUrl(uploadData.path);
          uploadedUrl = urlData.publicUrl;
          console.log('✅ Upload concluído:', uploadedUrl);
        }
      } catch (uploadErr) {
        console.warn('⚠️ Falha no upload (usando apenas download local):', uploadErr);
      }

      toast({
        title: 'Documento gerado com sucesso!',
        description: uploadedUrl
          ? 'O PDF foi criado e salvo no servidor.'
          : 'O PDF foi criado. Clique para baixar.',
      });

      return {
        success: true,
        url: uploadedUrl,
        localUrl,
        downloadFilename,
      };
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      toast({
        title: 'Erro ao gerar documento',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReviewDoc,
    isGenerating,
  };
};
