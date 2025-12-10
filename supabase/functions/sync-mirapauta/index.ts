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

    // Fetch tasks from MiraPauta
    console.log("[Sync MiraPauta] Fetching tasks from MiraPauta...");
    const { data: tasks, error: tasksError } = await mirapautaClient
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("[Sync MiraPauta] Error fetching tasks:", tasksError);
      throw new Error(`Erro ao buscar tasks: ${tasksError.message}`);
    }

    console.log(`[Sync MiraPauta] Found ${tasks?.length || 0} tasks`);

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

    if (!tasks || tasks.length === 0) {
      console.log("[Sync MiraPauta] No tasks to sync");
      return new Response(
        JSON.stringify({ message: "Nenhuma task para sincronizar", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const task of tasks) {
      try {
        // Check if task already exists locally
        const { data: existingPauta, error: checkError } = await localClient
          .from("pautas")
          .select("id, mirapauta_sincronizado_em")
          .eq("mirapauta_task_id", task.id)
          .maybeSingle();

        if (checkError) {
          console.error(`[Sync MiraPauta] Error checking task ${task.id}:`, checkError);
          results.errors.push(`Erro ao verificar task ${task.ticket_number || task.id}: ${checkError.message}`);
          continue;
        }

        // Get client name
        const cliente = task.cliente_id ? clientesMap.get(task.cliente_id) : null;
        const clienteNome = cliente?.nome || "Cliente não definido";

        // Get assignee name
        const assignee = task.assignee ? profilesMap.get(task.assignee) : null;

        // Map status
        let status: "rascunho" | "aguardando_aprovacao" | "aprovada" | "rejeitada" = "rascunho";
        if (task.status === "concluido" || task.status === "done" || task.status === "aprovado") {
          status = "aprovada";
        } else if (task.status === "em_andamento" || task.status === "in_progress") {
          status = "aguardando_aprovacao";
        } else if (task.status === "rejeitado" || task.status === "cancelado") {
          status = "rejeitada";
        }

        // Build title
        const titulo = task.title || `Task ${task.ticket_number || task.id}`;

        // Build observation with MiraPauta info
        const observacoes = [
          task.description,
          assignee?.nome ? `Responsável: ${assignee.nome}` : null,
          task.ticket_number ? `Ticket: ${task.ticket_number}` : null,
          task.peso ? `Peso: ${task.peso}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        const pautaData = {
          titulo,
          cliente: clienteNome,
          status,
          descricao: task.description,
          observacoes: observacoes || null,
          data_prazo: task.prazo_entrega,
          mirapauta_task_id: task.id,
          mirapauta_cliente_id: task.cliente_id,
          mirapauta_sincronizado_em: new Date().toISOString(),
        };

        if (existingPauta) {
          // Check if task was updated after last sync
          const lastSync = existingPauta.mirapauta_sincronizado_em
            ? new Date(existingPauta.mirapauta_sincronizado_em)
            : new Date(0);
          const taskUpdated = new Date(task.updated_at);

          if (taskUpdated > lastSync) {
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
      } catch (taskError) {
        console.error(`[Sync MiraPauta] Error processing task ${task.id}:`, taskError);
        results.errors.push(`Erro ao processar task ${task.ticket_number || task.id}: ${String(taskError)}`);
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
