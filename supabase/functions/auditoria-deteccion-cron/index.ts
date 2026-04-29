import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Ejecuta detección global (workspace_id = null procesa todos)
    const { data: count, error } = await supabase.rpc("detectar_accesos_sospechosos", { _workspace_id: null });
    if (error) throw error;

    // Genera resumen diario auto
    await supabase.rpc("generar_resumen_auditoria", { _periodo: "diario" });

    return new Response(JSON.stringify({ ok: true, alertas_creadas: count, ts: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
