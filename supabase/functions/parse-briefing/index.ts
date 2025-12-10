import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente especializado em analisar documentos de briefing para criação de pautas de redes sociais.

Analise o conteúdo do documento e extraia as informações no formato JSON estruturado abaixo.

REGRAS CRÍTICAS:
1. Extraia EXATAMENTE o que está no documento, NÃO invente conteúdo
2. Para "tipo", use apenas: "estatico", "carrossel", "story", "reels", "linkedin_artigo", "email", "whatsapp"
3. Se for Post Estático, use "estatico"

CARROSSEL:
- Cada slide deve ser um item separado no array "itens"
- Associe cada chamada/texto ao slide correspondente (chamada 1 = slide 1, chamada 2 = slide 2, etc.)

REELS:
- OBRIGATÓRIO: Agrupe TODAS as chamadas/cenas em UM ÚNICO bloco do tipo "reels"
- Cada chamada/cena vira um item no array "itens" (cena 1, cena 2, etc.)
- Reels é UM vídeo com múltiplas cenas/chamadas, não múltiplos blocos

OUTRAS REGRAS:
4. Hashtags devem ser extraídas SEM o símbolo #
5. Se a data estiver vazia ou não especificada, retorne null
6. NUNCA invente informações que não existem no documento

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

    const userPrompt = `Analise este documento de briefing e extraia as informações:

${documentContent}

Retorne um JSON com esta estrutura exata:
{
  "titulo": "Título da pauta",
  "cliente": "Nome do cliente",
  "dataPrevista": "2024-09-15" ou null,
  "tags": ["tag1", "tag2"],
  "materiais": [
    {
      "tipo": "estatico" | "carrossel" | "story" | "reels",
      "itens": [
        {
          "texto": "Texto/legenda do conteúdo",
          "hashtags": ["hashtag1", "hashtag2"]
        }
      ],
      "legenda": "Legenda geral do material (se houver)"
    }
  ]
}`;

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

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro no parse-briefing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
