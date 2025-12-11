import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { PautaFormData, MATERIAL_CONFIG } from '@/types/pauta-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateDocResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const useGenerateReviewDoc = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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
      doc.text('Documento de Revisão', margin, 20);

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

      if (versaoAtiva && versaoAtiva.blocos.length > 0) {
        for (let blocoIdx = 0; blocoIdx < versaoAtiva.blocos.length; blocoIdx++) {
          const bloco = versaoAtiva.blocos[blocoIdx];
          const config = MATERIAL_CONFIG[bloco.tipo];

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

            // Arquivos/Mídias
            if (item.arquivos && item.arquivos.length > 0) {
              for (const arquivo of item.arquivos) {
                const isVideo = arquivo.type.startsWith('video/');
                const isImage = arquivo.type.startsWith('image/');

                if (isImage) {
                  try {
                    checkNewPage(80);
                    const base64 = await fileToBase64(arquivo);
                    const imgWidth = pageWidth - margin * 2;
                    const imgHeight = 60;

                    doc.addImage(base64, 'JPEG', margin, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 5;

                    doc.setTextColor(...mutedColor);
                    doc.setFontSize(8);
                    doc.text(`📷 ${arquivo.name}`, margin, yPos);
                    doc.setFontSize(10);
                    doc.setTextColor(...textColor);
                    yPos += 8;
                  } catch (error) {
                    console.error('Erro ao adicionar imagem:', error);
                    doc.setTextColor(...mutedColor);
                    doc.text(`[Imagem: ${arquivo.name}]`, margin, yPos);
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

      // Gerar blob e fazer upload
      const pdfBlob = doc.output('blob');
      const fileName = `revisao_${formData.titulo?.replace(/\s+/g, '_') || 'pauta'}_${Date.now()}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pauta-arquivos')
        .upload(`revisoes/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('pauta-arquivos')
        .getPublicUrl(uploadData.path);

      toast({
        title: 'Documento gerado com sucesso!',
        description: 'O PDF de revisão foi criado e salvo.',
      });

      return {
        success: true,
        url: urlData.publicUrl,
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
