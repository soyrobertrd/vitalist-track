import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";
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

    // Suscribirse a cambios en llamadas
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
          
          // Obtener datos del paciente
          const { data: paciente } = await supabase
            .from('pacientes')
            .select('nombre, apellido')
            .eq('id', llamada.paciente_id)
            .single();

          const fechaLlamada = new Date(llamada.fecha_agendada);
          const ahora = new Date();
          const diferenciaDias = Math.floor((fechaLlamada.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

          // Notificar si la llamada es en las próximas 24 horas
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

    // Suscribirse a cambios en visitas
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
          
          // Obtener datos del paciente
          const { data: paciente } = await supabase
            .from('pacientes')
            .select('nombre, apellido')
            .eq('id', visita.paciente_id)
            .single();

          const fechaVisita = new Date(visita.fecha_hora_visita);
          const ahora = new Date();
          const diferenciaDias = Math.floor((fechaVisita.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

          // Notificar si la visita es en las próximas 24 horas
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

    return () => {
      supabase.removeChannel(llamadasChannel);
      supabase.removeChannel(visitasChannel);
    };
  }, [profile?.id]);

  return null;
};
