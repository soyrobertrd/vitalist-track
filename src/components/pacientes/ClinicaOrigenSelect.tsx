import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface ClinicaOrigenSelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function ClinicaOrigenSelect({
  value,
  onChange,
  disabled = false,
}: ClinicaOrigenSelectProps) {
  const { currentWorkspace } = useWorkspace();
  const plan = currentWorkspace?.plan_codigo || "solo";

  // Obtenemos las clínicas asociadas desde la configuración del workspace (máximo 3 para Pro)
  const defaultClinicas: string[] =
    currentWorkspace?.configuracion?.clinicas_asociadas || [
      "Consultorio Principal",
      "Clínica Externa A",
      "Clínica Externa B",
    ];

  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleSelect = (val: string) => {
    if (val === "__custom__") {
      setCustomMode(true);
    } else {
      setCustomMode(false);
      onChange(val);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="clinica_origen" className="flex items-center gap-1.5 text-sm font-medium">
          <Building2 className="h-4 w-4 text-primary" />
          Clínica de Origen / Procedencia
        </Label>
        {plan === "pro" && (
          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
            Pro (Hasta 3 clínicas)
          </Badge>
        )}
      </div>

      {!customMode ? (
        <Select
          value={value || defaultClinicas[0]}
          onValueChange={handleSelect}
          disabled={disabled}
        >
          <SelectTrigger id="clinica_origen">
            <SelectValue placeholder="Seleccionar clínica asociada" />
          </SelectTrigger>
          <SelectContent>
            {defaultClinicas.slice(0, 3).map((clinica) => (
              <SelectItem key={clinica} value={clinica}>
                {clinica}
              </SelectItem>
            ))}
            <SelectItem value="__custom__">+ Otra clínica / Centro...</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Nombre de la clínica..."
            value={customValue}
            onChange={handleCustomChange}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => {
              setCustomMode(false);
              onChange(defaultClinicas[0] || "");
            }}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Volver
          </button>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Identifica en qué centro o clínica atiende a este paciente para clasificar sus expedientes.
      </p>
    </div>
  );
}
