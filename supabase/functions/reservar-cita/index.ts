// Enlace público de citas por centro: /reservar/:slug
// Sin límite de citas en ningún plan. Lo que cambia por plan es qué pasa con el paciente:
//   free  → la cita guarda solo los datos de contacto (no se crea paciente)
//   solo  → igual, pero queda marcada `pendiente_registro` para que el doctor lo agregue a mano
//   resto → se crea (o reutiliza por cédula) el paciente automáticamente
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MAX_RESERVAS_POR_HORA_IP = 5;
const UUID = /^[0-9a-f-]{36}$/i;

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    const slug = str(body.slug, 80);
    if (!/^[a-z0-9-]+$/.test(slug)) return json({ error: "Centro no encontrado" }, 404);

    const { data: ws } = await admin
      .from("workspaces")
      .select("id, nombre, plan_codigo, estado, reservas_publicas_activas")
      .eq("slug", slug)
      .maybeSingle();
    if (!ws || ws.estado === "suspendido" || !ws.reservas_publicas_activas) {
      return json({ error: "Este centro no recibe reservas en línea" }, 404);
    }

    const profesionalValido = async (id: unknown) => {
      if (typeof id !== "string" || !UUID.test(id)) return null;
      const { data } = await admin
        .from("personal_salud")
        .select("id")
        .eq("id", id)
        .eq("workspace_id", ws.id)
        .eq("activo", true)
        .maybeSingle();
      return data?.id ?? null;
    };

    if (body.accion === "info") {
      const { data: profs } = await admin
        .from("personal_salud")
        .select("id, nombre, apellido, especialidad")
        .eq("workspace_id", ws.id)
        .eq("activo", true)
        .order("nombre");
      return json({
        centro: { nombre: ws.nombre },
        profesionales: profs ?? [],
        requiere_cedula: ws.plan_codigo !== "free" && ws.plan_codigo !== "solo",
      });
    }

    if (body.accion === "disponibilidad") {
      const profId = await profesionalValido(body.profesional_id);
      const fecha = str(body.fecha, 10);
      if (!profId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return json({ error: "Datos inválidos" }, 400);

      const { data: ausencias } = await admin
        .from("ausencias_profesionales")
        .select("id")
        .eq("profesional_id", profId)
        .eq("aprobado", true)
        .lte("fecha_inicio", fecha)
        .gte("fecha_fin", fecha)
        .limit(1);
      if (ausencias?.length) return json({ slots: [] });

      const dow = new Date(fecha + "T12:00:00").getDay();
      const [{ data: horarios }, { data: citas }] = await Promise.all([
        admin.from("horarios_profesionales").select("hora_inicio, hora_fin")
          .eq("profesional_id", profId).eq("dia_semana", dow).eq("activo", true),
        admin.from("control_visitas").select("fecha_hora_visita")
          .eq("profesional_id", profId)
          .gte("fecha_hora_visita", `${fecha}T00:00:00`)
          .lt("fecha_hora_visita", `${fecha}T23:59:59`)
          .neq("estado", "cancelada"),
      ]);
      const ocupados = new Set((citas ?? []).map((c: any) => new Date(c.fecha_hora_visita).toTimeString().slice(0, 5)));

      const slots: string[] = [];
      for (const h of horarios ?? []) {
        const [hi, mi] = h.hora_inicio.split(":").map(Number);
        const [hf, mf] = h.hora_fin.split(":").map(Number);
        for (let t = hi * 60 + mi; t + 30 <= hf * 60 + mf; t += 30) {
          const hora = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
          if (!ocupados.has(hora)) slots.push(hora);
        }
      }
      return json({ slots });
    }

    if (body.accion === "reservar") {
      const profId = await profesionalValido(body.profesional_id);
      const fechaHora = str(body.fecha_hora, 40);
      const nombre = str(body.nombre, 100);
      const apellido = str(body.apellido, 100);
      const telefono = str(body.telefono, 30);
      const email = str(body.email, 150);
      const cedula = str(body.cedula, 20).replace(/\D/g, "");
      const motivo = str(body.motivo, 500);

      if (!profId || isNaN(Date.parse(fechaHora)) || new Date(fechaHora) < new Date()) {
        return json({ error: "Selecciona un horario válido" }, 400);
      }
      if (!nombre || !apellido || telefono.replace(/\D/g, "").length < 10) {
        return json({ error: "Nombre, apellido y un teléfono válido son obligatorios" }, 400);
      }
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Email inválido" }, 400);

      // Anti-abuso: sin límite de citas por plan, pero sí por IP para evitar spam.
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";
      const ipHash = await sha256Hex(`${ip}:${ws.id}`);
      const { count } = await admin
        .from("reservas_publicas_log")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
      if ((count ?? 0) >= MAX_RESERVAS_POR_HORA_IP) {
        return json({ error: "Demasiadas reservas seguidas. Intenta más tarde." }, 429);
      }

      const { data: choque } = await admin
        .from("control_visitas")
        .select("id")
        .eq("profesional_id", profId)
        .eq("fecha_hora_visita", fechaHora)
        .neq("estado", "cancelada")
        .limit(1);
      if (choque?.length) return json({ error: "Ese horario se acaba de ocupar. Elige otro." }, 409);

      const plan = ws.plan_codigo ?? "free";
      const autoRegistro = plan !== "free" && plan !== "solo";
      let pacienteId: string | null = null;

      if (autoRegistro) {
        if (cedula.length !== 11) return json({ error: "La cédula (11 dígitos) es obligatoria" }, 400);
        const { data: existente } = await admin
          .from("pacientes")
          .select("id")
          .eq("workspace_id", ws.id)
          .eq("cedula", cedula)
          .maybeSingle();
        if (existente) {
          pacienteId = existente.id;
        } else {
          const { data: nuevo, error } = await admin
            .from("pacientes")
            .insert({
              workspace_id: ws.id,
              cedula,
              nombre,
              apellido,
              contacto_px: telefono,
              email: email || null,
              tipo_atencion: "ambulatorio",
              origen_registro: "portal_publico",
            })
            .select("id")
            .single();
          if (error) throw error;
          pacienteId = nuevo.id;
        }
      }

      const { error: errCita } = await admin.from("control_visitas").insert({
        workspace_id: ws.id,
        paciente_id: pacienteId,
        profesional_id: profId,
        fecha_hora_visita: fechaHora,
        tipo_visita: "ambulatoria",
        modalidad: "presencial",
        motivo_visita: motivo || "Cita reservada en línea",
        estado: "pendiente",
        origen: "enlace_publico",
        solicitante_nombre: `${nombre} ${apellido}`,
        solicitante_telefono: telefono,
        solicitante_email: email || null,
        pendiente_registro: plan === "solo",
      });
      if (errCita) throw errCita;

      await admin.from("reservas_publicas_log").insert({ workspace_id: ws.id, ip_hash: ipHash });
      return json({ ok: true });
    }

    return json({ error: "Acción inválida" }, 400);
  } catch (e) {
    console.error("reservar-cita:", e);
    return json({ error: "No se pudo completar la reserva" }, 500);
  }
});
