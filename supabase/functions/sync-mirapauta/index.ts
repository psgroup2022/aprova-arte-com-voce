import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Sync MiraPauta] Starting synchronization...");

    // Get MiraPauta credentials from secrets
    const mirapautaUrl = Deno.env.get("VITE_MIRAPAUTA_SUPABASE_URL");
    const mirapautaAnonKey = Deno.env.get("VITE_MIRAPAUTA_SUPABASE_ANON_KEY");

    if (!mirapautaUrl || !mirapautaAnonKey) {
      console.error("[Sync MiraPauta] Missing MiraPauta credentials");
      return new Response(
        JSON.stringify({ error: "MiraPauta não está configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get local Supabase credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create clients
    const mirapautaClient = createClient(mirapautaUrl, mirapautaAnonKey);
    const localClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pautas from MiraPauta (the main table)
    console.log("[Sync MiraPauta] Fetching pautas from MiraPauta...");
    const { data: pautas, error: pautasError } = await mirapautaClient
      .from("pautas")
      .select("*")
      .order("created_at", { ascending: false });

    if (pautasError) {
      console.error("[Sync MiraPauta] Error fetching pautas:", pautasError);
      throw new Error(`Erro ao buscar pautas: ${pautasError.message}`);
    }

    console.log(`[Sync MiraPauta] Found ${pautas?.length || 0} pautas`);

    // Fetch clients from MiraPauta
    const { data: clientes, error: clientesError } = await mirapautaClient
      .from("clientes")
      .select("*");

    if (clientesError) {
      console.error("[Sync MiraPauta] Error fetching clients:", clientesError);
    }

    // Create client map
    const clientesMap = new Map<string, any>();
    if (clientes) {
      clientes.forEach((cliente: any) => {
        clientesMap.set(cliente.id, cliente);
      });
    }

    // Fetch profiles from MiraPauta
    const { data: profiles, error: profilesError } = await mirapautaClient
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("[Sync MiraPauta] Error fetching profiles:", profilesError);
    }

    const profilesMap = new Map<string, any>();
    if (profiles) {
      profiles.forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });
    }

    // Process sync results
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    if (!pautas || pautas.length === 0) {
      console.log("[Sync MiraPauta] No pautas to sync");
      return new Response(
        JSON.stringify({ message: "Nenhuma pauta para sincronizar", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const pauta of pautas) {
      try {
        // Check if pauta already exists locally (using mirapauta_task_id for backward compatibility)
        const { data: existingPauta, error: checkError } = await localClient
          .from("pautas")
          .select("id, mirapauta_sincronizado_em")
          .eq("mirapauta_task_id", pauta.id)
          .maybeSingle();

        if (checkError) {
          console.error(`[Sync MiraPauta] Error checking pauta ${pauta.id}:`, checkError);
          results.errors.push(`Erro ao verificar pauta ${pauta.id}: ${checkError.message}`);
          continue;
        }

        // Get client name
        const cliente = pauta.cliente_id ? clientesMap.get(pauta.cliente_id) : null;
        const clienteNome = cliente?.nome || "Cliente não definido";

        // Get last updated by user
        const lastUpdatedBy = pauta.last_updated_by ? profilesMap.get(pauta.last_updated_by) : null;

        // Map status based on pauta workflow stages
        let status: "rascunho" | "aguardando_aprovacao" | "aprovada" | "rejeitada" = "rascunho";
        
        if (pauta.pauta_aprovada_status === "concluido" || pauta.pauta_aprovada_status === "aprovado") {
          status = "aprovada";
        } else if (pauta.revisao_cliente_status === "rejeitado") {
          status = "rejeitada";
        } else if (pauta.enviado_cliente_status === "concluido" || pauta.revisao_cliente_status) {
          status = "aguardando_aprovacao";
        } else if (pauta.layout_status === "em_andamento" || pauta.revisao_interna_status) {
          status = "rascunho";
        }

        // Build title based on client and date
        const titulo = cliente?.nome 
          ? `Pauta ${cliente.nome} - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`
          : `Pauta ${pauta.id.slice(0, 8)} - ${new Date(pauta.created_at).toLocaleDateString('pt-BR')}`;

        // Build observation with MiraPauta info
        const observacoes = [
          lastUpdatedBy?.nome ? `Última atualização por: ${lastUpdatedBy.nome}` : null,
          pauta.pauta_status ? `Status geral: ${pauta.pauta_status}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        const pautaData = {
          titulo,
          cliente: clienteNome,
          status,
          observacoes: observacoes || null,
          mirapauta_task_id: pauta.id,
          mirapauta_cliente_id: pauta.cliente_id,
          mirapauta_sincronizado_em: new Date().toISOString(),
        };

        if (existingPauta) {
          // Check if pauta was updated after last sync
          const lastSync = existingPauta.mirapauta_sincronizado_em
            ? new Date(existingPauta.mirapauta_sincronizado_em)
            : new Date(0);
          const pautaUpdated = new Date(pauta.updated_at);

          if (pautaUpdated > lastSync) {
            // Update existing pauta
            const { error: updateError } = await localClient
              .from("pautas")
              .update(pautaData)
              .eq("id", existingPauta.id);

            if (updateError) {
              console.error(`[Sync MiraPauta] Error updating pauta ${existingPauta.id}:`, updateError);
              results.errors.push(`Erro ao atualizar ${titulo}: ${updateError.message}`);
            } else {
              results.updated++;
              console.log(`[Sync MiraPauta] Updated pauta: ${titulo}`);
            }
          } else {
            results.skipped++;
          }
        } else {
          // Ensure client exists locally
          if (cliente) {
            const { data: existingCliente } = await localClient
              .from("clientes")
              .select("id")
              .eq("nome", cliente.nome)
              .maybeSingle();

            if (!existingCliente) {
              await localClient.from("clientes").insert({
                nome: cliente.nome,
                ativo: true,
              });
              console.log(`[Sync MiraPauta] Created client: ${cliente.nome}`);
            }
          }

          // Create new pauta
          const { error: insertError } = await localClient
            .from("pautas")
            .insert(pautaData);

          if (insertError) {
            console.error(`[Sync MiraPauta] Error creating pauta:`, insertError);
            results.errors.push(`Erro ao criar ${titulo}: ${insertError.message}`);
          } else {
            results.created++;
            console.log(`[Sync MiraPauta] Created pauta: ${titulo}`);
          }
        }
      } catch (pautaError) {
        console.error(`[Sync MiraPauta] Error processing pauta ${pauta.id}:`, pautaError);
        results.errors.push(`Erro ao processar pauta ${pauta.id}: ${String(pautaError)}`);
      }
    }

    console.log("[Sync MiraPauta] Sync completed:", results);

    return new Response(
      JSON.stringify({
        message: `Sincronização concluída: ${results.created} criadas, ${results.updated} atualizadas, ${results.skipped} sem alterações`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Sync MiraPauta] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
