import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "./useDebounce";

export interface SearchResult {
  id: string;
  type: 'paciente' | 'profesional' | 'visita' | 'llamada';
  title: string;
  subtitle: string;
  url: string;
  icon?: string;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search pacientes
      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido, cedula")
        .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,cedula.ilike.%${searchQuery}%`)
        .limit(5);

      if (pacientes) {
        pacientes.forEach((p) => {
          searchResults.push({
            id: p.id,
            type: 'paciente',
            title: `${p.nombre} ${p.apellido}`,
            subtitle: `Cédula: ${p.cedula}`,
            url: `/pacientes?id=${p.id}`,
            icon: '👤',
          });
        });
      }

      // Search profesionales
      const { data: profesionales } = await supabase
        .from("personal_salud")
        .select("id, nombre, apellido, especialidad")
        .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%`)
        .limit(5);

      if (profesionales) {
        profesionales.forEach((p) => {
          searchResults.push({
            id: p.id,
            type: 'profesional',
            title: `${p.nombre} ${p.apellido}`,
            subtitle: p.especialidad || 'Profesional de salud',
            url: `/personal?id=${p.id}`,
            icon: '👨‍⚕️',
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useMemo(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isOpen,
    setIsOpen,
    search,
  };
}
