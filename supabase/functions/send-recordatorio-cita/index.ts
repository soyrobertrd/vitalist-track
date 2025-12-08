import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecordatorioRequest {
  tipo: "llamada" | "visita";
  citaId: string;
  plantillaId?: string;
  destinatarios?: string[];
  tipoRecordatorio?: "3_dias" | "1_dia" | "2_horas";
  canal?: "email" | "whatsapp";
  esReintento?: boolean;
  historialId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { 
      tipo, 
      citaId, 
      plantillaId, 
      destinatarios = ["paciente"],
      tipoRecordatorio = "1_dia",
      canal = "email",
      esReintento = false,
      historialId
    }: RecordatorioRequest = await req.json();

    console.log("Procesando recordatorio:", { tipo, citaId, plantillaId, destinatarios, tipoRecordatorio, canal });

    // Obtener datos de la cita usando la relación correcta
    let cita, paciente, profesional;
    
    if (tipo === "llamada") {
      const { data, error } = await supabaseClient
        .from("registro_llamadas")
        .select(`
          *,
          pacientes!registro_llamadas_paciente_id_fkey(*),
          personal_salud!registro_llamadas_profesional_id_fkey(*)
        `)
        .eq("id", citaId)
        .single();

      if (error) {
        console.error("Error al obtener llamada:", error);
        throw error;
      }
      cita = data;
      paciente = data.pacientes;
      profesional = data.personal_salud;
    } else {
      const { data, error } = await supabaseClient
        .from("control_visitas")
        .select(`
          *,
          pacientes!control_visitas_paciente_id_fkey(*),
          personal_salud!control_visitas_profesional_id_fkey(*)
        `)
        .eq("id", citaId)
        .single();

      if (error) {
        console.error("Error al obtener visita:", error);
        throw error;
      }
      cita = data;
      paciente = data.pacientes;
      profesional = data.personal_salud;
    }

    // Verificar si el paciente tiene notificaciones activas
    if (!paciente?.notificaciones_activas) {
      console.log("Paciente tiene notificaciones desactivadas, omitiendo envío");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notificaciones desactivadas para este paciente",
          skipped: true
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
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

    // Obtener plantilla de correo
    let plantilla;
    if (plantillaId) {
      const { data } = await supabaseClient
        .from("plantillas_correo")
        .select("*")
        .eq("id", plantillaId)
        .eq("activo", true)
        .single();
      plantilla = data;
    } else {
      // Buscar plantilla según tipo de visita
      const tipoVisita = tipo === "visita" && cita.tipo_visita;
      let query = supabaseClient
        .from("plantillas_correo")
        .select("*")
        .eq("tipo", "recordatorio")
        .eq("activo", true);

      if (tipoVisita) {
        query = query.eq("categoria", tipoVisita);
      }

      const { data } = await query.order("created_at", { ascending: false }).limit(1).single();
      
      // Si no hay plantilla específica, usar la genérica
      if (!data) {
        const { data: genericData } = await supabaseClient
          .from("plantillas_correo")
          .select("*")
          .eq("tipo", "recordatorio")
          .eq("activo", true)
          .is("categoria", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        plantilla = genericData;
      } else {
        plantilla = data;
      }
    }

    if (!plantilla) {
      throw new Error("No se encontró una plantilla de correo activa");
    }

    // Generar token para confirmación
    const token = btoa(citaId);
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

    // Reemplazar variables en el contenido HTML
    const variables = {
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

    // Recopilar emails de destinatarios
    const emailsToSend: string[] = [];
    
    if (destinatarios.includes("paciente") && paciente.email_px) {
      emailsToSend.push(paciente.email_px);
    }
    
    if (destinatarios.includes("cuidador") && paciente.email_cuidador) {
      emailsToSend.push(paciente.email_cuidador);
    }
    
    if (destinatarios.includes("profesional") && profesional?.email_contacto) {
      if (profesional.notificaciones_activas !== false) {
        emailsToSend.push(profesional.email_contacto);
      }
    }

    // Fallback
    if (emailsToSend.length === 0) {
      if (paciente.contacto_px?.includes("@")) {
        emailsToSend.push(paciente.contacto_px);
      } else if (paciente.contacto_cuidador?.includes("@")) {
        emailsToSend.push(paciente.contacto_cuidador);
      }
    }
    
    if (emailsToSend.length === 0) {
      throw new Error("No hay direcciones de correo válidas para enviar el recordatorio");
    }

    console.log("Enviando correo a:", emailsToSend);

    // Enviar el correo usando Resend API
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
      
      // Registrar error en historial y programar reintento
      if (esReintento && historialId) {
        // Get current attempts first
        const { data: currentRecord } = await supabaseClient
          .from("historial_recordatorios")
          .select("intentos")
          .eq("id", historialId)
          .single();
        
        await supabaseClient
          .from("historial_recordatorios")
          .update({
            estado: "fallido",
            error_mensaje: errorData,
            intentos: (currentRecord?.intentos || 0) + 1,
          })
          .eq("id", historialId);
      } else {
        // Crear registro con estado fallido y programar reintento
        const proximoReintento = new Date();
        proximoReintento.setMinutes(proximoReintento.getMinutes() + 15);

        await supabaseClient
          .from("historial_recordatorios")
          .insert({
            tipo_cita: tipo,
            cita_id: citaId,
            paciente_id: paciente.id,
            profesional_id: profesional?.id,
            plantilla_id: plantillaId || plantilla.id,
            destinatarios: emailsToSend,
            canal,
            estado: "reintentando",
            intentos: 1,
            max_intentos: 3,
            proximo_reintento: proximoReintento.toISOString(),
            error_mensaje: errorData,
            tipo_recordatorio: tipoRecordatorio,
          });
      }

      throw new Error(`Error al enviar correo: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Correo enviado exitosamente:", emailData);

    // Guardar en historial como enviado
    if (esReintento && historialId) {
      await supabaseClient
        .from("historial_recordatorios")
        .update({
          estado: "enviado",
          error_mensaje: null,
          enviado_at: new Date().toISOString(),
        })
        .eq("id", historialId);
    } else {
      await supabaseClient
        .from("historial_recordatorios")
        .insert({
          tipo_cita: tipo,
          cita_id: citaId,
          paciente_id: paciente.id,
          profesional_id: profesional?.id,
          plantilla_id: plantillaId || plantilla.id,
          destinatarios: emailsToSend,
          canal,
          estado: "enviado",
          tipo_recordatorio: tipoRecordatorio,
        });
    }

    // Marcar recordatorio como enviado si es llamada
    if (tipo === "llamada") {
      await supabaseClient
        .from("registro_llamadas")
        .update({ recordatorio_enviado: true })
        .eq("id", citaId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Correo enviado exitosamente",
        emailId: emailData.id,
        destinatarios: emailsToSend
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error en send-recordatorio-cita:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
