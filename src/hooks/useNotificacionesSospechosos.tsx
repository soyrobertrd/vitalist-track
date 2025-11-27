import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CriterioIngreso {
  minLlamadas: number;
  minVisitas: number;
  diasSeguimiento: number;
}

const CRITERIOS_DEFAULT: CriterioIngreso = {
  minLlamadas: 3,
  minVisitas: 1,
  diasSeguimiento: 30,
};

export function useNotificacionesSospechosos() {
  const { data: candidatos } = useQuery({
    queryKey: ["candidatos-ingreso"],
    queryFn: async () => {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - CRITERIOS_DEFAULT.diasSeguimiento);

      const { data: sospechosos, error } = await supabase
        .from("pacientes")
        .select(`
          *,
          llamadas:registro_llamadas(id, estado),
          visitas:control_visitas(id, estado)
        `)
        .eq("es_sospechoso", true)
        .lte("created_at", fechaLimite.toISOString());

      if (error) throw error;

      return sospechosos?.filter((paciente: any) => {
        const llamadasRealizadas = paciente.llamadas?.filter(
          (l: any) => l.estado === "realizada"
        ).length || 0;
        
        const visitasRealizadas = paciente.visitas?.filter(
          (v: any) => v.estado === "realizada"
        ).length || 0;

        return (
          llamadasRealizadas >= CRITERIOS_DEFAULT.minLlamadas &&
          visitasRealizadas >= CRITERIOS_DEFAULT.minVisitas
        );
      });
    },
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  useEffect(() => {
    if (candidatos && candidatos.length > 0) {
      candidatos.forEach((paciente: any) => {
        toast.info(
          `El paciente ${paciente.nombre} ${paciente.apellido} cumple criterios para ingreso al programa`,
          {
            description: "Revisar historial de seguimiento para evaluar ingreso",
            duration: 10000,
          }
        );
      });
    }
  }, [candidatos]);

  return { candidatos };
}
