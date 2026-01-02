import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "./useDebounce";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface SearchResult {
  id: string;
  type: 'paciente' | 'profesional' | 'visita' | 'llamada';
  title: string;
  subtitle: string;
  url: string;
  metadata?: string;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 200);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      // Execute all searches in parallel for speed
      const [pacientesRes, profesionalesRes, visitasRes, llamadasRes] = await Promise.all([
        // Search pacientes
        supabase
          .from("pacientes")
          .select("id, nombre, apellido, cedula, contacto_px, barrio, zona")
          .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,cedula.ilike.%${searchQuery}%,contacto_px.ilike.%${searchQuery}%`)
          .eq("status_px", "activo")
          .limit(8),

        // Search profesionales
        supabase
          .from("personal_salud")
          .select("id, nombre, apellido, especialidad, contacto")
          .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,cedula.ilike.%${searchQuery}%`)
          .eq("activo", true)
          .limit(5),

        // Search visitas by patient name
        supabase
          .from("control_visitas")
          .select(`
            id, 
            fecha_hora_visita, 
            tipo_visita, 
            estado,
            motivo_visita,
            pacientes!inner(id, nombre, apellido, cedula)
          `)
          .or(`pacientes.nombre.ilike.%${searchQuery}%,pacientes.apellido.ilike.%${searchQuery}%,pacientes.cedula.ilike.%${searchQuery}%`)
          .in("estado", ["pendiente", "realizada"])
          .order("fecha_hora_visita", { ascending: false })
          .limit(5),

        // Search llamadas by patient name
        supabase
          .from("registro_llamadas")
          .select(`
            id, 
            fecha_agendada, 
            estado,
            motivo,
            pacientes!inner(id, nombre, apellido, cedula)
          `)
          .or(`pacientes.nombre.ilike.%${searchQuery}%,pacientes.apellido.ilike.%${searchQuery}%,pacientes.cedula.ilike.%${searchQuery}%`)
          .in("estado", ["agendada", "pendiente", "realizada"])
          .order("fecha_agendada", { ascending: false })
          .limit(5)
      ]);

      // Process pacientes
      if (pacientesRes.data) {
        pacientesRes.data.forEach((p) => {
          searchResults.push({
            id: p.id,
            type: 'paciente',
            title: `${p.nombre} ${p.apellido}`,
            subtitle: `Cédula: ${p.cedula}`,
            url: `/pacientes?id=${p.id}`,
            metadata: p.barrio || p.zona || undefined,
          });
        });
      }

      // Process profesionales
      if (profesionalesRes.data) {
        profesionalesRes.data.forEach((p) => {
          searchResults.push({
            id: p.id,
            type: 'profesional',
            title: `${p.nombre} ${p.apellido}`,
            subtitle: p.especialidad || 'Profesional de salud',
            url: `/personal?id=${p.id}`,
            metadata: p.contacto || undefined,
          });
        });
      }

      // Process visitas
      if (visitasRes.data) {
        visitasRes.data.forEach((v: any) => {
          const paciente = v.pacientes;
          const fecha = v.fecha_hora_visita 
            ? format(new Date(v.fecha_hora_visita), "dd MMM yyyy, HH:mm", { locale: es })
            : 'Sin fecha';
          searchResults.push({
            id: v.id,
            type: 'visita',
            title: `Visita: ${paciente.nombre} ${paciente.apellido}`,
            subtitle: `${fecha} - ${v.tipo_visita === 'domicilio' ? 'Domicilio' : 'Ambulatorio'}`,
            url: `/visitas?id=${v.id}`,
            metadata: v.estado,
          });
        });
      }

      // Process llamadas
      if (llamadasRes.data) {
        llamadasRes.data.forEach((l: any) => {
          const paciente = l.pacientes;
          const fecha = l.fecha_agendada 
            ? format(new Date(l.fecha_agendada), "dd MMM yyyy, HH:mm", { locale: es })
            : 'Sin fecha';
          searchResults.push({
            id: l.id,
            type: 'llamada',
            title: `Llamada: ${paciente.nombre} ${paciente.apellido}`,
            subtitle: fecha,
            url: `/llamadas?id=${l.id}`,
            metadata: l.estado,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isOpen,
    setIsOpen,
    search,
    clearSearch,
  };
}
