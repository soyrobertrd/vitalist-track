import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarOff } from "lucide-react";

interface DiasRestriccionPacienteProps {
  diasNoVisita: number[];
  onChange: (dias: number[]) => void;
}

const DIAS_SEMANA = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
];

export function DiasRestriccionPaciente({ diasNoVisita, onChange }: DiasRestriccionPacienteProps) {
  const handleDayToggle = (day: number, checked: boolean) => {
    if (checked) {
      onChange([...diasNoVisita, day].sort());
    } else {
      onChange(diasNoVisita.filter(d => d !== day));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarOff className="h-4 w-4 text-orange-500" />
        <h4 className="text-sm font-semibold">Días sin Disponibilidad para Visitas</h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Seleccione los días de la semana en que el paciente no puede recibir visitas (ej: diálisis, otras citas)
      </p>
      <div className="flex flex-wrap gap-4">
        {DIAS_SEMANA.map((dia) => (
          <Label
            key={dia.value}
            className="flex items-center gap-2 cursor-pointer p-2 rounded-md border hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={diasNoVisita.includes(dia.value)}
              onCheckedChange={(checked) => handleDayToggle(dia.value, checked as boolean)}
            />
            <span className="text-sm font-medium">{dia.label}</span>
          </Label>
        ))}
      </div>
    </div>
  );
}
