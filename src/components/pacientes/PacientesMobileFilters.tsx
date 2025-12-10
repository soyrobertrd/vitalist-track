import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileFilters } from "@/components/MobileFilters";
import { useOGTICZonas } from "@/hooks/useOGTICZonas";
import type { PacienteFilters as FiltersType } from "@/hooks/usePacientes";

interface PacientesMobileFiltersProps {
  filters: FiltersType;
  onFilterChange: (key: keyof FiltersType, value: string) => void;
  barrios: string[];
}

export function PacientesMobileFilters({ filters, onFilterChange, barrios }: PacientesMobileFiltersProps) {
  const { zonas, loading: zonasLoading } = useOGTICZonas();

  return (
    <MobileFilters title="Filtros de Pacientes">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Búsqueda</label>
          <Input
            placeholder="Nombre o cédula..."
            value={filters.busqueda}
            onChange={(e) => onFilterChange("busqueda", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select value={filters.status} onValueChange={(v) => onFilterChange("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="fallecido">Fallecido</SelectItem>
              <SelectItem value="renuncio">Renunció</SelectItem>
              <SelectItem value="cambio_ars">Cambió ARS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Municipio (zona)</label>
          <Select value={filters.zona} onValueChange={(v) => onFilterChange("zona", v)} disabled={zonasLoading}>
            <SelectTrigger>
              <SelectValue placeholder={zonasLoading ? "Cargando..." : "Seleccionar"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {zonas.map((zona) => (
                <SelectItem key={zona.value} value={zona.value}>
                  {zona.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Grado Dificultad</label>
          <Select value={filters.grado} onValueChange={(v) => onFilterChange("grado", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="bajo">Bajo</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Barrio</label>
          <Select value={filters.barrio} onValueChange={(v) => onFilterChange("barrio", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="sin_asignar">Sin asignar</SelectItem>
              {barrios.map(barrio => (
                <SelectItem key={barrio} value={barrio}>{barrio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </MobileFilters>
  );
}
