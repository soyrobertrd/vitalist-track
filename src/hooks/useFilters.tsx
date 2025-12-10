import { useState, useMemo, useCallback } from "react";

export interface FilterConfig<T> {
  key: keyof T;
  type: 'select' | 'search' | 'date' | 'range';
  defaultValue: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface UseFiltersOptions<T> {
  data: T[];
  configs: FilterConfig<T>[];
  searchKeys?: (keyof T)[];
}

export function useFilters<T extends Record<string, any>>({
  data,
  configs,
  searchKeys = [],
}: UseFiltersOptions<T>) {
  const initialFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    configs.forEach((config) => {
      filters[config.key as string] = config.defaultValue;
    });
    return filters;
  }, [configs]);

  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState("");

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm("");
  }, [initialFilters]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Apply all filters
      for (const config of configs) {
        const filterValue = filters[config.key as string];
        if (filterValue && filterValue !== "todos" && filterValue !== "all") {
          if (config.type === "select") {
            if (item[config.key] !== filterValue) {
              return false;
            }
          }
        }
      }

      // Apply search
      if (searchTerm && searchKeys.length > 0) {
        const searchLower = searchTerm.toLowerCase();
        const matches = searchKeys.some((key) => {
          const value = item[key];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        });
        if (!matches) return false;
      }

      return true;
    });
  }, [data, filters, searchTerm, configs, searchKeys]);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    searchTerm,
    setSearchTerm,
    filteredData,
  };
}

// Generic hook for common filter patterns
export function usePacienteFilters(pacientes: any[]) {
  return useFilters({
    data: pacientes,
    configs: [
      { key: 'status_px', type: 'select', defaultValue: 'todos' },
      { key: 'zona', type: 'select', defaultValue: 'todos' },
      { key: 'grado_dificultad', type: 'select', defaultValue: 'todos' },
      { key: 'barrio', type: 'select', defaultValue: 'todos' },
    ],
    searchKeys: ['nombre', 'apellido', 'cedula'],
  });
}

export function useVisitaFilters(visitas: any[]) {
  return useFilters({
    data: visitas,
    configs: [
      { key: 'estado', type: 'select', defaultValue: 'all' },
      { key: 'profesional_id', type: 'select', defaultValue: 'all' },
      { key: 'tipo_visita', type: 'select', defaultValue: 'all' },
    ],
    searchKeys: [],
  });
}

export function useLlamadaFilters(llamadas: any[]) {
  return useFilters({
    data: llamadas,
    configs: [
      { key: 'estado', type: 'select', defaultValue: 'all' },
      { key: 'profesional_id', type: 'select', defaultValue: 'all' },
    ],
    searchKeys: [],
  });
}
