import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Iniciando cron de recordatorios diarios...");

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const ahora = new Date();
    
    // Definir rangos para los diferentes tipos de recordatorio
    const rangos = {
      "3_dias": {
        inicio: new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000),
        fin: new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000),
      },
      "1_dia": {
        inicio: new Date(ahora.getTime() + 24 * 60 * 60 * 1000),
        fin: new Date(ahora.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      "2_horas": {
        inicio: new Date(ahora.getTime() + 2 * 60 * 60 * 1000),
        fin: new Date(ahora.getTime() + 3 * 60 * 60 * 1000),
      },
    };

    // Obtener plantilla de recordatorio por defecto
    const { data: plantilla } = await supabaseClient
      .from("plantillas_correo")
      .select("*")
      .eq("tipo", "recordatorio")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!plantilla) {
      console.warn("No se encontró plantilla de recordatorio activa");
      return new Response(
        JSON.stringify({ success: false, error: "No hay plantilla de recordatorio activa" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Obtener configuración del sistema
    const { data: configData } = await supabaseClient
      .from("configuracion_sistema")
      .select("*");

    const config = configData?.reduce((acc, item) => {
      acc[item.clave] = item.valor;
      return acc;
    }, {} as any) || {};

    const resultados = {
      "3_dias": { llamadas: 0, visitas: 0, omitidos: 0, errores: [] as string[] },
      "1_dia": { llamadas: 0, visitas: 0, omitidos: 0, errores: [] as string[] },
      "2_horas": { llamadas: 0, visitas: 0, omitidos: 0, errores: [] as string[] },
      reintentos: { exitosos: 0, fallidos: 0 },
    };

    // Procesar cada tipo de recordatorio
    for (const [tipoRecordatorio, rango] of Object.entries(rangos)) {
      rango.inicio.setHours(0, 0, 0, 0);
      rango.fin.setHours(23, 59, 59, 999);

      console.log(`Buscando citas para ${tipoRecordatorio}: ${rango.inicio.toISOString()} - ${rango.fin.toISOString()}`);

      // Verificar si ya se envió recordatorio de este tipo para estas citas
      const { data: historialExistente } = await supabaseClient
        .from("historial_recordatorios")
        .select("cita_id")
        .eq("tipo_recordatorio", tipoRecordatorio)
        .eq("estado", "enviado");

      const citasYaEnviadas = new Set(historialExistente?.map(h => h.cita_id) || []);

      // Obtener llamadas usando la relación correcta
      const { data: llamadas, error: llamadasError } = await supabaseClient
        .from("registro_llamadas")
        .select(`
          *,
          pacientes!registro_llamadas_paciente_id_fkey(*),
          personal_salud!registro_llamadas_profesional_id_fkey(*)
        `)
        .gte("fecha_agendada", rango.inicio.toISOString())
        .lte("fecha_agendada", rango.fin.toISOString())
        .eq("estado", "agendada");

      if (llamadasError) {
        console.error("Error al obtener llamadas:", llamadasError);
      }

      // Obtener visitas usando la relación correcta
      const { data: visitas, error: visitasError } = await supabaseClient
        .from("control_visitas")
        .select(`
          *,
          pacientes!control_visitas_paciente_id_fkey(*),
          personal_salud!control_visitas_profesional_id_fkey(*)
        `)
        .gte("fecha_hora_visita", rango.inicio.toISOString())
        .lte("fecha_hora_visita", rango.fin.toISOString())
        .eq("estado", "pendiente");

      if (visitasError) {
        console.error("Error al obtener visitas:", visitasError);
      }

      console.log(`${tipoRecordatorio}: ${llamadas?.length || 0} llamadas, ${visitas?.length || 0} visitas`);

      // Procesar llamadas
      for (const llamada of llamadas || []) {
        if (citasYaEnviadas.has(llamada.id)) {
          resultados[tipoRecordatorio as keyof typeof rangos].omitidos++;
          continue;
        }

        try {
          const resultado = await enviarRecordatorio(
            supabaseClient,
            "llamada",
            llamada,
            llamada.pacientes,
            llamada.personal_salud,
            plantilla,
            config,
            tipoRecordatorio as "3_dias" | "1_dia" | "2_horas"
          );
          
          if (resultado.enviado) {
            resultados[tipoRecordatorio as keyof typeof rangos].llamadas++;
          } else {
            resultados[tipoRecordatorio as keyof typeof rangos].omitidos++;
          }
        } catch (error: any) {
          resultados[tipoRecordatorio as keyof typeof rangos].errores.push(`Llamada ${llamada.id}: ${error.message}`);
        }
      }

      // Procesar visitas
      for (const visita of visitas || []) {
        if (citasYaEnviadas.has(visita.id)) {
          resultados[tipoRecordatorio as keyof typeof rangos].omitidos++;
          continue;
        }

        try {
          const resultado = await enviarRecordatorio(
            supabaseClient,
            "visita",
            visita,
            visita.pacientes,
            visita.personal_salud,
            plantilla,
            config,
            tipoRecordatorio as "3_dias" | "1_dia" | "2_horas"
          );
          
          if (resultado.enviado) {
            resultados[tipoRecordatorio as keyof typeof rangos].visitas++;
          } else {
            resultados[tipoRecordatorio as keyof typeof rangos].omitidos++;
          }
        } catch (error: any) {
          resultados[tipoRecordatorio as keyof typeof rangos].errores.push(`Visita ${visita.id}: ${error.message}`);
        }
      }
    }

    // Procesar reintentos pendientes
    const { data: pendientesReintento } = await supabaseClient
      .from("historial_recordatorios")
      .select("*")
      .eq("estado", "reintentando")
      .lt("proximo_reintento", ahora.toISOString())
      .lt("intentos", 3);

    for (const pendiente of pendientesReintento || []) {
      try {
        // Invocar la función de envío con flag de reintento
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-recordatorio-cita`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            tipo: pendiente.tipo_cita,
            citaId: pendiente.cita_id,
            plantillaId: pendiente.plantilla_id,
            tipoRecordatorio: pendiente.tipo_recordatorio,
            esReintento: true,
            historialId: pendiente.id,
          }),
        });

        if (response.ok) {
          resultados.reintentos.exitosos++;
        } else {
          // Actualizar intentos y programar nuevo reintento
          const nuevoReintento = new Date();
          nuevoReintento.setMinutes(nuevoReintento.getMinutes() + 30 * pendiente.intentos);

          if (pendiente.intentos >= 2) {
            // Marcar como fallido definitivamente
            await supabaseClient
              .from("historial_recordatorios")
              .update({ estado: "fallido", intentos: pendiente.intentos + 1 })
              .eq("id", pendiente.id);
          } else {
            await supabaseClient
              .from("historial_recordatorios")
              .update({
                intentos: pendiente.intentos + 1,
                proximo_reintento: nuevoReintento.toISOString(),
              })
              .eq("id", pendiente.id);
          }
          resultados.reintentos.fallidos++;
        }
      } catch (error: any) {
        console.error(`Error en reintento ${pendiente.id}:`, error);
        resultados.reintentos.fallidos++;
      }
    }

    console.log("Resultados del cron:", resultados);

    return new Response(
      JSON.stringify({ 
        success: true,
        mensaje: "Cron de recordatorios completado",
        resultados
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error en cron de recordatorios:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function enviarRecordatorio(
  supabase: any,
  tipo: "llamada" | "visita",
  cita: any,
  paciente: any,
  profesional: any,
  plantilla: any,
  config: any,
  tipoRecordatorio: "3_dias" | "1_dia" | "2_horas"
): Promise<{ enviado: boolean; mensaje: string }> {
  if (!paciente?.notificaciones_activas) {
    console.log(`Paciente ${paciente?.id} tiene notificaciones desactivadas`);
    return { enviado: false, mensaje: "Notificaciones desactivadas" };
  }

  const emailsToSend: string[] = [];
  
  if (paciente.email_px) emailsToSend.push(paciente.email_px);
  if (paciente.email_cuidador) emailsToSend.push(paciente.email_cuidador);

  if (emailsToSend.length === 0) {
    if (paciente.contacto_px?.includes("@")) emailsToSend.push(paciente.contacto_px);
    else if (paciente.contacto_cuidador?.includes("@")) emailsToSend.push(paciente.contacto_cuidador);
  }

  if (emailsToSend.length === 0) {
    console.log(`Paciente ${paciente?.id} no tiene emails configurados`);
    return { enviado: false, mensaje: "Sin emails" };
  }

  const token = btoa(cita.id);
  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "";
  const urlConfirmar = `${baseUrl}/confirmar-cita?token=${token}&tipo=${tipo}`;
  const urlReagendar = `${baseUrl}/confirmar-cita?token=${token}&tipo=${tipo}&reagendar=true`;

  const fechaCita = tipo === "llamada" ? cita.fecha_agendada : cita.fecha_hora_visita;
  const fecha = fechaCita ? new Date(fechaCita) : new Date();
  const { timezone, locale } = await resolveWorkspaceLocale(supabase, cita.workspace_id);
  const citaFecha = formatDateInTz(fecha, timezone, locale);
  const citaHora = formatTimeInTz(fecha, timezone, locale);

  const variables: Record<string, string> = {
    "{{Logo_URL}}": config.logo_url || "",
    "{{Nombre_Centro}}": config.nombre_centro || "Centro Médico",
    "{{Color_Primario}}": config.color_primario || "#3b82f6",
    "{{Color_Secundario}}": config.color_secundario || "#1e40af",
    "{{Paciente_Nombre}}": `${paciente.nombre} ${paciente.apellido}`,
    "{{Cita_Fecha}}": citaFecha,
    "{{Cita_Hora}}": citaHora,
    "{{Profesional_Nombre}}": profesional ? `${profesional.nombre} ${profesional.apellido}` : "No asignado",
    "{{Profesional_Especialidad}}": profesional?.especialidad || "",
    "{{Sede_Direccion}}": config.sede_direccion || "",
    "{{Telefono_Centro}}": config.telefono_centro || "",
    "{{URL_Confirmar}}": urlConfirmar,
    "{{URL_Reagendar}}": urlReagendar,
    "{{Anio}}": new Date().getFullYear().toString(),
    "{{Notas_Preparacion}}": tipo === "llamada" ? cita.notas_adicionales || "" : cita.notas_visita || "",
    "{{Tipo_Visita}}": tipo === "visita" ? (cita.tipo_visita === "domicilio" ? "Visita a Domicilio" : "Consulta Ambulatoria") : "Llamada",
  };

  let contenidoHtml = plantilla.contenido_html;
  let asunto = plantilla.asunto;

  Object.entries(variables).forEach(([key, value]) => {
    contenidoHtml = contenidoHtml.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    asunto = asunto.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  });

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: config.email_remitente || "Centro Médico <onboarding@resend.dev>",
      to: emailsToSend,
      subject: asunto,
      html: contenidoHtml,
    }),
  });

  if (!emailResponse.ok) {
    const errorData = await emailResponse.text();
    console.error("Error de Resend:", errorData);
    
    // Crear registro con error y programar reintento
    const proximoReintento = new Date();
    proximoReintento.setMinutes(proximoReintento.getMinutes() + 15);

    await supabase
      .from("historial_recordatorios")
      .insert({
        tipo_cita: tipo,
        cita_id: cita.id,
        paciente_id: paciente.id,
        profesional_id: profesional?.id,
        plantilla_id: plantilla.id,
        destinatarios: emailsToSend,
        canal: "email",
        estado: "reintentando",
        intentos: 1,
        proximo_reintento: proximoReintento.toISOString(),
        error_mensaje: errorData,
        tipo_recordatorio: tipoRecordatorio,
      });

    throw new Error(`Error al enviar correo: ${errorData}`);
  }

  // Guardar en historial
  await supabase
    .from("historial_recordatorios")
    .insert({
      tipo_cita: tipo,
      cita_id: cita.id,
      paciente_id: paciente.id,
      profesional_id: profesional?.id,
      plantilla_id: plantilla.id,
      destinatarios: emailsToSend,
      canal: "email",
      estado: "enviado",
      tipo_recordatorio: tipoRecordatorio,
    });

  // Marcar recordatorio enviado si es llamada
  if (tipo === "llamada") {
    await supabase
      .from("registro_llamadas")
      .update({ recordatorio_enviado: true })
      .eq("id", cita.id);
  }

  console.log(`Recordatorio ${tipoRecordatorio} enviado a ${emailsToSend.join(", ")} para ${tipo} ${cita.id}`);
  return { enviado: true, mensaje: "Enviado correctamente" };
}

serve(handler);
