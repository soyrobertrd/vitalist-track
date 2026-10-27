import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckSquare, Copy, Download, Filter, LayoutGrid, List, Settings2, Upload } from "lucide-react";
import { descargarCSV } from "@/components/ExportButton";
import { DetectarDuplicadosDialog } from "@/components/DetectarDuplicadosDialog";
import { AccionesMenu } from "@/components/common/AccionesMenu";
import type { Paciente } from "@/hooks/usePacientes";

interface PacientesHeaderProps {
  isAdmin: boolean;
  filteredPacientes: Paciente[];
  onImportClick: () => void;
  onToggleFilters?: () => void;
  showFilters?: boolean;
  viewMode: "cards" | "table";
  onViewModeChange: (v: "cards" | "table") => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
}

const COLUMNAS_CSV = [
  { key: "cedula", label: "Cédula" },
  { key: "nombre", label: "Nombre" },
  { key: "apellido", label: "Apellido" },
  { key: "contacto", label: "Contacto" },
  { key: "zona", label: "Zona" },
  { key: "barrio", label: "Barrio" },
  { key: "estado", label: "Estado" },
  { key: "dificultad", label: "Dificultad" },
];

/** Barra de herramientas de /pacientes: filtros y vista visibles; el resto, agrupado en "Más acciones". */
export function PacientesHeader({
  isAdmin,
  filteredPacientes,
  onImportClick,
  onToggleFilters,
  showFilters = false,
  viewMode,
  onViewModeChange,
  selectionMode,
  onToggleSelection,
}: PacientesHeaderProps) {
  const [duplicadosOpen, setDuplicadosOpen] = useState(false);

  const exportar = () =>
    descargarCSV(
      filteredPacientes.map((p) => ({
        cedula: p.cedula,
        nombre: p.nombre,
        apellido: p.apellido,
        contacto: p.contacto_px || "",
        zona: p.zona || "",
        barrio: (p as Paciente & { barrio?: string }).barrio || "",
        estado: p.status_px,
        dificultad: p.grado_dificultad || "",
      })),
      COLUMNAS_CSV,
      "pacientes"
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onToggleFilters && (
        <Button variant={showFilters ? "secondary" : "outline"} size="sm" className="rounded-full" onClick={onToggleFilters} aria-pressed={showFilters}>
          <Filter className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Filtros
        </Button>
      )}

      <div className="flex items-center rounded-full border bg-card p-0.5" role="group" aria-label="Tipo de vista">
        {([
          { v: "cards", icon: LayoutGrid, label: "Tarjetas" },
          { v: "table", icon: List, label: "Tabla" },
        ] as const).map(({ v, icon: Icon, label }) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewModeChange(v)}
            aria-pressed={viewMode === v}
            aria-label={`Vista ${label.toLowerCase()}`}
            className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              viewMode === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <AccionesMenu
        variante="boton"
        textoBoton="Más acciones"
        iconoBoton={Settings2}
        label="Más acciones de pacientes"
        className="h-9"
        acciones={[
          { label: selectionMode ? "Cancelar selección" : "Selección múltiple", icon: CheckSquare, onSelect: onToggleSelection },
          { label: `Exportar CSV (${filteredPacientes.length})`, icon: Download, onSelect: exportar },
          { label: "Importar pacientes", icon: Upload, onSelect: onImportClick, oculta: !isAdmin },
          { label: "Detectar duplicados", icon: Copy, onSelect: () => setDuplicadosOpen(true), oculta: !isAdmin },
        ]}
      />

      {isAdmin && <DetectarDuplicadosDialog open={duplicadosOpen} onOpenChange={setDuplicadosOpen} />}
    </div>
  );
}
