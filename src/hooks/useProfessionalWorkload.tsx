import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";

interface WorkloadData {
  profesionalId: string;
  profesionalNombre: string;
  fecha: string;
  totalLlamadas: number;
  totalVisitas: number;
  totalCitas: number;
  sobrecargado: boolean;
}

interface UseProfessionalWorkloadOptions {
  maxLlamadasDia?: number;
  maxVisitasDia?: number;
  maxTotalDia?: number;
}

export function useProfessionalWorkload(options: UseProfessionalWorkloadOptions = {}) {
  const { 
    maxLlamadasDia = 12, 
    maxVisitasDia = 6, 
    maxTotalDia = 15 
  } = options;
  
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [sobrecargados, setSobrecargados] = useState<WorkloadData[]>([]);
  const [loading, setLoading] = useState(true);

  const checkWorkload = async (fecha?: Date) => {
    setLoading(true);
    const targetDate = fecha || new Date();
    const fechaStr = format(targetDate, "yyyy-MM-dd");

    try {
      // Get calls per professional for the date
      const { data: llamadasData } = await supabase
        .from("registro_llamadas")
        .select(`
          profesional_id,
          personal_salud!inner(nombre, apellido)
        `)
        .eq("estado", "agendada")
        .gte("fecha_agendada", `${fechaStr}T00:00:00`)
        .lt("fecha_agendada", `${fechaStr}T23:59:59`);

      // Get visits per professional for the date
      const { data: visitasData } = await supabase
        .from("control_visitas")
        .select(`
          profesional_id,
          personal_salud!inner(nombre, apellido)
        `)
        .eq("estado", "pendiente")
        .gte("fecha_hora_visita", `${fechaStr}T00:00:00`)
        .lt("fecha_hora_visita", `${fechaStr}T23:59:59`);

      // Aggregate by professional
      const workloadMap = new Map<string, WorkloadData>();

      llamadasData?.forEach((item: any) => {
        const profId = item.profesional_id;
        const existing = workloadMap.get(profId) || {
          profesionalId: profId,
          profesionalNombre: `${item.personal_salud.nombre} ${item.personal_salud.apellido}`,
          fecha: fechaStr,
          totalLlamadas: 0,
          totalVisitas: 0,
          totalCitas: 0,
          sobrecargado: false,
        };
        existing.totalLlamadas++;
        existing.totalCitas++;
        workloadMap.set(profId, existing);
      });

      visitasData?.forEach((item: any) => {
        const profId = item.profesional_id;
        const existing = workloadMap.get(profId) || {
          profesionalId: profId,
          profesionalNombre: `${item.personal_salud.nombre} ${item.personal_salud.apellido}`,
          fecha: fechaStr,
          totalLlamadas: 0,
          totalVisitas: 0,
          totalCitas: 0,
          sobrecargado: false,
        };
        existing.totalVisitas++;
        existing.totalCitas++;
        workloadMap.set(profId, existing);
      });

      // Check for overload
      const results = Array.from(workloadMap.values()).map((data) => ({
        ...data,
        sobrecargado:
          data.totalLlamadas > maxLlamadasDia ||
          data.totalVisitas > maxVisitasDia ||
          data.totalCitas > maxTotalDia,
      }));

      setWorkloadData(results);
      setSobrecargados(results.filter((r) => r.sobrecargado));
    } catch (error) {
      console.error("Error checking workload:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkWorkload();
  }, []);

  return {
    workloadData,
    sobrecargados,
    loading,
    checkWorkload,
    maxLlamadasDia,
    maxVisitasDia,
    maxTotalDia,
  };
}
