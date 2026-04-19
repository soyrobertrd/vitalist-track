// Edge Function pública para validar y mostrar tickets de citas por token.
// No requiere autenticación. Devuelve fechas formateadas según TZ del workspace.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveWorkspaceLocale, formatDateInTz, formatTimeInTz } from "../_shared/locale.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 10) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: ticket, error } = await supabase
      .from("cita_tickets")
      .select(`
        id, codigo_corto, estado_checkin, tipo_cita, workspace_id, fecha_llegada, fecha_atencion,
        pacientes:paciente_id (nombre, apellido, cedula),
        visita:visita_id (fecha_hora_visita, tipo_visita, motivo_visita, personal_salud:profesional_id (nombre, apellido)),
        llamada:llamada_id (fecha_agendada, motivo, personal_salud:profesional_id (nombre, apellido))
      `)
      .eq("token", token)
      .maybeSingle();

    if (error || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cita: any = (ticket as any).visita || (ticket as any).llamada;
    const fechaCita = (ticket as any).visita?.fecha_hora_visita || (ticket as any).llamada?.fecha_agendada;
    const profesional = cita?.personal_salud;

    // Resolve workspace locale for date/time formatting
    const { timezone, locale, countryCode } = await resolveWorkspaceLocale(supabase, ticket.workspace_id);

    let workspace = null;
    if (ticket.workspace_id) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("nombre, logo_url, direccion, telefono, email_contacto, sitio_web, instrucciones_cita, country_code, timezone")
        .eq("id", ticket.workspace_id)
        .maybeSingle();
      workspace = ws;
    }

    // Format the appointment date/time using workspace timezone
    let fechaCitaFormatted: string | null = null;
    let horaCitaFormatted: string | null = null;
    if (fechaCita) {
      const d = new Date(fechaCita);
      fechaCitaFormatted = formatDateInTz(d, timezone, locale);
      horaCitaFormatted = formatTimeInTz(d, timezone, locale);
    }

    const payload = {
      ticket: {
        codigo_corto: ticket.codigo_corto,
        estado_checkin: ticket.estado_checkin,
        tipo_cita: ticket.tipo_cita,
        fecha_cita: fechaCita,
        fecha_cita_formatted: fechaCitaFormatted,
        hora_cita_formatted: horaCitaFormatted,
        paciente_nombre: `${(ticket as any).pacientes?.nombre || ""} ${(ticket as any).pacientes?.apellido || ""}`.trim(),
        paciente_cedula: (ticket as any).pacientes?.cedula || null,
        profesional_nombre: profesional ? `${profesional.nombre} ${profesional.apellido}` : null,
        motivo: cita?.motivo_visita || cita?.motivo || null,
      },
      workspace,
      locale: { timezone, locale, countryCode },
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
