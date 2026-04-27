// Edge function esqueleto: procesa reportes programados pendientes y los envía por email.
// Se invocará desde un cron job (a configurar). Por ahora MVP: marca enviados sin generar PDF aún.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
      // TODO Fase A.2: generar PDF/CSV real según tipo_reporte y enviar via Resend.
      // Por ahora MVP: registra envío "simulado" para que la UI muestre actividad.
      await supabase.from("reportes_envios_log").insert({
        reporte_id: r.id,
        estado: "enviado",
        destinatarios: r.destinatarios,
        metadata: { mvp: true, mensaje: "Esqueleto MVP - generación pendiente" },
      });

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

      procesados.push({ id: r.id, nombre: r.nombre });
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
