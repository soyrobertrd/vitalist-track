import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  contacto_px: string | null;
  status_px: string;
  grado_dificultad: string;
  zona: string | null;
  barrio: string | null;
  direccion_domicilio: string | null;
  historia_medica_basica: string | null;
  profesional_asignado_id: string | null;
  es_sospechoso?: boolean;
  whatsapp_px?: boolean;
  contacto_cuidador?: string | null;
  whatsapp_cuidador?: boolean;
  numero_principal?: string | null;
  tipo_atencion?: string | null;
  dias_no_visita?: number[];
  motivo_inactividad?: string | null;
}

export interface PacienteFilters {
  status: string;
  zona: string;
  grado: string;
  busqueda: string;
  barrio: string;
  tipo: string;
  motivo_inactividad: string;
}

const defaultFilters: PacienteFilters = {
  status: "todos",
  zona: "todos",
  grado: "todos",
  busqueda: "",
  barrio: "todos",
  tipo: "todos",
  motivo_inactividad: "todos"
};

export function usePacientes(includeInactive: boolean = false) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PacienteFilters>(defaultFilters);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("pacientes")
      .select("*")
      .order("nombre", { ascending: true });
    
    if (!includeInactive) {
      query = query.neq("status_px", "inactivo");
    } else {
      query = query.eq("status_px", "inactivo");
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar pacientes");
    } else {
      setPacientes(data || []);
    }
    setLoading(false);
  }, [includeInactive]);

  const filteredPacientes = useMemo(() => {
    return pacientes.filter((p) => {
      if (filters.status !== "todos" && p.status_px !== filters.status) return false;
      if (filters.zona !== "todos" && p.zona !== filters.zona) return false;
      if (filters.grado !== "todos" && p.grado_dificultad !== filters.grado) return false;
      if (filters.barrio !== "todos") {
        if (filters.barrio === "sin_asignar" && p.barrio) return false;
        if (filters.barrio !== "sin_asignar" && p.barrio !== filters.barrio) return false;
      }
      if (filters.tipo === "sospechosos" && !p.es_sospechoso) return false;
      if (filters.tipo === "regulares" && p.es_sospechoso) return false;
      if (filters.motivo_inactividad !== "todos" && p.motivo_inactividad !== filters.motivo_inactividad) return false;
      if (filters.busqueda) {
        const busqueda = filters.busqueda.toLowerCase();
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        const cedula = p.cedula.toLowerCase();
        if (!nombreCompleto.includes(busqueda) && !cedula.includes(busqueda)) return false;
      }
      return true;
    });
  }, [pacientes, filters]);

  const updateFilter = useCallback((key: keyof PacienteFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const deletePaciente = useCallback(async (id: string) => {
    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar paciente");
      return false;
    }
    toast.success("Paciente eliminado");
    await fetchPacientes();
    return true;
  }, [fetchPacientes]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  return {
    pacientes,
    filteredPacientes,
    loading,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    fetchPacientes,
    deletePaciente
  };
}
