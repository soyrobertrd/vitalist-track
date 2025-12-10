import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isWeekend, getMonth, getDate } from "date-fns";

interface DiaNoLaborable {
  fecha: string;
  descripcion: string;
  es_ciclico: boolean | null;
}

export function useDiasLaborables() {
  const [diasNoLaborables, setDiasNoLaborables] = useState<DiaNoLaborable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiasNoLaborables();
  }, []);

  const fetchDiasNoLaborables = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dias_no_laborables")
      .select("fecha, descripcion, es_ciclico");

    if (data) {
      setDiasNoLaborables(data);
    }
    setLoading(false);
  };

  const esFeriado = useCallback((fecha: Date): { esFeriado: boolean; descripcion?: string } => {
    const fechaStr = format(fecha, "yyyy-MM-dd");
    const mes = getMonth(fecha) + 1; // getMonth is 0-indexed
    const dia = getDate(fecha);
    
    for (const diaNoLab of diasNoLaborables) {
      // Check exact date match
      if (diaNoLab.fecha === fechaStr) {
        return { esFeriado: true, descripcion: diaNoLab.descripcion };
      }
      
      // Check cyclic holidays (same month and day, any year)
      if (diaNoLab.es_ciclico) {
        const feriadoDate = new Date(diaNoLab.fecha);
        const feriadoMes = getMonth(feriadoDate) + 1;
        const feriadoDia = getDate(feriadoDate);
        
        if (mes === feriadoMes && dia === feriadoDia) {
          return { esFeriado: true, descripcion: diaNoLab.descripcion };
        }
      }
    }
    
    return { esFeriado: false };
  }, [diasNoLaborables]);

  const esDiaLaborable = useCallback((fecha: Date): boolean => {
    // Weekends are not working days
    if (isWeekend(fecha)) {
      return false;
    }
    
    // Check configured holidays
    const { esFeriado: esHoliday } = esFeriado(fecha);
    return !esHoliday;
  }, [esFeriado]);

  const obtenerRazonNoLaborable = useCallback((fecha: Date): string | null => {
    if (isWeekend(fecha)) {
      const dayOfWeek = fecha.getDay();
      return dayOfWeek === 0 ? "Domingo" : "Sábado";
    }
    
    const { esFeriado: esHoliday, descripcion } = esFeriado(fecha);
    if (esHoliday) {
      return descripcion || "Día feriado";
    }
    
    return null;
  }, [esFeriado]);

  const siguienteDiaLaborable = useCallback((fecha: Date): Date => {
    let nextDate = addDays(fecha, 1);
    while (!esDiaLaborable(nextDate)) {
      nextDate = addDays(nextDate, 1);
    }
    return nextDate;
  }, [esDiaLaborable]);

  const validarFechaAgendamiento = useCallback((fecha: Date): { valido: boolean; mensaje?: string } => {
    if (!esDiaLaborable(fecha)) {
      const razon = obtenerRazonNoLaborable(fecha);
      const sugerencia = siguienteDiaLaborable(fecha);
      return {
        valido: false,
        mensaje: `No se puede agendar para el ${format(fecha, "dd/MM/yyyy")} (${razon}). Próximo día disponible: ${format(sugerencia, "dd/MM/yyyy")}`
      };
    }
    return { valido: true };
  }, [esDiaLaborable, obtenerRazonNoLaborable, siguienteDiaLaborable]);

  return { 
    esDiaLaborable, 
    siguienteDiaLaborable, 
    diasNoLaborables,
    esFeriado,
    obtenerRazonNoLaborable,
    validarFechaAgendamiento,
    loading
  };
}
