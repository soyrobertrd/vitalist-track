/**
 * Directorio médico público y reserva de citas sin sesión.
 * Misma lógica en modo mockup (memoria) y en el servidor (/api/v1/publico), sobre el builder de consultas.
 * Solo participan las clínicas que activan `configuracion.reservas_publicas`.
 */
import type { Consulta } from "./consulta.js";

type From = (tabla: string) => Consulta;
export interface RespuestaPublica {
  status: number;
  data: Record<string, unknown>;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const ok = (data: Record<string, unknown>, status = 200): RespuestaPublica => ({ status, data });
const fallo = (error: string, status: number): RespuestaPublica => ({ status, data: { error } });

type Ws = { id: string; nombre: string; slug: string; plan_codigo: string | null; estado: string | null; configuracion: unknown };
export const aceptaReservas = (w: Pick<Ws, "estado" | "configuracion">) =>
  w.estado !== "suspendido" && (w.configuracion as { reservas_publicas?: boolean } | null)?.reservas_publicas === true;

export async function reservasPublicas(from: From, body: Record<string, unknown>): Promise<RespuestaPublica> {
  const accion = body.accion;

  if (accion === "directorio") {
    const { data: wss } = await from("workspaces").select("id, nombre, slug, estado, configuracion");
    const centros = ((wss ?? []) as Ws[]).filter(aceptaReservas);
    if (!centros.length) return ok({ medicos: [] });
    const { data: profs } = await from("personal_salud")
      .select("id, nombre, apellido, especialidad, workspace_id")
      .in("workspace_id", centros.map((c) => c.id))
      .eq("activo", true)
      .order("nombre");
    const porId = new Map(centros.map((c) => [c.id, c]));
    // Solo datos profesionales públicos: nada de teléfono, email ni cédula.
    const medicos = ((profs ?? []) as { id: string; nombre: string; apellido: string; especialidad: string | null; workspace_id: string }[]).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      especialidad: p.especialidad,
      centro: { nombre: porId.get(p.workspace_id)!.nombre, slug: porId.get(p.workspace_id)!.slug },
    }));
    return ok({ medicos });
  }

  const slug = str(body.slug, 80);
  if (!/^[a-z0-9-]+$/.test(slug)) return fallo("Centro no encontrado", 404);
  const { data: ws } = (await from("workspaces").select("id, nombre, slug, plan_codigo, estado, configuracion").eq("slug", slug).maybeSingle()) as { data: Ws | null };
  if (!ws || !aceptaReservas(ws)) return fallo("Este centro no recibe reservas en línea", 404);

  const profesionalValido = async (id: unknown) => {
    if (typeof id !== "string" || !id || id.length > 64) return null;
    const { data } = await from("personal_salud").select("id").eq("id", id).eq("workspace_id", ws.id).eq("activo", true).maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  };

  if (accion === "info") {
    const { data: profs } = await from("personal_salud").select("id, nombre, apellido, especialidad").eq("workspace_id", ws.id).eq("activo", true).order("nombre");
    return ok({ centro: { nombre: ws.nombre }, profesionales: profs ?? [], requiere_cedula: ws.plan_codigo !== "free" && ws.plan_codigo !== "solo" });
  }

  if (accion === "disponibilidad") {
    const profId = await profesionalValido(body.profesional_id);
    const fecha = str(body.fecha, 10);
    if (!profId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fallo("Datos inválidos", 400);

    const { data: ausencias } = await from("ausencias_profesionales").select("id").eq("profesional_id", profId).eq("aprobado", true).lte("fecha_inicio", fecha).gte("fecha_fin", fecha).limit(1);
    if (ausencias?.length) return ok({ slots: [] });

    const dow = new Date(fecha + "T12:00:00").getDay();
    const [{ data: horarios }, { data: citas }] = await Promise.all([
      from("horarios_profesionales").select("hora_inicio, hora_fin").eq("profesional_id", profId).eq("dia_semana", dow).eq("activo", true),
      from("control_visitas").select("fecha_hora_visita").eq("profesional_id", profId).gte("fecha_hora_visita", `${fecha}T00:00:00`).lt("fecha_hora_visita", `${fecha}T23:59:59`).neq("estado", "cancelada"),
    ]);
    const ocupados = new Set(((citas ?? []) as { fecha_hora_visita: string }[]).map((c) => new Date(c.fecha_hora_visita).toTimeString().slice(0, 5)));
    const slots: string[] = [];
    for (const h of (horarios ?? []) as { hora_inicio: string; hora_fin: string }[]) {
      const [hi, mi] = h.hora_inicio.split(":").map(Number);
      const [hf, mf] = h.hora_fin.split(":").map(Number);
      for (let t = hi * 60 + mi; t + 30 <= hf * 60 + mf; t += 30) {
        const hora = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
        if (!ocupados.has(hora)) slots.push(hora);
      }
    }
    return ok({ slots });
  }

  if (accion === "reservar") {
    const profId = await profesionalValido(body.profesional_id);
    const fechaHora = str(body.fecha_hora, 40);
    const nombre = str(body.nombre, 100);
    const apellido = str(body.apellido, 100);
    const telefono = str(body.telefono, 30);
    const email = str(body.email, 150);
    const cedula = str(body.cedula, 20).replace(/\D/g, "");
    const motivo = str(body.motivo, 500);

    if (!profId || isNaN(Date.parse(fechaHora)) || new Date(fechaHora) < new Date()) return fallo("Selecciona un horario válido", 400);
    if (!nombre || !apellido || telefono.replace(/\D/g, "").length < 10) return fallo("Nombre, apellido y un teléfono válido son obligatorios", 400);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fallo("Email inválido", 400);

    const { data: choque } = await from("control_visitas").select("id").eq("profesional_id", profId).eq("fecha_hora_visita", fechaHora).neq("estado", "cancelada").limit(1);
    if (choque?.length) return fallo("Ese horario se acaba de ocupar. Elige otro.", 409);

    const plan = ws.plan_codigo ?? "free";
    let pacienteId: string | null = null;
    if (plan !== "free" && plan !== "solo") {
      if (cedula.length !== 11) return fallo("La cédula (11 dígitos) es obligatoria", 400);
      const { data: existente } = await from("pacientes").select("id").eq("workspace_id", ws.id).eq("cedula", cedula).maybeSingle();
      if (existente) pacienteId = (existente as { id: string }).id;
      else {
        const { data: nuevo, error } = await from("pacientes")
          .insert({ workspace_id: ws.id, cedula, nombre, apellido, contacto_px: telefono, email_px: email || null, tipo_atencion: "ambulatorio" })
          .select("id")
          .single();
        if (error || !nuevo) return fallo("No se pudo registrar al paciente", 500);
        pacienteId = (nuevo as { id: string }).id;
      }
    }

    const { error } = await from("control_visitas").insert({
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
    if (error) return fallo("No se pudo reservar la cita", 500);
    return ok({ ok: true }, 201);
  }

  return fallo("Acción no válida", 400);
}
