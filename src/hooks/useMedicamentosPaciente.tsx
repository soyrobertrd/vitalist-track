import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Medicamento {
  id: string;
  nombre_medicamento: string;
  dosis: string | null;
  frecuencia: string | null;
  muestra_medica: boolean;
}

export function useMedicamentosPaciente(pacienteId: string | null) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pacienteId) {
      fetchMedicamentos();
    } else {
      setMedicamentos([]);
    }
  }, [pacienteId]);

  const fetchMedicamentos = async () => {
    if (!pacienteId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("medicamentos_paciente")
      .select("id, nombre_medicamento, dosis, frecuencia, muestra_medica")
      .eq("paciente_id", pacienteId)
      .order("nombre_medicamento");

    if (!error && data) {
      setMedicamentos(data);
    }
    setLoading(false);
  };

  return { medicamentos, loading, refetch: fetchMedicamentos };
}
