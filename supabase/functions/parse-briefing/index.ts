import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente especializado em analisar documentos de briefing para criação de pautas de redes sociais.

O documento de briefing contém MÚLTIPLOS POSTS independentes organizados por data de publicação.
Cada post pode ser de diferentes tipos e tem sua própria estrutura.

ESTRUTURA TÍPICA DO DOCUMENTO:
[TÍTULO GERAL] - Ex: "VWPP REDES SOCIAIS – JANEIRO 2026"
[SUBTÍTULO] - Ex: "BRIEFINGS"

[Data] – [Título do Post]
[Descrição/contexto do post]
Chamada: [texto curto de destaque]
Legenda: [texto explicativo mais longo]
#hashtag1 #hashtag2 #hashtag3

TIPOS DE MATERIAL (identificar automaticamente):

1. POST ESTÁTICO:
   - Tem apenas "Chamada:" e "Legenda:"
   - Tipo: "estatico"

2. CARROSSEL:
   - Tem múltiplos cards/slides identificados por:
     * "C1 –", "C2 –", "C3 –", "C4 –"
     * "Card 1:", "Card 2:", "Card 3:"
     * "Slide 1:", "Slide 2:", "Slide 3:"
   - Cada card pode ter título e conteúdo
   - Tem uma "Legenda:" única no final para todo o carrossel
   - Tipo: "carrossel"

3. ARTIGO (LinkedIn):
   - Tem "Chamada:" curta
   - Tem "Artigo:" com texto longo (múltiplos parágrafos)
   - Tipo: "linkedin_artigo"

4. REELS:
   - Tem "Cena 1:", "Cena 2:", "Cena 3:"
   - Cada cena tem descrição
   - Tipo: "reels"

5. STORIES:
   - Tem "Tela 1:", "Tela 2:", "Tela 3:"
   - Tipo: "story"

REGRAS CRÍTICAS:

1. MÚLTIPLOS POSTS:
   - Cada linha começando com data (DD/MM) é um POST SEPARADO
   - Processe TODOS os posts do documento
   - Retorne array "posts" com todos os posts encontrados

2. IDENTIFICAÇÃO DE TIPO:
   - Se tem "C1 –", "C2 –" ou "Card 1:", "Slide 1:" = CARROSSEL
   - Se tem "Artigo:" = LINKEDIN_ARTIGO
   - Se tem "Cena 1:", "Cena 2:" = REELS
   - Se tem "Tela 1:", "Tela 2:" = STORY
   - Caso contrário = ESTÁTICO

3. CARROSSEL - ESTRUTURA:
   - Cada C1, C2, C3, etc. é um SLIDE separado
   - O texto após "C1 –" é o título do slide
   - O texto entre este card e o próximo é o conteúdo do slide
   - A "Legenda:" final se aplica a TODO o carrossel
   - IMPORTANTE: Agrupe TODO o conteúdo de cada card corretamente

4. HASHTAGS:
   - Aparecem sempre no final do post (linhas com #)
   - Extraia SEM o símbolo #
   - Retorne como array: ["hashtag1", "hashtag2"]
   - As hashtags NÃO devem aparecer na legenda

5. CLIENTE E DATAS:
   - Cliente: busque no título (ex: "VWPP REDES SOCIAIS")
   - Data de publicação: está no formato DD/MM antes do título do post
   - Converta para ISO: "01/01" → "2026-01-01" (use o ano do título geral)

6. CHAMADA vs LEGENDA:
   - "Chamada:" = texto curto de destaque (título/headline)
   - "Legenda:" = texto explicativo mais longo (body/caption)
   - São campos SEPARADOS e OBRIGATÓRIOS (exceto artigos que usam "Artigo:")

Responda APENAS com JSON válido, sem markdown ou explicações.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent } = await req.json();
    
    if (!documentContent) {
      return new Response(
        JSON.stringify({ error: "Conteúdo do documento é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const userPrompt = `Analise este documento de briefing de redes sociais e extraia TODOS os posts.

DOCUMENTO:
${documentContent}

Retorne um JSON com esta estrutura EXATA:

{
  "titulo": "Título geral do documento (ex: VWPP REDES SOCIAIS – JANEIRO 2026)",
  "cliente": "Nome do cliente extraído do título",
  "ano": 2026,
  "posts": [
    {
      "data": "2026-01-01",
      "titulo_post": "Título do post (texto após a data)",
      "tipo": "estatico|carrossel|linkedin_artigo|reels|story",
      "chamada": "Texto após 'Chamada:' (se houver)",
      "legenda": "Texto após 'Legenda:' (se houver, SEM hashtags)",
      "artigo": "Texto completo do artigo (apenas para tipo linkedin_artigo)",
      "hashtags": ["tag1", "tag2", "tag3"],
      
      // Para CARROSSEL, adicione:
      "slides": [
        {
          "numero": 1,
          "titulo": "Título do card (texto após C1 – ou Card 1:)",
          "conteudo": "Todo o conteúdo deste card até o próximo"
        }
      ],
      
      // Para REELS, adicione:
      "cenas": [
        {
          "numero": 1,
          "descricao": "Descrição da cena"
        }
      ],
      
      // Para STORIES, adicione:
      "telas": [
        {
          "numero": 1,
          "conteudo": "Conteúdo da tela"
        }
      ]
    }
  ]
}

LEMBRETES IMPORTANTES:
1. Processe TODOS os posts (cada data DD/MM é um post)
2. Identifique corretamente o tipo (carrossel tem C1, C2, C3...)
3. Para carrosséis, agrupe TODO o conteúdo de cada card
4. Extraia hashtags separadamente (sem #)
5. Não inclua hashtags dentro da legenda
6. Mantenha "chamada" e "legenda" como campos separados
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erro AI gateway:", response.status, errorText);
      throw new Error("Erro ao processar com IA");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Parse do JSON retornado pela IA
    let parsedData;
    try {
      // Remove possíveis marcadores de código markdown
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", content);
      throw new Error("Resposta da IA não é um JSON válido");
    }

    // Validação básica da estrutura
    if (!parsedData.posts || !Array.isArray(parsedData.posts)) {
      throw new Error("Estrutura JSON inválida: campo 'posts' ausente ou não é array");
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro no parse-briefing:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
