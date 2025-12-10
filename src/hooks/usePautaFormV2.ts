import { useState, useCallback } from 'react';
import { 
  PautaFormData, 
  BlocoMaterial, 
  BlocoItem,
  TipoMaterial,
  createInitialFormData,
  createEmptyBloco,
  createEmptyItem,
  createEmptyVersao
} from '@/types/pauta-form';
import { ParsedBriefingData } from '@/components/criar-pauta/BriefingUploadSection';

export const usePautaFormV2 = () => {
  const [formData, setFormData] = useState<PautaFormData>(createInitialFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obter versão ativa
  const getVersaoAtiva = useCallback(() => {
    return formData.versoes.find(v => v.numero === formData.versao_ativa) || formData.versoes[0];
  }, [formData.versoes, formData.versao_ativa]);

  // Atualizar campo básico do formulário
  const updateField = useCallback(<K extends keyof PautaFormData>(
    field: K, 
    value: PautaFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Adicionar bloco de material
  const addBloco = useCallback((tipo: TipoMaterial) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      const novoBloco = createEmptyBloco(tipo, versao.blocos.length);
      versao.blocos = [...versao.blocos, novoBloco];
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Remover bloco de material
  const removeBloco = useCallback((blocoIndex: number) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      versao.blocos = versao.blocos
        .filter((_, i) => i !== blocoIndex)
        .map((bloco, i) => ({ ...bloco, ordem: i }));
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Atualizar bloco de material
  const updateBloco = useCallback((
    blocoIndex: number, 
    updates: Partial<BlocoMaterial>
  ) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      versao.blocos = versao.blocos.map((bloco, i) => 
        i === blocoIndex ? { ...bloco, ...updates } : bloco
      );
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Adicionar item ao bloco
  const addItemToBloco = useCallback((blocoIndex: number) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      const bloco = { ...versao.blocos[blocoIndex] };
      const novoItem = createEmptyItem(bloco.itens.length);
      bloco.itens = [...bloco.itens, novoItem];
      versao.blocos = versao.blocos.map((b, i) => i === blocoIndex ? bloco : b);
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Remover item do bloco
  const removeItemFromBloco = useCallback((blocoIndex: number, itemIndex: number) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      const bloco = { ...versao.blocos[blocoIndex] };
      bloco.itens = bloco.itens
        .filter((_, i) => i !== itemIndex)
        .map((item, i) => ({ ...item, ordem: i }));
      versao.blocos = versao.blocos.map((b, i) => i === blocoIndex ? bloco : b);
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Atualizar item do bloco
  const updateBlocoItem = useCallback((
    blocoIndex: number, 
    itemIndex: number, 
    updates: Partial<BlocoItem>
  ) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      const bloco = { ...versao.blocos[blocoIndex] };
      bloco.itens = bloco.itens.map((item, i) => 
        i === itemIndex ? { ...item, ...updates } : item
      );
      versao.blocos = versao.blocos.map((b, i) => i === blocoIndex ? bloco : b);
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Criar nova versão (clonar atual)
  const createNewVersion = useCallback(() => {
    setFormData(prev => {
      const versaoAtual = prev.versoes.find(v => v.numero === prev.versao_ativa);
      if (!versaoAtual) return prev;
      
      const novoNumero = Math.max(...prev.versoes.map(v => v.numero)) + 1;
      
      // Desativar todas as versões anteriores
      const versoesAtualizadas = prev.versoes.map(v => ({ ...v, ativa: false }));
      
      // Clonar a versão atual
      const novaVersao: typeof versaoAtual = {
        ...versaoAtual,
        id: undefined,
        numero: novoNumero,
        ativa: true,
        blocos: versaoAtual.blocos.map(bloco => ({
          ...bloco,
          id: undefined,
          itens: bloco.itens.map(item => ({
            ...item,
            id: undefined
          }))
        }))
      };
      
      return {
        ...prev,
        versoes: [...versoesAtualizadas, novaVersao],
        versao_ativa: novoNumero
      };
    });
  }, []);

  // Mudar versão ativa
  const setVersaoAtiva = useCallback((numero: number) => {
    setFormData(prev => ({ ...prev, versao_ativa: numero }));
  }, []);

  // Atualizar tags
  const updateTags = useCallback((tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  }, []);

  // Atualizar hashtags principais
  const updateHashtagsPrincipais = useCallback((hashtags: string[]) => {
    setFormData(prev => ({ ...prev, hashtags_principais: hashtags }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(createInitialFormData());
  }, []);

  // Reordenar blocos
  const reorderBlocos = useCallback((fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const versoes = [...prev.versoes];
      const versaoIndex = versoes.findIndex(v => v.numero === prev.versao_ativa);
      
      if (versaoIndex === -1) return prev;
      
      const versao = { ...versoes[versaoIndex] };
      const blocos = [...versao.blocos];
      const [removed] = blocos.splice(fromIndex, 1);
      blocos.splice(toIndex, 0, removed);
      versao.blocos = blocos.map((bloco, i) => ({ ...bloco, ordem: i }));
      versoes[versaoIndex] = versao;
      
      return { ...prev, versoes };
    });
  }, []);

  // Preencher formulário a partir do briefing parseado
  const populateFromBriefing = useCallback((data: ParsedBriefingData) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      
      // Preencher campos básicos
      if (data.titulo) newFormData.titulo = data.titulo;
      if (data.tags) newFormData.tags = data.tags;
      if (data.dataPrevista) newFormData.data_prevista = data.dataPrevista;
      
      // Criar blocos de material a partir dos materiais parseados
      if (data.materiais && data.materiais.length > 0) {
        const versoes = [...newFormData.versoes];
        const versaoIndex = versoes.findIndex(v => v.numero === newFormData.versao_ativa);
        
        if (versaoIndex !== -1) {
          const versao = { ...versoes[versaoIndex] };
          
          const novosBlocos: BlocoMaterial[] = data.materiais.map((material, blocoIndex) => {
            const tipo = material.tipo as TipoMaterial;
            
            const itens: BlocoItem[] = material.itens.map((item, itemIndex) => ({
              titulo: '',
              assunto: '',
              texto_conteudo: item.texto || '',
              hashtags: item.hashtags?.join(' #') || '',
              arquivos: [],
              arquivosUrls: [],
              ordem: itemIndex
            }));
            
            // Se não há itens, criar pelo menos um vazio
            if (itens.length === 0) {
              itens.push(createEmptyItem(0));
            }
            
            return {
              tipo,
              status: 'aguardando_midia' as const,
              itens,
              ordem: blocoIndex
            };
          });
          
          versao.blocos = novosBlocos;
          versoes[versaoIndex] = versao;
          newFormData.versoes = versoes;
        }
      }
      
      return newFormData;
    });
  }, []);

  return {
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    getVersaoAtiva,
    updateField,
    addBloco,
    removeBloco,
    updateBloco,
    addItemToBloco,
    removeItemFromBloco,
    updateBlocoItem,
    createNewVersion,
    setVersaoAtiva,
    updateTags,
    updateHashtagsPrincipais,
    resetForm,
    reorderBlocos,
    populateFromBriefing
  };
};
