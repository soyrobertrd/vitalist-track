// Exportación avanzada de auditoría con filtros: rango fechas, usuario, severidad, tipo, formato (csv/json)
import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { createClient } from "npm:@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (!claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      desde = null, hasta = null, user_id = null,
      severidad = null, tipo = null, formato = "csv",
      origen = "alertas", // 'alertas' | 'accesos' | 'cambios'
    } = body;

    let query;
    if (origen === "accesos") {
      query = supabase.from("acceso_fichas_log")
        .select("created_at, user_id, paciente_id, recurso, accion, metadata")
        .order("created_at", { ascending: false }).limit(10000);
    } else if (origen === "cambios") {
      query = supabase.from("auditoria_cambios")
        .select("created_at, usuario_id, tabla, registro_id, accion")
        .order("created_at", { ascending: false }).limit(10000);
    } else {
      query = supabase.from("auditoria_alertas")
        .select("created_at, user_id, tipo, categoria, severidad, descripcion, resuelto, metadata")
        .order("created_at", { ascending: false }).limit(10000);
      if (severidad) query = query.eq("severidad", severidad);
      if (tipo) query = query.eq("tipo", tipo);
    }
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", hasta);
    if (user_id) {
      query = origen === "cambios"
        ? query.eq("usuario_id", user_id)
        : query.eq("user_id", user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = data ?? [];

    if (formato === "json") {
      return new Response(JSON.stringify({ rows, total: rows.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CSV
    if (rows.length === 0) {
      return new Response("sin_datos\n", {
        headers: { ...corsHeaders, "Content-Type": "text/csv" },
      });
    }
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r: any) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="auditoria_${origen}_${Date.now()}.csv"`,
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
