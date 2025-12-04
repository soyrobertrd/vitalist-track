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

    // Calcular el rango de mañana (24 horas desde ahora)
    const ahora = new Date();
    const mananaInicio = new Date(ahora);
    mananaInicio.setDate(mananaInicio.getDate() + 1);
    mananaInicio.setHours(0, 0, 0, 0);
    
    const mananaFin = new Date(mananaInicio);
    mananaFin.setHours(23, 59, 59, 999);

    console.log(`Buscando citas para mañana: ${mananaInicio.toISOString()} - ${mananaFin.toISOString()}`);

    // Obtener llamadas agendadas para mañana
    const { data: llamadas, error: llamadasError } = await supabaseClient
      .from("registro_llamadas")
      .select(`
        *,
        pacientes(*),
        personal_salud(*)
      `)
      .gte("fecha_agendada", mananaInicio.toISOString())
      .lte("fecha_agendada", mananaFin.toISOString())
      .eq("estado", "agendada")
      .eq("recordatorio_enviado", false);

    if (llamadasError) {
      console.error("Error al obtener llamadas:", llamadasError);
    }

    // Obtener visitas pendientes para mañana
    const { data: visitas, error: visitasError } = await supabaseClient
      .from("control_visitas")
      .select(`
        *,
        pacientes(*),
        personal_salud(*)
      `)
      .gte("fecha_hora_visita", mananaInicio.toISOString())
      .lte("fecha_hora_visita", mananaFin.toISOString())
      .eq("estado", "pendiente");

    if (visitasError) {
      console.error("Error al obtener visitas:", visitasError);
    }

    console.log(`Encontradas ${llamadas?.length || 0} llamadas y ${visitas?.length || 0} visitas para mañana`);

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
        JSON.stringify({ 
          success: false, 
          error: "No hay plantilla de recordatorio activa" 
        }),
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
      llamadasEnviadas: 0,
      llamadasOmitidas: 0,
      visitasEnviadas: 0,
      visitasOmitidas: 0,
      errores: [] as string[],
    };

    // Procesar llamadas
    for (const llamada of llamadas || []) {
      try {
        const resultado = await enviarRecordatorio(
          supabaseClient,
          "llamada",
          llamada,
          llamada.pacientes,
          llamada.personal_salud,
          plantilla,
          config
        );
        
        if (resultado.enviado) {
          resultados.llamadasEnviadas++;
          // Marcar como enviado
          await supabaseClient
            .from("registro_llamadas")
            .update({ recordatorio_enviado: true })
            .eq("id", llamada.id);
        } else {
          resultados.llamadasOmitidas++;
        }
      } catch (error: any) {
        resultados.errores.push(`Llamada ${llamada.id}: ${error.message}`);
      }
    }

    // Procesar visitas
    for (const visita of visitas || []) {
      try {
        const resultado = await enviarRecordatorio(
          supabaseClient,
          "visita",
          visita,
          visita.pacientes,
          visita.personal_salud,
          plantilla,
          config
        );
        
        if (resultado.enviado) {
          resultados.visitasEnviadas++;
        } else {
          resultados.visitasOmitidas++;
        }
      } catch (error: any) {
        resultados.errores.push(`Visita ${visita.id}: ${error.message}`);
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
  config: any
): Promise<{ enviado: boolean; mensaje: string }> {
  // Verificar si el paciente tiene notificaciones activas
  if (!paciente?.notificaciones_activas) {
    console.log(`Paciente ${paciente?.id} tiene notificaciones desactivadas`);
    return { enviado: false, mensaje: "Notificaciones desactivadas" };
  }

  // Recopilar emails
  const emailsToSend: string[] = [];
  
  if (paciente.email_px) {
    emailsToSend.push(paciente.email_px);
  }
  
  if (paciente.email_cuidador) {
    emailsToSend.push(paciente.email_cuidador);
  }

  // Fallback a campos de contacto si tienen formato email
  if (emailsToSend.length === 0) {
    if (paciente.contacto_px?.includes("@")) {
      emailsToSend.push(paciente.contacto_px);
    } else if (paciente.contacto_cuidador?.includes("@")) {
      emailsToSend.push(paciente.contacto_cuidador);
    }
  }

  if (emailsToSend.length === 0) {
    console.log(`Paciente ${paciente?.id} no tiene emails configurados`);
    return { enviado: false, mensaje: "Sin emails" };
  }

  // Generar token para confirmación
  const token = btoa(cita.id);
  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "";
  const urlConfirmar = `${baseUrl}/confirmar-cita?token=${token}&tipo=${tipo}`;
  const urlReagendar = `${baseUrl}/confirmar-cita?token=${token}&tipo=${tipo}&reagendar=true`;

  // Extraer fecha y hora
  const fechaCita = tipo === "llamada" ? cita.fecha_agendada : cita.fecha_hora_visita;
  const fecha = fechaCita ? new Date(fechaCita) : new Date();
  const citaFecha = fecha.toLocaleDateString("es-DO", { 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  });
  const citaHora = fecha.toLocaleTimeString("es-DO", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });

  // Reemplazar variables
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
  };

  let contenidoHtml = plantilla.contenido_html;
  let asunto = plantilla.asunto;

  Object.entries(variables).forEach(([key, value]) => {
    contenidoHtml = contenidoHtml.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    asunto = asunto.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  });

  // Enviar correo
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
    throw new Error(`Error al enviar correo: ${errorData}`);
  }

  console.log(`Recordatorio enviado a ${emailsToSend.join(", ")} para ${tipo} ${cita.id}`);
  return { enviado: true, mensaje: "Enviado correctamente" };
}

serve(handler);
