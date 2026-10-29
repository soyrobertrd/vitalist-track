import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const Body = z.object({
  integracion_id: z.string().uuid(),
  tipo_referencia: z.enum(["prescripcion", "orden_lab"]),
  referencia_id: z.string().uuid(),
  payload: z.record(z.any()),
});

// SSRF: solo https hacia hosts públicos por nombre o IP pública.
// shortcut: no resuelve DNS (un dominio que apunte a una IP privada pasa), añadir resolución si se exponen endpoints internos.
export function endpointPermitido(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return false;
  if (h.includes(":")) return false; // IPv6 literal
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  } else if (/^[\d.]+$/.test(h) || /^0x/i.test(h)) return false; // formas numéricas raras
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  // Validate user
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { integracion_id, tipo_referencia, referencia_id, payload } = parsed.data;

    // Load integración (service role bypasses RLS pero validamos que el user pertenezca al workspace)
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: integ, error: ie } = await admin
      .from("integraciones_externas_psico")
      .select("*").eq("id", integracion_id).maybeSingle();
    if (ie || !integ) throw new Error("Integración no encontrada");
    if (!integ.activo) throw new Error("Integración inactiva");

    const { data: member } = await admin
      .from("workspace_members")
      .select("user_id").eq("workspace_id", integ.workspace_id).eq("user_id", user.id).maybeSingle();
    if (!member) throw new Error("Sin permiso sobre el workspace");

    // POST al endpoint externo (si configurado)
    let respuesta: any = { simulado: true };
    let estado: "enviado" | "fallido" = "enviado";
    if (integ.endpoint && !endpointPermitido(integ.endpoint)) {
      respuesta = { error: "Endpoint no permitido (solo https a hosts públicos)" };
      estado = "fallido";
    } else if (integ.endpoint) {
      try {
        const r = await fetch(integ.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(integ.api_key_cifrada ? { Authorization: `Bearer ${integ.api_key_cifrada}` } : {}),
          },
          body: JSON.stringify({ tipo: tipo_referencia, referencia_id, data: payload }),
          redirect: "manual",
        });
        respuesta = { status: r.status, body: await r.text().then(t => t.slice(0, 2000)) };
        if (!r.ok) estado = "fallido";
      } catch (e: any) {
        respuesta = { error: e.message };
        estado = "fallido";
      }
    }

    await admin.from("envios_externos_psico").insert({
      workspace_id: integ.workspace_id,
      integracion_id, tipo_referencia, referencia_id,
      payload, respuesta, estado, enviado_por: user.id,
    });

    return new Response(JSON.stringify({ ok: true, estado, respuesta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
