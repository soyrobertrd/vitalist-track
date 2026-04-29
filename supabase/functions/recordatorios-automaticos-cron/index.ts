import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const horas = parseInt(url.searchParams.get("horas") || "24", 10);

    const { data: pendientes, error } = await supabase.rpc("listar_recordatorios_pendientes", {
      _horas: horas,
    });
    if (error) throw error;

    const items = (pendientes ?? []) as any[];
    let enviados = 0;
    let fallidos = 0;

    for (const item of items) {
      try {
        // Reusa la edge function existente de envío
        const { error: invErr } = await supabase.functions.invoke("send-recordatorio-cita", {
          body: {
            cita_id: item.cita_id,
            tipo: item.tipo,
            paciente_id: item.paciente_id,
            telefono: item.paciente_telefono,
            fecha: item.fecha,
            workspace_id: item.workspace_id,
            automatico: true,
          },
        });
        if (invErr) throw invErr;
        enviados++;
      } catch {
        fallidos++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ventana_horas: horas,
        total: items.length,
        enviados,
        fallidos,
        ts: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
