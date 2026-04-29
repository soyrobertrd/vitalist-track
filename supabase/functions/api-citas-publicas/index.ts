// Public API for patient portals: query and book appointments using API key
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function jres(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authToken(req: Request) {
  const apiKey = req.headers.get("x-api-key") ?? new URL(req.url).searchParams.get("api_key");
  if (!apiKey) return { error: "Missing x-api-key header", status: 401 };
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await admin
    .from("public_appointment_tokens")
    .select("*")
    .eq("api_key", apiKey)
    .eq("activo", true)
    .maybeSingle();
  if (error || !data) return { error: "API key inválida", status: 401 };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { error: "API key expirada", status: 401 };
  }
  // log uso
  await admin
    .from("public_appointment_tokens")
    .update({ ultimo_uso: new Date().toISOString(), total_llamadas: (data.total_llamadas ?? 0) + 1 })
    .eq("id", data.id);
  return { token: data, admin };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).pop() ?? "";

  const auth = await authToken(req);
  if ("error" in auth) return jres({ error: auth.error }, auth.status);
  const { token, admin } = auth;

  try {
    // GET /especialidades — lista de especialidades del workspace
    if (req.method === "GET" && path === "especialidades") {
      const { data: afil } = await admin
        .from("afiliaciones_profesional").select("profesional_id")
        .eq("workspace_id", token.workspace_id).eq("estado", "activa");
      const ids = (afil ?? []).map((a: any) => a.profesional_id);
      if (ids.length === 0) return jres({ especialidades: [] });
      const { data: profs } = await admin.from("personal_salud").select("especialidad").in("id", ids);
      const set = new Set((profs ?? []).map((p: any) => p.especialidad).filter(Boolean));
      return jres({ especialidades: Array.from(set).sort() });
    }

    // GET /sucursales
    if (req.method === "GET" && path === "sucursales") {
      const { data } = await admin
        .from("sucursales").select("id, nombre, codigo, direccion, ciudad")
        .eq("workspace_id", token.workspace_id).eq("activo", true);
      return jres({ sucursales: data ?? [] });
    }

    // GET /consultorios?sucursal_id=
    if (req.method === "GET" && path === "consultorios") {
      const sid = url.searchParams.get("sucursal_id");
      let q = admin.from("consultorios").select("id, sucursal_id, nombre, codigo, tipo").eq("activo", true);
      if (sid) q = q.eq("sucursal_id", sid);
      const { data } = await q;
      return jres({ consultorios: data ?? [] });
    }

    // GET /profesionales?especialidad=&sucursal_id=
    if (req.method === "GET" && path === "profesionales") {
      const especialidad = url.searchParams.get("especialidad");
      const { data: afil } = await admin
        .from("afiliaciones_profesional")
        .select("profesional_id")
        .eq("workspace_id", token.workspace_id)
        .eq("estado", "activa");
      const ids = (afil ?? []).map((a: any) => a.profesional_id);
      if (ids.length === 0) return jres({ profesionales: [] });
      let q = admin.from("personal_salud").select("id, nombre, apellido, especialidad").in("id", ids);
      if (especialidad) q = q.eq("especialidad", especialidad);
      const { data: profs } = await q;
      return jres({ profesionales: profs ?? [] });
    }

    // GET /disponibilidad?profesional_id=&fecha=YYYY-MM-DD[&consultorio_id=]
    if (req.method === "GET" && path === "disponibilidad") {
      const profId = url.searchParams.get("profesional_id");
      const fecha = url.searchParams.get("fecha");
      const consultorioId = url.searchParams.get("consultorio_id");
      if (!profId || !fecha) return jres({ error: "profesional_id y fecha requeridos" }, 400);

      // 1) Reglas de licencia / vacaciones / ausencias en esta fecha
      const { data: ausencias } = await admin
        .from("ausencias_profesionales")
        .select("tipo, descripcion, fecha_inicio, fecha_fin")
        .eq("profesional_id", profId)
        .eq("aprobado", true)
        .lte("fecha_inicio", fecha)
        .gte("fecha_fin", fecha);

      if (ausencias && ausencias.length > 0) {
        const a = ausencias[0];
        return jres({
          fecha, profesional_id: profId, disponibles: [], slots: [],
          bloqueado: true,
          motivo_bloqueo: a.tipo,
          descripcion_bloqueo: a.descripcion || `${a.tipo} del ${a.fecha_inicio} al ${a.fecha_fin}`,
        });
      }

      const dow = new Date(fecha + "T12:00:00").getDay();
      const { data: horarios } = await admin
        .from("horarios_profesionales")
        .select("hora_inicio, hora_fin")
        .eq("profesional_id", profId)
        .eq("dia_semana", dow)
        .eq("activo", true);

      const { data: citas } = await admin
        .from("control_visitas")
        .select("fecha_hora_visita")
        .eq("profesional_id", profId)
        .gte("fecha_hora_visita", `${fecha}T00:00:00`)
        .lt("fecha_hora_visita", `${fecha}T23:59:59`)
        .neq("estado", "cancelada");

      const ocupados = (citas ?? []).map((c: any) =>
        new Date(c.fecha_hora_visita).toTimeString().slice(0, 5)
      );

      let consultorio_label: string | null = null;
      if (consultorioId) {
        const { data: c } = await admin.from("consultorios").select("nombre").eq("id", consultorioId).maybeSingle();
        consultorio_label = c?.nombre || null;
      }

      const slots: any[] = [];
      for (const h of horarios ?? []) {
        const [hi, mi] = h.hora_inicio.split(":").map(Number);
        const [hf] = h.hora_fin.split(":").map(Number);
        for (let hour = hi; hour < hf; hour++) {
          for (const min of [0, 30]) {
            if (hour === hi && min < mi) continue;
            const hora = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            slots.push({
              hora,
              disponible: !ocupados.includes(hora),
              consultorio: consultorio_label,
            });
          }
        }
      }
      return jres({
        fecha, profesional_id: profId,
        disponibles: slots.filter((s) => s.disponible).map((s) => s.hora),
        slots,
        bloqueado: false,
      });
    }

    // POST /agendar { paciente:{nombre,apellido,cedula,telefono,email}, profesional_id, fecha_hora, motivo, modalidad }
    if (req.method === "POST" && path === "agendar") {
      if (!token.permisos?.agendar) return jres({ error: "Sin permiso para agendar" }, 403);
      const body = await req.json();
      const { paciente, profesional_id, fecha_hora, motivo, modalidad = "presencial" } = body;
      if (!paciente?.cedula || !profesional_id || !fecha_hora) {
        return jres({ error: "Campos requeridos: paciente.cedula, profesional_id, fecha_hora" }, 400);
      }

      // Upsert paciente por cédula dentro del workspace
      let { data: pac } = await admin
        .from("pacientes")
        .select("id")
        .eq("cedula", paciente.cedula)
        .eq("workspace_id", token.workspace_id)
        .maybeSingle();

      if (!pac) {
        const { data: nuevo, error: errPac } = await admin
          .from("pacientes")
          .insert({
            workspace_id: token.workspace_id,
            cedula: paciente.cedula,
            nombre: paciente.nombre ?? "Sin nombre",
            apellido: paciente.apellido ?? "",
            contacto_px: paciente.telefono ?? null,
            email: paciente.email ?? null,
            tipo_atencion: "ambulatorio",
            origen_registro: "portal_publico",
          })
          .select("id")
          .single();
        if (errPac) return jres({ error: errPac.message }, 400);
        pac = nuevo;
      }

      const { data: visita, error: errV } = await admin
        .from("control_visitas")
        .insert({
          workspace_id: token.workspace_id,
          sucursal_id: token.sucursal_id,
          paciente_id: pac.id,
          profesional_id,
          fecha_hora_visita: fecha_hora,
          tipo_visita: "ambulatoria",
          modalidad,
          motivo_visita: motivo ?? "Cita agendada vía portal",
          estado: "pendiente",
        })
        .select("id")
        .single();
      if (errV) return jres({ error: errV.message }, 400);

      return jres({ ok: true, visita_id: visita.id, paciente_id: pac.id });
    }

    // GET /mis-citas?cedula=
    if (req.method === "GET" && path === "mis-citas") {
      const cedula = url.searchParams.get("cedula");
      if (!cedula) return jres({ error: "cedula requerida" }, 400);
      const { data: pac } = await admin
        .from("pacientes")
        .select("id, nombre, apellido")
        .eq("cedula", cedula)
        .eq("workspace_id", token.workspace_id)
        .maybeSingle();
      if (!pac) return jres({ citas: [] });
      const { data: citas } = await admin
        .from("control_visitas")
        .select("id, fecha_hora_visita, estado, modalidad, motivo_visita, profesional_id")
        .eq("paciente_id", pac.id)
        .gte("fecha_hora_visita", new Date().toISOString())
        .order("fecha_hora_visita", { ascending: true });
      return jres({ paciente: pac, citas: citas ?? [] });
    }

    // POST /cancelar { visita_id, cedula }
    if (req.method === "POST" && path === "cancelar") {
      if (!token.permisos?.cancelar) return jres({ error: "Sin permiso para cancelar" }, 403);
      const { visita_id, cedula } = await req.json();
      const { data: v } = await admin
        .from("control_visitas")
        .select("id, paciente_id, pacientes(cedula)")
        .eq("id", visita_id)
        .maybeSingle();
      if (!v || (v as any).pacientes?.cedula !== cedula) {
        return jres({ error: "No autorizado" }, 403);
      }
      await admin.from("control_visitas").update({ estado: "cancelada" }).eq("id", visita_id);
      return jres({ ok: true });
    }

    return jres({ error: "Ruta no encontrada", available: ["/profesionales", "/disponibilidad", "/agendar", "/mis-citas", "/cancelar"] }, 404);
  } catch (e: any) {
    return jres({ error: e.message ?? "Error interno" }, 500);
  }
});
