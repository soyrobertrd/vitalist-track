// Edge function pública (sin JWT) que recibe leads del formulario de contacto
// del landing y los inserta en public.contactos_landing usando service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactoPayload {
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  pais?: string;
  tamano_clinica?: string;
  mensaje: string;
  plan_interes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ContactoPayload;

    // Validación básica server-side
    if (!body.nombre || body.nombre.trim().length < 2 || body.nombre.length > 120) {
      return json({ error: "Nombre inválido" }, 400);
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 200) {
      return json({ error: "Email inválido" }, 400);
    }
    if (!body.mensaje || body.mensaje.trim().length < 10 || body.mensaje.length > 2000) {
      return json({ error: "El mensaje debe tener entre 10 y 2000 caracteres" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    const { error } = await supabase.from("contactos_landing").insert({
      nombre: body.nombre.trim(),
      email: body.email.trim().toLowerCase(),
      empresa: body.empresa?.trim() || null,
      telefono: body.telefono?.trim() || null,
      pais: body.pais?.trim() || null,
      tamano_clinica: body.tamano_clinica?.trim() || null,
      mensaje: body.mensaje.trim(),
      plan_interes: body.plan_interes?.trim() || null,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[contacto-landing] insert error", error);
      return json({ error: "No se pudo guardar el mensaje" }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("[contacto-landing] unexpected", err);
    return json({ error: "Error interno" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
