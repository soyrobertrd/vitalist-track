import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";

interface ProfessionalScore {
  profesionalId: string;
  nombre: string;
  score: number;
  reasons: string[];
  workload: {
    llamadas: number;
    visitas: number;
    total: number;
  };
}

interface AutoAssignResult {
  recommended: ProfessionalScore | null;
  alternatives: ProfessionalScore[];
  reason: string;
}

interface UseAutoAssignOptions {
  maxWorkloadPerDay?: number;
  zoneWeight?: number;
  workloadWeight?: number;
  availabilityWeight?: number;
}

export function useAutoAssignProfessional(options: UseAutoAssignOptions = {}) {
  const {
    maxWorkloadPerDay = 15,
    zoneWeight = 40,
    workloadWeight = 35,
    availabilityWeight = 25,
  } = options;

  const [loading, setLoading] = useState(false);

  const getWorkloadForDate = async (profesionalId: string, fecha: Date) => {
    const fechaStr = format(fecha, "yyyy-MM-dd");

    const [llamadasRes, visitasRes] = await Promise.all([
      supabase
        .from("registro_llamadas")
        .select("id")
        .eq("profesional_id", profesionalId)
        .eq("estado", "agendada")
        .gte("fecha_agendada", `${fechaStr}T00:00:00`)
        .lt("fecha_agendada", `${fechaStr}T23:59:59`),
      supabase
        .from("control_visitas")
        .select("id")
        .eq("profesional_id", profesionalId)
        .eq("estado", "pendiente")
        .gte("fecha_hora_visita", `${fechaStr}T00:00:00`)
        .lt("fecha_hora_visita", `${fechaStr}T23:59:59`),
    ]);

    return {
      llamadas: llamadasRes.data?.length || 0,
      visitas: visitasRes.data?.length || 0,
      total: (llamadasRes.data?.length || 0) + (visitasRes.data?.length || 0),
    };
  };

  const checkAvailability = async (profesionalId: string, fecha: Date) => {
    const fechaStr = format(fecha, "yyyy-MM-dd");
    const diaSemana = fecha.getDay();

    // Check absences
    const { data: ausencias } = await supabase
      .from("ausencias_profesionales")
      .select("*")
      .eq("profesional_id", profesionalId)
      .lte("fecha_inicio", fechaStr)
      .gte("fecha_fin", fechaStr);

    if (ausencias && ausencias.length > 0) {
      return { available: false, reason: "Ausencia registrada" };
    }

    // Check work schedule
    const { data: horarios } = await supabase
      .from("horarios_profesionales")
      .select("*")
      .eq("profesional_id", profesionalId)
      .eq("dia_semana", diaSemana)
      .eq("activo", true);

    if (!horarios || horarios.length === 0) {
      return { available: false, reason: "Sin horario para este día" };
    }

    return { available: true, reason: "" };
  };

  const suggestProfessional = useCallback(
    async (
      pacienteZona: string | null,
      pacienteBarrio: string | null,
      fecha: Date,
      excludeProfesionalIds: string[] = []
    ): Promise<AutoAssignResult> => {
      setLoading(true);

      try {
        // Get all active professionals
        const { data: profesionales } = await supabase
          .from("personal_salud")
          .select("*")
          .eq("activo", true)
          .in("especialidad", ["Médico", "Enfermera", "Medico Internista"]);

        if (!profesionales || profesionales.length === 0) {
          return {
            recommended: null,
            alternatives: [],
            reason: "No hay profesionales activos disponibles",
          };
        }

        const scores: ProfessionalScore[] = [];

        for (const prof of profesionales) {
          if (excludeProfesionalIds.includes(prof.id)) continue;

          const reasons: string[] = [];
          let score = 0;

          // 1. Zone matching
          if (pacienteZona && prof.zona) {
            if (prof.zona === pacienteZona) {
              score += zoneWeight;
              reasons.push("Misma zona");
            } else {
              score += zoneWeight * 0.3;
              reasons.push("Zona diferente");
            }
          } else {
            score += zoneWeight * 0.5;
          }

          // 2. Neighborhood matching (bonus)
          if (pacienteBarrio && prof.barrio && prof.barrio === pacienteBarrio) {
            score += 10;
            reasons.push("Mismo barrio");
          }

          // 3. Workload
          const workload = await getWorkloadForDate(prof.id, fecha);
          if (workload.total >= maxWorkloadPerDay) {
            score = 0;
            reasons.push("Sobrecargado");
          } else {
            const workloadRatio = 1 - workload.total / maxWorkloadPerDay;
            score += workloadWeight * workloadRatio;
            if (workload.total === 0) {
              reasons.push("Sin citas");
            } else if (workload.total < 5) {
              reasons.push("Carga baja");
            } else {
              reasons.push(`${workload.total} citas`);
            }
          }

          // 4. Availability
          const availability = await checkAvailability(prof.id, fecha);
          if (!availability.available) {
            score = 0;
            reasons.push(availability.reason);
          } else {
            score += availabilityWeight;
            reasons.push("Disponible");
          }

          if (score > 0) {
            scores.push({
              profesionalId: prof.id,
              nombre: `${prof.nombre} ${prof.apellido}`,
              score,
              reasons,
              workload,
            });
          }
        }

        // Sort by score
        scores.sort((a, b) => b.score - a.score);

        if (scores.length === 0) {
          return {
            recommended: null,
            alternatives: [],
            reason: "No hay profesionales disponibles para esta fecha",
          };
        }

        return {
          recommended: scores[0],
          alternatives: scores.slice(1, 4),
          reason: `Mejor opción: ${scores[0].nombre} (${scores[0].reasons.join(", ")})`,
        };
      } catch (error) {
        console.error("Error suggesting professional:", error);
        return {
          recommended: null,
          alternatives: [],
          reason: "Error al buscar profesionales",
        };
      } finally {
        setLoading(false);
      }
    },
    [maxWorkloadPerDay, zoneWeight, workloadWeight, availabilityWeight]
  );

  const autoAssignToPatient = useCallback(
    async (pacienteId: string): Promise<AutoAssignResult> => {
      // Get patient info
      const { data: paciente } = await supabase
        .from("pacientes")
        .select("zona, barrio")
        .eq("id", pacienteId)
        .single();

      if (!paciente) {
        return {
          recommended: null,
          alternatives: [],
          reason: "Paciente no encontrado",
        };
      }

      return suggestProfessional(
        paciente.zona,
        paciente.barrio,
        new Date(),
        []
      );
    },
    [suggestProfessional]
  );

  return {
    suggestProfessional,
    autoAssignToPatient,
    loading,
  };
}
