// Edge function: exportar-auditoria-pdf
// Genera un reporte PDF (en realidad HTML imprimible firmado con SHA-256) de los logs
// de acceso a fichas clínicas, y registra el exporte en auditoria_exportes.
//
// Body: { workspace_id, fecha_inicio?, fecha_fin?, user_id?, paciente_id? }
// Response: { html, hash, total, export_id }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function escape(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const {
      workspace_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      user_id = null,
      paciente_id = null,
    } = body ?? {};

    // Verificar admin via service role (más confiable)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

    if (!isAdmin && workspace_id) {
      const { data: wm } = await admin
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!wm || (wm.role !== "owner" && wm.role !== "admin")) {
        return new Response(JSON.stringify({ error: "Solo administradores pueden exportar" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Solo administradores pueden exportar" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let q = admin.from("acceso_fichas_log").select("*").order("created_at", { ascending: false });
    if (workspace_id) q = q.eq("workspace_id", workspace_id);
    if (user_id) q = q.eq("user_id", user_id);
    if (paciente_id) q = q.eq("paciente_id", paciente_id);
    if (fecha_inicio) q = q.gte("created_at", `${fecha_inicio}T00:00:00`);
    if (fecha_fin) q = q.lte("created_at", `${fecha_fin}T23:59:59`);

    const { data: logs, error: logsErr } = await q.limit(5000);
    if (logsErr) throw logsErr;

    const userIds = [...new Set((logs ?? []).map((l: any) => l.user_id))];
    const pacIds = [...new Set((logs ?? []).map((l: any) => l.paciente_id))];

    const [profsRes, pacsRes] = await Promise.all([
      userIds.length
        ? admin.from("profiles").select("id,nombre,apellido,email").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      pacIds.length
        ? admin.from("pacientes").select("id,nombre,apellido").in("id", pacIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const userMap: Record<string, string> = {};
    for (const p of profsRes.data ?? []) {
      userMap[p.id] = `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim() || p.email;
    }
    const pacMap: Record<string, string> = {};
    for (const p of pacsRes.data ?? []) {
      pacMap[p.id] = `${p.nombre} ${p.apellido}`;
    }

    const total = logs?.length ?? 0;
    const generadoEn = new Date().toISOString();

    // Cuerpo del documento (canónico para hashing)
    const filas = (logs ?? [])
      .map((l: any) => {
        const fecha = new Date(l.created_at).toISOString();
        return `${fecha}|${userMap[l.user_id] ?? l.user_id}|${pacMap[l.paciente_id] ?? l.paciente_id}|${l.recurso}|${l.accion}|${l.ip_address ?? ""}`;
      })
      .join("\n");

    const canonico = [
      `EXPORTE_AUDITORIA_v1`,
      `workspace=${workspace_id ?? ""}`,
      `rango=${fecha_inicio ?? ""}|${fecha_fin ?? ""}`,
      `user_filter=${user_id ?? ""}`,
      `paciente_filter=${paciente_id ?? ""}`,
      `total=${total}`,
      `generado=${generadoEn}`,
      `exportado_por=${userId}`,
      filas,
    ].join("\n");

    const hash = await sha256(canonico);

    // Registrar exporte
    const { data: expRow, error: expErr } = await admin
      .from("auditoria_exportes")
      .insert({
        workspace_id,
        exportado_por: userId,
        tipo: "pdf_logs",
        rango_inicio: fecha_inicio,
        rango_fin: fecha_fin,
        total_registros: total,
        filtros: { user_id, paciente_id },
        hash_sha256: hash,
      })
      .select()
      .maybeSingle();
    if (expErr) throw expErr;

    // HTML imprimible (el usuario hace "Imprimir → Guardar como PDF")
    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Exporte de auditoría</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#111;font-size:11px}
  h1{font-size:18px;margin:0 0 4px}
  .meta{color:#555;font-size:10px;margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #eee;vertical-align:top}
  th{background:#f4f4f5;font-weight:600}
  .footer{margin-top:24px;padding-top:8px;border-top:2px solid #111;font-size:10px}
  .hash{font-family:ui-monospace,Menlo,monospace;word-break:break-all;color:#444}
  @media print { body{margin:12mm} }
</style></head><body>
<h1>Exporte regulatorio · Logs de acceso a fichas clínicas</h1>
<div class="meta">
  Generado: ${escape(generadoEn)}<br>
  Exportado por: ${escape(userMap[userId] ?? userId)}<br>
  Rango: ${escape(fecha_inicio ?? "—")} → ${escape(fecha_fin ?? "—")}<br>
  Total registros: <strong>${total}</strong>
</div>
<table>
  <thead><tr><th>Fecha</th><th>Usuario</th><th>Paciente</th><th>Recurso</th><th>Acción</th><th>IP</th></tr></thead>
  <tbody>
    ${(logs ?? [])
      .slice(0, 2000)
      .map(
        (l: any) => `<tr>
        <td>${escape(new Date(l.created_at).toLocaleString("es-DO"))}</td>
        <td>${escape(userMap[l.user_id] ?? l.user_id)}</td>
        <td>${escape(pacMap[l.paciente_id] ?? l.paciente_id)}</td>
        <td>${escape(l.recurso)}</td>
        <td>${escape(l.accion)}</td>
        <td>${escape(l.ip_address ?? "")}</td>
      </tr>`
      )
      .join("")}
  </tbody>
</table>
${total > 2000 ? `<p style="margin-top:8px;color:#888">Mostrando primeros 2000 de ${total} registros. El hash cubre el conjunto completo.</p>` : ""}
<div class="footer">
  <strong>Firma SHA-256 (verificable):</strong><br>
  <span class="hash">${escape(hash)}</span><br>
  <span style="color:#666">ID exporte: ${escape(expRow?.id ?? "")}</span>
</div>
</body></html>`;

    return new Response(
      JSON.stringify({ html, hash, total, export_id: expRow?.id, generadoEn }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[exportar-auditoria-pdf]", e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
