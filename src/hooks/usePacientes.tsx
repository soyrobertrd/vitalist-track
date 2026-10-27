import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useVerticalFilter } from "@/hooks/useVerticalFilter";
import { DEMO_MODE, DEMO_PACIENTES } from "@/lib/mock-live-seed";

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
  clinica_origen?: string | null;
}

export interface PacienteFilters {
  status: string;
  zona: string;
  grado: string;
  busqueda: string;
  barrio: string;
  tipo: string;
  motivo_inactividad: string;
  clinica_origen: string;
}

const defaultFilters: PacienteFilters = {
  status: "todos",
  zona: "todos",
  grado: "todos",
  busqueda: "",
  barrio: "todos",
  tipo: "todos",
  motivo_inactividad: "todos",
  clinica_origen: "todos",
};

export function usePacientes(includeInactive: boolean = false) {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { verticalActiva } = useVerticalFilter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PacienteFilters>(defaultFilters);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("pacientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (currentWorkspace) {
      query = query.eq("workspace_id", currentWorkspace.id);
    }
    if (activeSucursalId) {
      query = query.eq("sucursal_id", activeSucursalId);
    }
    // Aislamiento por vertical: filtra solo si hay una vertical específica activa
    if (verticalActiva && verticalActiva !== "todas") {
      query = (query as any).eq("vertical", verticalActiva);
    }

    if (!includeInactive) {
      query = query.neq("status_px", "inactivo");
    } else {
      query = query.eq("status_px", "inactivo");
    }

    const { data, error } = await query;

    if (DEMO_MODE && (error || !data || data.length === 0)) {
      // Fallback a los pacientes demo canónicos de la vertical / workspace
      const currentWsId = currentWorkspace?.id;
      const demoFiltrados = DEMO_PACIENTES.filter((p) => {
        if (currentWsId && p.workspace_id === currentWsId) return true;
        if (verticalActiva && verticalActiva !== "todas" && p.vertical === verticalActiva) return true;
        return !currentWsId || currentWsId.startsWith("ws-");
      });
      setPacientes(demoFiltrados.length > 0 ? (demoFiltrados as any) : (DEMO_PACIENTES as any));
    } else if (error) {
      toast.error("Error al cargar pacientes");
    } else {
      setPacientes(data || []);
    }
    setLoading(false);
  }, [includeInactive, currentWorkspace, activeSucursalId, verticalActiva]);

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
      if (filters.clinica_origen !== "todos" && p.clinica_origen !== filters.clinica_origen) return false;
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
