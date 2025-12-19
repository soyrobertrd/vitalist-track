import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isSameDay, parseISO, setHours, setMinutes } from "date-fns";

interface TimeSlot {
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  profesionalId: string;
  profesionalNombre: string;
}

interface Conflict {
  id: string;
  tipo: "llamada" | "visita";
  fecha: Date;
  profesional: string;
  paciente: string;
  motivo: string;
}

interface RescheduleSuggestion {
  slot: TimeSlot;
  reason: string;
  priority: number;
}

export function useSmartRescheduling() {
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const detectConflicts = useCallback(
    async (
      profesionalId: string,
      fecha: Date,
      horaInicio: string,
      duracionMinutos: number = 30
    ): Promise<Conflict[]> => {
      setLoading(true);
      const fechaStr = format(fecha, "yyyy-MM-dd");
      const startTime = new Date(`${fechaStr}T${horaInicio}`);
      const endTime = new Date(startTime.getTime() + duracionMinutos * 60000);

      try {
        const [llamadasRes, visitasRes] = await Promise.all([
          supabase
            .from("registro_llamadas")
            .select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido)")
            .eq("profesional_id", profesionalId)
            .eq("estado", "agendada")
            .gte("fecha_agendada", `${fechaStr}T00:00:00`)
            .lt("fecha_agendada", `${fechaStr}T23:59:59`),
          supabase
            .from("control_visitas")
            .select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido)")
            .eq("profesional_id", profesionalId)
            .eq("estado", "pendiente")
            .gte("fecha_hora_visita", `${fechaStr}T00:00:00`)
            .lt("fecha_hora_visita", `${fechaStr}T23:59:59`),
        ]);

        const foundConflicts: Conflict[] = [];

        // Check calls
        llamadasRes.data?.forEach((llamada: any) => {
          const llamadaTime = new Date(llamada.fecha_agendada);
          const llamadaEnd = new Date(
            llamadaTime.getTime() + (llamada.duracion_estimada || 15) * 60000
          );

          if (
            (startTime >= llamadaTime && startTime < llamadaEnd) ||
            (endTime > llamadaTime && endTime <= llamadaEnd) ||
            (startTime <= llamadaTime && endTime >= llamadaEnd)
          ) {
            foundConflicts.push({
              id: llamada.id,
              tipo: "llamada",
              fecha: llamadaTime,
              profesional: llamada.personal_salud
                ? `${llamada.personal_salud.nombre} ${llamada.personal_salud.apellido}`
                : "Sin asignar",
              paciente: llamada.pacientes
                ? `${llamada.pacientes.nombre} ${llamada.pacientes.apellido}`
                : "Sin paciente",
              motivo: llamada.motivo || "Sin motivo",
            });
          }
        });

        // Check visits
        visitasRes.data?.forEach((visita: any) => {
          const visitaTime = new Date(visita.fecha_hora_visita);
          const visitaEnd = new Date(visitaTime.getTime() + 60 * 60000); // 1 hour for visits

          if (
            (startTime >= visitaTime && startTime < visitaEnd) ||
            (endTime > visitaTime && endTime <= visitaEnd) ||
            (startTime <= visitaTime && endTime >= visitaEnd)
          ) {
            foundConflicts.push({
              id: visita.id,
              tipo: "visita",
              fecha: visitaTime,
              profesional: visita.personal_salud
                ? `${visita.personal_salud.nombre} ${visita.personal_salud.apellido}`
                : "Sin asignar",
              paciente: visita.pacientes
                ? `${visita.pacientes.nombre} ${visita.pacientes.apellido}`
                : "Sin paciente",
              motivo: visita.motivo_visita || "Sin motivo",
            });
          }
        });

        setConflicts(foundConflicts);
        return foundConflicts;
      } catch (error) {
        console.error("Error detecting conflicts:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const findAvailableSlots = useCallback(
    async (
      profesionalId: string,
      startDate: Date,
      daysToSearch: number = 7,
      duracionMinutos: number = 30
    ): Promise<TimeSlot[]> => {
      setLoading(true);
      const slots: TimeSlot[] = [];

      try {
        // Get professional info
        const { data: profesional } = await supabase
          .from("personal_salud")
          .select("nombre, apellido")
          .eq("id", profesionalId)
          .single();

        // Get work schedule
        const { data: horarios } = await supabase
          .from("horarios_profesionales")
          .select("*")
          .eq("profesional_id", profesionalId)
          .eq("activo", true);

        // Get holidays
        const { data: feriados } = await supabase
          .from("dias_no_laborables")
          .select("fecha");

        const feriadosSet = new Set(feriados?.map((f) => f.fecha) || []);

        for (let i = 0; i < daysToSearch; i++) {
          const currentDate = addDays(startDate, i);
          const fechaStr = format(currentDate, "yyyy-MM-dd");
          const diaSemana = currentDate.getDay();

          // Skip holidays
          if (feriadosSet.has(fechaStr)) continue;

          // Get schedule for this day
          const horarioDia = horarios?.find((h) => h.dia_semana === diaSemana);
          if (!horarioDia) continue;

          // Check absences
          const { data: ausencias } = await supabase
            .from("ausencias_profesionales")
            .select("id")
            .eq("profesional_id", profesionalId)
            .lte("fecha_inicio", fechaStr)
            .gte("fecha_fin", fechaStr);

          if (ausencias && ausencias.length > 0) continue;

          // Get existing appointments
          const [llamadasRes, visitasRes] = await Promise.all([
            supabase
              .from("registro_llamadas")
              .select("fecha_agendada, duracion_estimada")
              .eq("profesional_id", profesionalId)
              .eq("estado", "agendada")
              .gte("fecha_agendada", `${fechaStr}T00:00:00`)
              .lt("fecha_agendada", `${fechaStr}T23:59:59`),
            supabase
              .from("control_visitas")
              .select("fecha_hora_visita")
              .eq("profesional_id", profesionalId)
              .eq("estado", "pendiente")
              .gte("fecha_hora_visita", `${fechaStr}T00:00:00`)
              .lt("fecha_hora_visita", `${fechaStr}T23:59:59`),
          ]);

          // Create occupied slots
          const occupiedSlots: { start: Date; end: Date }[] = [];

          llamadasRes.data?.forEach((l: any) => {
            const start = new Date(l.fecha_agendada);
            const end = new Date(start.getTime() + (l.duracion_estimada || 15) * 60000);
            occupiedSlots.push({ start, end });
          });

          visitasRes.data?.forEach((v: any) => {
            const start = new Date(v.fecha_hora_visita);
            const end = new Date(start.getTime() + 60 * 60000);
            occupiedSlots.push({ start, end });
          });

          // Find available slots
          const [horaInicioH, horaInicioM] = horarioDia.hora_inicio.split(":").map(Number);
          const [horaFinH, horaFinM] = horarioDia.hora_fin.split(":").map(Number);

          let currentTime = setMinutes(
            setHours(currentDate, horaInicioH),
            horaInicioM
          );
          const endTime = setMinutes(setHours(currentDate, horaFinH), horaFinM);

          while (currentTime.getTime() + duracionMinutos * 60000 <= endTime.getTime()) {
            const slotEnd = new Date(currentTime.getTime() + duracionMinutos * 60000);

            const hasConflict = occupiedSlots.some(
              (occupied) =>
                (currentTime >= occupied.start && currentTime < occupied.end) ||
                (slotEnd > occupied.start && slotEnd <= occupied.end)
            );

            if (!hasConflict) {
              slots.push({
                fecha: new Date(currentTime),
                horaInicio: format(currentTime, "HH:mm"),
                horaFin: format(slotEnd, "HH:mm"),
                profesionalId,
                profesionalNombre: profesional
                  ? `${profesional.nombre} ${profesional.apellido}`
                  : "Sin nombre",
              });
            }

            currentTime = new Date(currentTime.getTime() + 30 * 60000); // Move 30 min
          }
        }

        return slots;
      } catch (error) {
        console.error("Error finding available slots:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const suggestReschedule = useCallback(
    async (
      profesionalId: string,
      fechaOriginal: Date,
      duracionMinutos: number = 30
    ): Promise<RescheduleSuggestion[]> => {
      const slots = await findAvailableSlots(
        profesionalId,
        fechaOriginal,
        14,
        duracionMinutos
      );

      const suggestions: RescheduleSuggestion[] = slots.slice(0, 5).map((slot, index) => {
        const daysDiff = Math.floor(
          (slot.fecha.getTime() - fechaOriginal.getTime()) / (1000 * 60 * 60 * 24)
        );

        let reason = "";
        let priority = 100 - index * 10;

        if (isSameDay(slot.fecha, fechaOriginal)) {
          reason = "Mismo día, horario diferente";
          priority += 20;
        } else if (daysDiff === 1) {
          reason = "Día siguiente";
          priority += 10;
        } else if (daysDiff <= 3) {
          reason = `En ${daysDiff} días`;
        } else {
          reason = `En ${daysDiff} días`;
          priority -= 10;
        }

        return { slot, reason, priority };
      });

      return suggestions.sort((a, b) => b.priority - a.priority);
    },
    [findAvailableSlots]
  );

  const redistributeOnAbsence = useCallback(
    async (
      profesionalId: string,
      fechaInicio: Date,
      fechaFin: Date
    ): Promise<{ llamadas: any[]; visitas: any[]; suggestions: Map<string, TimeSlot[]> }> => {
      setLoading(true);

      try {
        const fechaInicioStr = format(fechaInicio, "yyyy-MM-dd");
        const fechaFinStr = format(fechaFin, "yyyy-MM-dd");

        // Get affected appointments
        const [llamadasRes, visitasRes] = await Promise.all([
          supabase
            .from("registro_llamadas")
            .select("*, pacientes(nombre, apellido, zona, barrio)")
            .eq("profesional_id", profesionalId)
            .eq("estado", "agendada")
            .gte("fecha_agendada", `${fechaInicioStr}T00:00:00`)
            .lte("fecha_agendada", `${fechaFinStr}T23:59:59`),
          supabase
            .from("control_visitas")
            .select("*, pacientes(nombre, apellido, zona, barrio)")
            .eq("profesional_id", profesionalId)
            .eq("estado", "pendiente")
            .gte("fecha_hora_visita", `${fechaInicioStr}T00:00:00`)
            .lte("fecha_hora_visita", `${fechaFinStr}T23:59:59`),
        ]);

        // Get other available professionals
        const { data: otrosProfesionales } = await supabase
          .from("personal_salud")
          .select("id, nombre, apellido, zona")
          .eq("activo", true)
          .neq("id", profesionalId)
          .in("especialidad", ["Médico", "Enfermera", "Medico Internista"]);

        const suggestions = new Map<string, TimeSlot[]>();

        // Find slots for each professional
        for (const prof of otrosProfesionales || []) {
          const slots = await findAvailableSlots(prof.id, fechaInicio, 14);
          if (slots.length > 0) {
            suggestions.set(prof.id, slots);
          }
        }

        return {
          llamadas: llamadasRes.data || [],
          visitas: visitasRes.data || [],
          suggestions,
        };
      } catch (error) {
        console.error("Error redistributing appointments:", error);
        return { llamadas: [], visitas: [], suggestions: new Map() };
      } finally {
        setLoading(false);
      }
    },
    [findAvailableSlots]
  );

  return {
    detectConflicts,
    findAvailableSlots,
    suggestReschedule,
    redistributeOnAbsence,
    conflicts,
    loading,
  };
}
