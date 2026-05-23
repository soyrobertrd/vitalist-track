// Exportación GDPR/HIPAA: devuelve todos los datos de un paciente en JSON.
// Solo miembros del workspace del paciente pueden exportar. Se audita el acceso.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tablas con columna paciente_id que queremos incluir
const TABLAS_PACIENTE = [
  "control_visitas", "registro_llamadas", "recetas_medicas", "alergias_paciente",
  "seguros_paciente", "facturas", "ordenes_medicas", "estudios_imagen",
  "ordenes_laboratorio", "odontogramas", "planes_tratamiento_dental",
  "recetas_oftalmicas", "pacientes_recovery", "leads_estetica",
  "evaluaciones_esteticas", "financiamiento_estetico", "consentimientos_informados",
  "sesiones_psicologia", "cuestionarios_envios", "acceso_fichas_log",
  "notificaciones_plan_accion", "auditoria_cambios",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: uerr } = await userClient.auth.getUser();
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { paciente_id } = await req.json();
    if (!paciente_id || typeof paciente_id !== "string") {
      return new Response(JSON.stringify({ error: "paciente_id requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(url, service);

    // Verificar paciente y membresía workspace
    const { data: pac } = await admin.from("pacientes").select("*").eq("id", paciente_id).maybeSingle();
    if (!pac) {
      return new Response(JSON.stringify({ error: "Paciente no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: esMiembro } = await admin.rpc("is_workspace_member", {
      _user_id: user.id, _workspace_id: pac.workspace_id,
    });
    if (!esMiembro) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Recolectar datos
    const datos: Record<string, unknown> = { paciente: pac };
    for (const tabla of TABLAS_PACIENTE) {
      const { data, error } = await admin.from(tabla as any).select("*").eq("paciente_id", paciente_id);
      if (!error) datos[tabla] = data ?? [];
    }

    // Auditar
    await admin.rpc("registrar_acceso_ficha", {
      _paciente_id: paciente_id,
      _recurso: "exportacion_gdpr",
      _accion: "export",
      _metadata: { tablas: TABLAS_PACIENTE.length },
    });

    const payload = {
      generado_en: new Date().toISOString(),
      generado_por: user.id,
      paciente_id,
      normativa: "GDPR Art.20 / HIPAA Right of Access",
      datos,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="paciente-${paciente_id}-gdpr.json"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
