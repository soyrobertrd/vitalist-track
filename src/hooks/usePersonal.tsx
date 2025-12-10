import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  especialidad: string | null;
  contacto: string | null;
  email_contacto: string | null;
  zona: string | null;
  barrio: string | null;
  activo: boolean;
}

export function usePersonal(excludeAdmin = true) {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonal = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("personal_salud")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (excludeAdmin) {
      query = query.in("especialidad", ["Médico", "Enfermera", "Medico Internista"]);
    }

    const { data, error } = await query;
    
    if (!error) {
      setPersonal(data || []);
    }
    setLoading(false);
  }, [excludeAdmin]);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  return {
    personal,
    loading,
    fetchPersonal
  };
}
