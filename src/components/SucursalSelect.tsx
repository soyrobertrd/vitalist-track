import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSucursales } from "@/hooks/useSucursales";
import { Building2 } from "lucide-react";

interface SucursalSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label?: string;
  required?: boolean;
  showLabel?: boolean;
  placeholder?: string;
  className?: string;
}

const NONE_VALUE = "__none__";

/**
 * Selector de sucursal del workspace activo.
 * - Se oculta si el workspace no tiene sucursales registradas.
 * - Permite "sin asignar" (null).
 */
export function SucursalSelect({
  value,
  onChange,
  label = "Sucursal",
  required = false,
  showLabel = true,
  placeholder = "Sin asignar",
  className,
}: SucursalSelectProps) {
  const { sucursales, loading } = useSucursales();

  if (!loading && sucursales.length === 0) return null;

  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      {showLabel && (
        <Label className="text-xs flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {label} {required && "*"}
        </Label>
      )}
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={NONE_VALUE}>Sin asignar</SelectItem>}
          {sucursales.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nombre}
              {s.es_principal ? " (principal)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
