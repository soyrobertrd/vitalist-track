// Edge function: procesa reportes programados pendientes y los envía por email
// usando la función generar-reporte.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const ahora = new Date().toISOString();

    const { data: pendientes, error } = await supabase
      .from("reportes_programados")
      .select("*")
      .eq("activo", true)
      .or(`proximo_envio.is.null,proximo_envio.lte.${ahora}`)
      .limit(20);

    if (error) throw error;

    const procesados: any[] = [];

    for (const r of pendientes ?? []) {
      // Llamar a generar-reporte
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/generar-reporte`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            workspace_id: r.workspace_id,
            tipo_reporte: r.tipo_reporte,
            filtros: r.filtros ?? {},
            destinatarios: r.destinatarios ?? [],
            enviar_email: true,
            reporte_id: r.id,
          }),
        });
        const data = await resp.json().catch(() => ({}));
        procesados.push({ id: r.id, nombre: r.nombre, ok: resp.ok, filas: data?.filas });
      } catch (e) {
        await supabase.from("reportes_envios_log").insert({
          reporte_id: r.id,
          estado: "error",
          destinatarios: r.destinatarios,
          metadata: { error: String(e) },
        });
      }

      // Calcular próximo envío
      const next = new Date();
      switch (r.frecuencia) {
        case "diario": next.setDate(next.getDate() + 1); break;
        case "semanal": next.setDate(next.getDate() + 7); break;
        case "mensual": next.setMonth(next.getMonth() + 1); break;
        case "trimestral": next.setMonth(next.getMonth() + 3); break;
      }

      await supabase
        .from("reportes_programados")
        .update({ ultimo_envio: ahora, proximo_envio: next.toISOString() })
        .eq("id", r.id);
    }

    return new Response(JSON.stringify({ ok: true, procesados }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
