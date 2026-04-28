// Edge function: genera el contenido de un reporte (CSV) según tipo y filtros.
// Soporta envío por email opcional via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TipoReporte =
  | "kpi_profesionales"
  | "comparativo_sucursales"
  | "visitas_resumen"
  | "llamadas_resumen"
  | "facturacion"
  | "pacientes_estado"
  | "auditoria_accesos";

function toCsv(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return "sin datos\n";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
  return `${head}\n${body}\n`;
}

async function obtenerDatos(
  supabase: any,
  workspaceId: string,
  tipo: TipoReporte,
  filtros: Record<string, any>
): Promise<Record<string, any>[]> {
  const desde = filtros?.desde ?? new Date(Date.now() - 30 * 86400_000).toISOString();
  const hasta = filtros?.hasta ?? new Date().toISOString();

  switch (tipo) {
    case "visitas_resumen": {
      const { data } = await supabase
        .from("control_visitas")
        .select("id,fecha_hora_visita,estado,tipo_visita,modalidad,profesional_id,paciente_id,sucursal_id")
        .eq("workspace_id", workspaceId)
        .gte("fecha_hora_visita", desde)
        .lte("fecha_hora_visita", hasta)
        .order("fecha_hora_visita", { ascending: false })
        .limit(5000);
      return data ?? [];
    }
    case "llamadas_resumen": {
      const { data } = await supabase
        .from("registro_llamadas")
        .select("id,fecha_llamada,estado,resultado_seguimiento,duracion_minutos,profesional_id,paciente_id")
        .gte("created_at", desde)
        .lte("created_at", hasta)
        .order("created_at", { ascending: false })
        .limit(5000);
      return data ?? [];
    }
    case "facturacion": {
      const { data } = await supabase
        .from("facturas")
        .select("numero_factura,fecha_emision,monto_total,monto_pagado,estado,paciente_id,aseguradora")
        .eq("workspace_id", workspaceId)
        .gte("fecha_emision", desde.slice(0, 10))
        .lte("fecha_emision", hasta.slice(0, 10))
        .order("fecha_emision", { ascending: false })
        .limit(5000);
      return data ?? [];
    }
    case "pacientes_estado": {
      const { data } = await supabase
        .from("pacientes")
        .select("id,nombre,apellido,cedula,status_px,zona,barrio,sucursal_id,profesional_asignado_id,created_at")
        .eq("workspace_id", workspaceId)
        .limit(10000);
      return data ?? [];
    }
    case "auditoria_accesos": {
      const { data } = await supabase
        .from("acceso_fichas_log")
        .select("created_at,user_id,paciente_id,recurso,accion,ip_address")
        .eq("workspace_id", workspaceId)
        .gte("created_at", desde)
        .lte("created_at", hasta)
        .order("created_at", { ascending: false })
        .limit(10000);
      return data ?? [];
    }
    case "kpi_profesionales": {
      const { data: visitas } = await supabase
        .from("control_visitas")
        .select("profesional_id,estado")
        .eq("workspace_id", workspaceId)
        .gte("fecha_hora_visita", desde)
        .lte("fecha_hora_visita", hasta);
      const agg: Record<string, any> = {};
      for (const v of visitas ?? []) {
        const k = v.profesional_id ?? "sin_asignar";
        agg[k] ??= { profesional_id: k, total: 0, realizadas: 0, canceladas: 0, pendientes: 0 };
        agg[k].total++;
        if (v.estado === "realizada") agg[k].realizadas++;
        else if (v.estado === "cancelada" || v.estado === "no_realizada") agg[k].canceladas++;
        else agg[k].pendientes++;
      }
      return Object.values(agg);
    }
    case "comparativo_sucursales": {
      const { data: visitas } = await supabase
        .from("control_visitas")
        .select("sucursal_id,estado")
        .eq("workspace_id", workspaceId)
        .gte("fecha_hora_visita", desde)
        .lte("fecha_hora_visita", hasta);
      const agg: Record<string, any> = {};
      for (const v of visitas ?? []) {
        const k = v.sucursal_id ?? "sin_sucursal";
        agg[k] ??= { sucursal_id: k, total: 0, realizadas: 0, canceladas: 0 };
        agg[k].total++;
        if (v.estado === "realizada") agg[k].realizadas++;
        else if (v.estado === "cancelada") agg[k].canceladas++;
      }
      return Object.values(agg);
    }
    default:
      return [];
  }
}

async function enviarPorEmail(
  destinatarios: string[],
  asunto: string,
  cuerpoHtml: string,
  filename: string,
  csv: string
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY no configurado" };

  const url = LOVABLE_API_KEY
    ? "https://connector-gateway.lovable.dev/resend/emails"
    : "https://api.resend.com/emails";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (LOVABLE_API_KEY) {
    headers["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
    headers["X-Connection-Api-Key"] = RESEND_API_KEY;
  } else {
    headers["Authorization"] = `Bearer ${RESEND_API_KEY}`;
  }

  const attachment = {
    filename,
    content: btoa(unescape(encodeURIComponent(csv))),
  };

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "Reportes <onboarding@resend.dev>",
      to: destinatarios,
      subject: asunto,
      html: cuerpoHtml,
      attachments: [attachment],
    }),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const {
      workspace_id,
      tipo_reporte,
      filtros = {},
      destinatarios = [],
      enviar_email = false,
      reporte_id = null,
    } = body as {
      workspace_id?: string;
      tipo_reporte?: TipoReporte;
      filtros?: Record<string, any>;
      destinatarios?: string[];
      enviar_email?: boolean;
      reporte_id?: string | null;
    };

    if (!workspace_id || !tipo_reporte) {
      return new Response(
        JSON.stringify({ ok: false, error: "workspace_id y tipo_reporte son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = await obtenerDatos(supabase, workspace_id, tipo_reporte, filtros);
    const csv = toCsv(rows);
    const filename = `${tipo_reporte}_${new Date().toISOString().slice(0, 10)}.csv`;

    let envio: any = { intentado: false };
    if (enviar_email && destinatarios.length > 0) {
      envio = await enviarPorEmail(
        destinatarios,
        `Reporte: ${tipo_reporte}`,
        `<p>Adjunto encontrarás el reporte solicitado (${rows.length} registros).</p>`,
        filename,
        csv
      );
      envio.intentado = true;

      if (reporte_id) {
        await supabase.from("reportes_envios_log").insert({
          reporte_id,
          estado: envio.ok ? "enviado" : "error",
          destinatarios,
          metadata: { filas: rows.length, archivo: filename, error: envio.ok ? null : envio.body },
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        filas: rows.length,
        filename,
        csv,
        envio,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
