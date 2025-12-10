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
