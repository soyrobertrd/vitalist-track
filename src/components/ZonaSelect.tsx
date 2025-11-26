import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOGTICZonas } from "@/hooks/useOGTICZonas";

interface ZonaSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function ZonaSelect({ value, onValueChange, disabled }: ZonaSelectProps) {
  const { zonas, loading } = useOGTICZonas();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando zonas..." : "Seleccionar zona"} />
      </SelectTrigger>
      <SelectContent>
        {zonas.map((zona) => (
          <SelectItem key={zona.value} value={zona.value}>
            {zona.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
