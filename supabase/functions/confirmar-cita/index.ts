// S11: confirmación/reagendado de citas por enlace público.
// Todo pasa por aquí con service role; el cliente anónimo no toca cita_tokens ni las tablas de citas.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const TABLAS = {
  llamada: { tabla: "registro_llamadas", fecha: "fecha_agendada" },
  visita: { tabla: "control_visitas", fecha: "fecha_hora_visita" },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { token, tipo, accion, fechaHora, motivo } = await req.json();
    if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return json({ error: "Enlace inválido" }, 400);
    if (tipo !== "llamada" && tipo !== "visita") return json({ error: "Enlace inválido" }, 400);
    if (!["ver", "confirmar", "reagendar"].includes(accion)) return json({ error: "Acción inválida" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: tk } = await supabase
      .from("cita_tokens")
      .select("id, cita_id, tipo, expira_en, usado_en")
      .eq("hash", await sha256Hex(token))
      .maybeSingle();

    if (!tk || tk.tipo !== tipo) return json({ error: "Enlace inválido o no reconocido" }, 404);
    if (tk.usado_en) return json({ error: "Este enlace ya fue utilizado" }, 410);
    if (new Date(tk.expira_en) < new Date()) return json({ error: "Este enlace ha expirado" }, 410);

    const { tabla, fecha } = TABLAS[tipo as keyof typeof TABLAS];

    if (accion === "ver") {
      const { data: cita } = await supabase
        .from(tabla)
        .select(`id, ${fecha}, estado, ${tipo === "llamada" ? "motivo, " : ""}pacientes(nombre, apellido), personal_salud(nombre, apellido)`)
        .eq("id", tk.cita_id)
        .maybeSingle();
      if (!cita) return json({ error: "Cita no encontrada" }, 404);
      return json({ cita });
    }

    let update: Record<string, unknown>;
    if (accion === "confirmar") {
      update = tipo === "llamada"
        ? { estado: "agendada", notas_adicionales: "Confirmada por paciente" }
        : { estado: "pendiente", notas_visita: "Confirmada por paciente" };
    } else {
      if (typeof fechaHora !== "string" || isNaN(Date.parse(fechaHora))) return json({ error: "Fecha inválida" }, 400);
      if (new Date(fechaHora) < new Date()) return json({ error: "La fecha debe ser futura" }, 400);
      const nota = `Reagendada por paciente: ${String(motivo ?? "").slice(0, 500)}`;
      update = tipo === "llamada"
        ? { fecha_agendada: fechaHora, estado: "reagendada", notas_adicionales: nota }
        : { fecha_hora_visita: fechaHora, estado: "pendiente", notas_visita: nota };
    }

    // Marcar usado primero (condicional) para que el enlace no se pueda usar dos veces en paralelo.
    const { data: marcado } = await supabase
      .from("cita_tokens")
      .update({ usado_en: new Date().toISOString() })
      .eq("id", tk.id)
      .is("usado_en", null)
      .select("id");
    if (!marcado?.length) return json({ error: "Este enlace ya fue utilizado" }, 410);

    const { error } = await supabase.from(tabla).update(update).eq("id", tk.cita_id);
    if (error) {
      await supabase.from("cita_tokens").update({ usado_en: null }).eq("id", tk.id);
      throw error;
    }
    return json({ ok: true });
  } catch (e) {
    console.error("confirmar-cita:", e);
    return json({ error: "No se pudo procesar la solicitud" }, 500);
  }
});
