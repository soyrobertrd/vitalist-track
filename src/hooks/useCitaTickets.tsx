import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface CitaTicket {
  id: string;
  workspace_id: string | null;
  tipo_cita: "visita" | "llamada";
  visita_id: string | null;
  llamada_id: string | null;
  paciente_id: string | null;
  codigo_corto: string;
  token: string;
  estado_checkin: "pendiente" | "llegado" | "atendido" | "no_show" | "cancelado";
  fecha_llegada: string | null;
  fecha_atencion: string | null;
  notas_checkin: string | null;
  enviado_whatsapp: boolean;
  enviado_email: boolean;
  impreso: boolean;
  created_at: string;
}

interface CrearTicketParams {
  tipo: "visita" | "llamada";
  citaId: string;
  pacienteId: string;
}

export function useCitaTickets() {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);

  const obtenerOCrearTicket = useCallback(
    async ({ tipo, citaId, pacienteId }: CrearTicketParams): Promise<CitaTicket | null> => {
      setLoading(true);
      try {
        const filterCol = tipo === "visita" ? "visita_id" : "llamada_id";
        const { data: existente } = await supabase
          .from("cita_tickets")
          .select("*")
          .eq(filterCol, citaId)
          .maybeSingle();

        if (existente) {
          setLoading(false);
          return existente as CitaTicket;
        }

        const { data, error } = await supabase
          .from("cita_tickets")
          .insert({
            tipo_cita: tipo,
            visita_id: tipo === "visita" ? citaId : null,
            llamada_id: tipo === "llamada" ? citaId : null,
            paciente_id: pacienteId,
            workspace_id: currentWorkspace?.id || null,
            codigo_corto: "", // será generado por el trigger
          } as any)
          .select()
          .single();

        if (error) throw error;
        return data as CitaTicket;
      } catch (e: any) {
        console.error(e);
        toast.error("Error al generar el ticket: " + e.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentWorkspace?.id]
  );

  const buscarPorCodigo = useCallback(async (codigo: string) => {
    const codigoLimpio = codigo.trim().toUpperCase();
    const { data, error } = await supabase
      .from("cita_tickets")
      .select(`
        *,
        pacientes:paciente_id (nombre, apellido, cedula, contacto_px, contacto_cuidador),
        visita:visita_id (fecha_hora_visita, tipo_visita, motivo_visita, estado, personal_salud:profesional_id (nombre, apellido)),
        llamada:llamada_id (fecha_agendada, motivo, estado, personal_salud:profesional_id (nombre, apellido))
      `)
      .eq("codigo_corto", codigoLimpio)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }, []);

  const buscarPorToken = useCallback(async (token: string) => {
    const { data, error } = await supabase
      .from("cita_tickets")
      .select(`
        *,
        pacientes:paciente_id (nombre, apellido, cedula, contacto_px, contacto_cuidador),
        visita:visita_id (fecha_hora_visita, tipo_visita, motivo_visita, estado, personal_salud:profesional_id (nombre, apellido)),
        llamada:llamada_id (fecha_agendada, motivo, estado, personal_salud:profesional_id (nombre, apellido))
      `)
      .eq("token", token)
      .maybeSingle();

    if (error) return null;
    return data;
  }, []);

  const marcarLlegada = useCallback(async (ticketId: string, notas?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("cita_tickets")
      .update({
        estado_checkin: "llegado",
        fecha_llegada: new Date().toISOString(),
        checkin_por: user?.id,
        notas_checkin: notas || null,
      })
      .eq("id", ticketId);

    if (error) {
      toast.error("Error al registrar llegada");
      return false;
    }
    toast.success("Llegada registrada");
    return true;
  }, []);

  const marcarAtendido = useCallback(async (ticketId: string) => {
    const { error } = await supabase
      .from("cita_tickets")
      .update({
        estado_checkin: "atendido",
        fecha_atencion: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (error) {
      toast.error("Error al marcar como atendido");
      return false;
    }
    toast.success("Paciente marcado como atendido");
    return true;
  }, []);

  const marcarNoShow = useCallback(async (ticketId: string) => {
    const { error } = await supabase
      .from("cita_tickets")
      .update({ estado_checkin: "no_show" })
      .eq("id", ticketId);

    if (error) {
      toast.error("Error");
      return false;
    }
    toast.success("Marcado como No-Show");
    return true;
  }, []);

  const marcarEnviado = useCallback(async (ticketId: string, canal: "whatsapp" | "email" | "impreso") => {
    const update: any = {};
    if (canal === "whatsapp") update.enviado_whatsapp = true;
    if (canal === "email") update.enviado_email = true;
    if (canal === "impreso") update.impreso = true;
    await supabase.from("cita_tickets").update(update).eq("id", ticketId);
  }, []);

  return {
    loading,
    obtenerOCrearTicket,
    buscarPorCodigo,
    buscarPorToken,
    marcarLlegada,
    marcarAtendido,
    marcarNoShow,
    marcarEnviado,
  };
}
