import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isWeekend } from "date-fns";

export function useDiasLaborables() {
  const [diasNoLaborables, setDiasNoLaborables] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDiasNoLaborables();
  }, []);

  const fetchDiasNoLaborables = async () => {
    const { data } = await supabase
      .from("dias_no_laborables")
      .select("fecha");

    if (data) {
      setDiasNoLaborables(new Set(data.map((d) => d.fecha)));
    }
  };

  const esDiaLaborable = (fecha: Date): boolean => {
    const fechaStr = format(fecha, "yyyy-MM-dd");
    return !isWeekend(fecha) && !diasNoLaborables.has(fechaStr);
  };

  const siguienteDiaLaborable = (fecha: Date): Date => {
    let nextDate = fecha;
    while (!esDiaLaborable(nextDate)) {
      nextDate = addDays(nextDate, 1);
    }
    return nextDate;
  };

  return { esDiaLaborable, siguienteDiaLaborable, diasNoLaborables };
}
