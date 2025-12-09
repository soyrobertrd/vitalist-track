import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, CheckCircle2, Calendar } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface Notificacion {
  id: string;
  tipo: 'llamada' | 'visita';
  mensaje: string;
  paciente_nombre?: string;
  fecha_hora: string;
}

export const NotificationsProvider = () => {
  const { profile } = useUserProfile();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    // Suscribirse a cambios en llamadas (nuevas)
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
            toast.info(
              `Llamada próxima con ${paciente?.nombre} ${paciente?.apellido}`,
              {
                description: `Fecha: ${fechaLlamada.toLocaleDateString()} ${fechaLlamada.toLocaleTimeString()}`,
                icon: <Bell className="h-4 w-4" />,
                duration: 5000,
              }
            );
          }
        }
      )
      .subscribe();

    // Suscribirse a confirmaciones de llamadas
    const llamadasConfirmacionChannel = supabase
      .channel('llamadas-confirmacion-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registro_llamadas',
          filter: `profesional_id=eq.${profile.id}`
        },
        async (payload) => {
          const llamada = payload.new as any;
          const oldLlamada = payload.old as any;
          
          // Verificar si se confirmó por recordatorio
          if (llamada.confirmado_por_recordatorio && !oldLlamada.confirmado_por_recordatorio) {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', llamada.paciente_id)
              .single();

            toast.success(
              `¡Llamada confirmada!`,
              {
                description: `${paciente?.nombre} ${paciente?.apellido} ha confirmado su llamada`,
                icon: <CheckCircle2 className="h-4 w-4" />,
                duration: 8000,
              }
            );
          }
          
          // Verificar si se reagendó
          if (llamada.estado === 'reagendada' && oldLlamada.estado !== 'reagendada') {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', llamada.paciente_id)
              .single();

            const nuevaFecha = new Date(llamada.fecha_agendada);
            toast.info(
              `Llamada reagendada`,
              {
                description: `${paciente?.nombre} ${paciente?.apellido} ha solicitado reagendar para ${nuevaFecha.toLocaleDateString()}`,
                icon: <Calendar className="h-4 w-4" />,
                duration: 8000,
              }
            );
          }
        }
      )
      .subscribe();

    // Suscribirse a cambios en visitas (nuevas)
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
            toast.info(
              `Visita próxima con ${paciente?.nombre} ${paciente?.apellido}`,
              {
                description: `Fecha: ${fechaVisita.toLocaleDateString()} ${fechaVisita.toLocaleTimeString()}`,
                icon: <Bell className="h-4 w-4" />,
                duration: 5000,
              }
            );
          }
        }
      )
      .subscribe();

    // Suscribirse a confirmaciones de visitas
    const visitasConfirmacionChannel = supabase
      .channel('visitas-confirmacion-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'control_visitas',
          filter: `profesional_id=eq.${profile.id}`
        },
        async (payload) => {
          const visita = payload.new as any;
          const oldVisita = payload.old as any;
          
          // Verificar si se confirmó por recordatorio
          if (visita.confirmado_por_recordatorio && !oldVisita.confirmado_por_recordatorio) {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', visita.paciente_id)
              .single();

            toast.success(
              `¡Visita confirmada!`,
              {
                description: `${paciente?.nombre} ${paciente?.apellido} ha confirmado su visita`,
                icon: <CheckCircle2 className="h-4 w-4" />,
                duration: 8000,
              }
            );
          }
          
          // Verificar si se reagendó (cambio de fecha)
          if (visita.fecha_hora_visita !== oldVisita.fecha_hora_visita && visita.notas_visita?.includes('Reagendada por paciente')) {
            const { data: paciente } = await supabase
              .from('pacientes')
              .select('nombre, apellido')
              .eq('id', visita.paciente_id)
              .single();

            const nuevaFecha = new Date(visita.fecha_hora_visita);
            toast.info(
              `Visita reagendada`,
              {
                description: `${paciente?.nombre} ${paciente?.apellido} ha solicitado reagendar para ${nuevaFecha.toLocaleDateString()}`,
                icon: <Calendar className="h-4 w-4" />,
                duration: 8000,
              }
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
