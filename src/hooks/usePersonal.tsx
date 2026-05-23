import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
  const { currentWorkspace } = useWorkspace();
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonal = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("personal_salud")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (currentWorkspace) {
      query = query.eq("workspace_id", currentWorkspace.id);
    }

    // Filtro hardcoded removido. Ahora `excludeAdmin` excluye únicamente
    // las categorías administrativas configuradas en `especialidades_catalogo`.
    if (excludeAdmin) {
      const { data: admins } = await supabase
        .from("especialidades_catalogo")
        .select("nombre")
        .eq("categoria", "administrativa");
      const adminNames = (admins || []).map((a: any) => a.nombre);
      if (adminNames.length) {
        query = query.not("especialidad", "in", `(${adminNames.map((n) => `"${n}"`).join(",")})`);
      }
    }

    const { data, error } = await query;

    if (!error) {
      setPersonal(data || []);
    }
    setLoading(false);
  }, [excludeAdmin, currentWorkspace]);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  return {
    personal,
    loading,
    fetchPersonal,
  };
}
