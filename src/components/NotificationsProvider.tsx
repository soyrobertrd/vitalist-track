import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, CheckCircle2, Calendar, Phone, Home } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export const NotificationsProvider = () => {
  const { profile } = useUserProfile();

  useEffect(() => {
    if (!profile?.id) return;

    // Request permission for push notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const showPushNotification = (title: string, body: string, icon?: string) => {
      // Show toast notification
      toast.info(title, { description: body, duration: 8000 });
      
      // Show browser push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/favicon.png',
          tag: `notification-${Date.now()}`,
          requireInteraction: true
        });
      }
    };

    // Subscribe to call insertions
    const llamadasChannel = supabase
      .channel('llamadas-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'registro_llamadas',
          filter: `profesional_id=eq.${profile.id}`
        },
        async (payload) => {
          const llamada = payload.new as any;
          
          const { data: paciente } = await supabase
            .from('pacientes')
            .select('nombre, apellido')
            .eq('id', llamada.paciente_id)
            .single();

          const fechaLlamada = new Date(llamada.fecha_agendada);
          const ahora = new Date();
          const diferenciaDias = Math.floor((fechaLlamada.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

          if (diferenciaDias <= 1 && diferenciaDias >= 0) {
            showPushNotification(
              `Nueva llamada programada`,
              `${paciente?.nombre} ${paciente?.apellido} - ${fechaLlamada.toLocaleDateString()}`
            );
          }
        }
      )
      .subscribe();

    // Subscribe to call confirmations and reschedules
    const llamadasConfirmacionChannel = supabase
      .channel('llamadas-confirmacion-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registro_llamadas'
        },
        async (payload) => {
          const llamada = payload.new as any;
          const oldLlamada = payload.old as any;
          
          // Check if confirmed via reminder
          if (llamada.confirmado_por_recordatorio && !oldLlamada.confirmado_por_recordatorio) {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', llamada.paciente_id)
              .single();

            showPushNotification(
              `¡Llamada confirmada!`,
              `${paciente?.nombre} ${paciente?.apellido} ha confirmado su cita telefónica`
            );
          }
          
          // Check if rescheduled
          if (llamada.estado === 'reagendada' && oldLlamada.estado !== 'reagendada') {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', llamada.paciente_id)
              .single();

            const nuevaFecha = new Date(llamada.fecha_agendada);
            showPushNotification(
              `Llamada reagendada`,
              `${paciente?.nombre} ${paciente?.apellido} - Nueva fecha: ${nuevaFecha.toLocaleDateString()}`
            );
          }
        }
      )
      .subscribe();

    // Subscribe to visit insertions
    const visitasChannel = supabase
      .channel('visitas-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'control_visitas',
          filter: `profesional_id=eq.${profile.id}`
        },
        async (payload) => {
          const visita = payload.new as any;
          
          const { data: paciente } = await supabase
            .from('pacientes')
            .select('nombre, apellido')
            .eq('id', visita.paciente_id)
            .single();

          const fechaVisita = new Date(visita.fecha_hora_visita);
          const ahora = new Date();
          const diferenciaDias = Math.floor((fechaVisita.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

          if (diferenciaDias <= 1 && diferenciaDias >= 0) {
            const tipoLabel = visita.tipo_visita === 'domicilio' ? 'domiciliaria' : 'ambulatoria';
            showPushNotification(
              `Nueva visita ${tipoLabel} programada`,
              `${paciente?.nombre} ${paciente?.apellido} - ${fechaVisita.toLocaleDateString()}`
            );
          }
        }
      )
      .subscribe();

    // Subscribe to ticket check-ins (paciente llegó a recepción)
    const ticketsChannel = supabase
      .channel('tickets-checkin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cita_tickets',
        },
        async (payload) => {
          const ticket = payload.new as any;
          const oldTicket = payload.old as any;

          // Solo notificar cuando cambia a "llegado"
          if (ticket.estado_checkin !== 'llegado' || oldTicket.estado_checkin === 'llegado') return;

          // Verificar si el profesional asignado a la cita es el usuario actual
          let profesionalId: string | null = null;
          let fechaCita: string | null = null;
          let tipoLabel = ticket.tipo_cita;

          if (ticket.tipo_cita === 'visita' && ticket.visita_id) {
            const { data: v } = await supabase
              .from('control_visitas')
              .select('profesional_id, fecha_hora_visita, tipo_visita')
              .eq('id', ticket.visita_id)
              .maybeSingle();
            profesionalId = v?.profesional_id ?? null;
            fechaCita = v?.fecha_hora_visita ?? null;
            tipoLabel = v?.tipo_visita === 'domicilio' ? 'visita domiciliaria' : 'visita';
          } else if (ticket.tipo_cita === 'llamada' && ticket.llamada_id) {
            const { data: l } = await supabase
              .from('registro_llamadas')
              .select('profesional_id, fecha_agendada')
              .eq('id', ticket.llamada_id)
              .maybeSingle();
            profesionalId = l?.profesional_id ?? null;
            fechaCita = l?.fecha_agendada ?? null;
            tipoLabel = 'llamada';
          }

          if (!profesionalId || profesionalId !== profile.id) return;

          const { data: paciente } = await supabase
            .from('pacientes')
            .select('nombre, apellido')
            .eq('id', ticket.paciente_id)
            .maybeSingle();

          const horaStr = fechaCita
            ? new Date(fechaCita).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
            : '';
          const tarde = fechaCita ? new Date(fechaCita).getTime() < Date.now() : false;

          const titulo = tarde
            ? `⚠️ Paciente llegó tarde`
            : `🟢 Paciente en recepción`;
          const cuerpo = `${paciente?.nombre ?? ''} ${paciente?.apellido ?? ''} — ${tipoLabel} a las ${horaStr}${tarde ? ' (cita ya pasada)' : ''}`;

          showPushNotification(titulo, cuerpo);
        }
      )
      .subscribe();

    // Subscribe to visit confirmations and reschedules
    const visitasConfirmacionChannel = supabase
      .channel('visitas-confirmacion-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'control_visitas'
        },
        async (payload) => {
          const visita = payload.new as any;
          const oldVisita = payload.old as any;
          
          // Check if confirmed via reminder
          if (visita.confirmado_por_recordatorio && !oldVisita.confirmado_por_recordatorio) {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', visita.paciente_id)
              .single();

            const tipoLabel = visita.tipo_visita === 'domicilio' ? 'domiciliaria' : 'ambulatoria';
            showPushNotification(
              `¡Visita ${tipoLabel} confirmada!`,
              `${paciente?.nombre} ${paciente?.apellido} ha confirmado su cita`
            );
          }
          
          // Check if rescheduled (date changed with reschedule note)
          if (visita.fecha_hora_visita !== oldVisita.fecha_hora_visita && 
              visita.notas_visita?.includes('Reagendada por paciente')) {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', visita.paciente_id)
              .single();

            const nuevaFecha = new Date(visita.fecha_hora_visita);
            const tipoLabel = visita.tipo_visita === 'domicilio' ? 'domiciliaria' : 'ambulatoria';
            showPushNotification(
              `Visita ${tipoLabel} reagendada`,
              `${paciente?.nombre} ${paciente?.apellido} - Nueva fecha: ${nuevaFecha.toLocaleDateString()}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(llamadasChannel);
      supabase.removeChannel(llamadasConfirmacionChannel);
      supabase.removeChannel(visitasChannel);
      supabase.removeChannel(visitasConfirmacionChannel);
    };
  }, [profile?.id]);

  return null;
};
