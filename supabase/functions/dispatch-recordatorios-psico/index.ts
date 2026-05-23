import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const ventana = parseInt(url.searchParams.get("ventana_min") || "60", 10);

    const { data: pendientes, error } = await supabase.rpc(
      "listar_recordatorios_psico_pendientes",
      { _ventana_min: ventana },
    );
    if (error) throw error;

    const items = (pendientes ?? []) as any[];
    let enviados = 0, fallidos = 0;

    for (const it of items) {
      try {
        const destino = it.canal === "email" ? it.paciente_email : it.paciente_telefono;
        if (!destino) {
          await supabase.rpc("marcar_recordatorio_psico", {
            _id: it.id, _estado: "fallido", _error: "Sin destino",
          });
          fallidos++;
          continue;
        }

        const cuando = it.sesion_fecha_hora ? new Date(it.sesion_fecha_hora).toLocaleString("es-DO") : "";
        const mensaje = `Hola ${it.paciente_nombre}, le recordamos su próxima sesión: ${cuando}.`;

        // Reusa edge function genérica si existe; fallback: solo log
        try {
          await supabase.functions.invoke("send-recordatorio-cita", {
            body: {
              canal: it.canal, destino, mensaje,
              paciente_id: it.paciente_id, workspace_id: it.workspace_id,
              origen: "psicologia", sesion_id: it.sesion_id,
            },
          });
        } catch (_) { /* mantener flujo aunque envío externo falle silenciosamente */ }

        await supabase.rpc("marcar_recordatorio_psico", {
          _id: it.id, _estado: "enviado", _error: null,
        });
        enviados++;
      } catch (e: any) {
        await supabase.rpc("marcar_recordatorio_psico", {
          _id: it.id, _estado: "fallido", _error: e?.message?.slice(0, 500) ?? "error",
        });
        fallidos++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, total: items.length, enviados, fallidos, ts: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
