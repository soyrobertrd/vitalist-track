import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export interface CriterioPanico {
  regex: RegExp;
  min?: number;
  max?: number;
  unidad: string;
  motivo: string;
}

export const CRITERIOS_PANICO: CriterioPanico[] = [
  { regex: /potasio|k\+/i, min: 2.8, max: 6.0, unidad: "mEq/L", motivo: "Riesgo de arritmia ventricular refractaria" },
  { regex: /sodio|na\+/i, min: 120, max: 155, unidad: "mEq/L", motivo: "Riesgo de edema cerebral / compromiso neurológico" },
  { regex: /glucosa|glicemia/i, min: 50, max: 400, unidad: "mg/dL", motivo: "Riesgo de coma hipoglucémico o CAD severa" },
  { regex: /plaquetas|trombocitos/i, min: 20000, max: 1000000, unidad: "/mm³", motivo: "Riesgo de sangrado espontáneo en SNC o digestivo" },
  { regex: /hemoglobina|hb\b/i, min: 7.0, max: 20.0, unidad: "g/dL", motivo: "Anemia descompensada / Shock hipovolémico" },
  { regex: /troponina/i, max: 0.04, unidad: "ng/mL", motivo: "Síndrome Coronario Agudo con elevación enzimática" },
  { regex: /creatinina/i, max: 4.5, unidad: "mg/dL", motivo: "Falla renal aguda anúrica" },
  { regex: /leucocitos|glóbulos blancos|wbc/i, min: 2000, max: 30000, unidad: "/mm³", motivo: "Neutropenia febril o sospecha de leucemia/sepsis" },
  { regex: /ph\b|gasometria/i, min: 7.20, max: 7.60, unidad: "", motivo: "Acidosis metabólica o respiratoria severa" },
];

export interface ResultRowProps {
  prueba: any;
  onSave: (d: any) => void;
  onPanicTrigger: (criticoInfo: any) => void;
}

export function ResultRow({ prueba, onSave, onPanicTrigger }: ResultRowProps) {
  const [resultado, setResultado] = useState(prueba.resultado || "");
  const [anormal, setAnormal] = useState(prueba.anormal || false);
  const [critico, setCritico] = useState(prueba.critico || false);
  const saved = prueba.estado === "completada";

  const handleResultadoChange = (val: string) => {
    setResultado(val);
    const num = parseFloat(val.replace(",", "."));
    if (!isNaN(num)) {
      const matchPanico = CRITERIOS_PANICO.find((c) => c.regex.test(prueba.nombre_prueba));
      if (matchPanico) {
        const isBajo = matchPanico.min !== undefined && num < matchPanico.min;
        const isAlto = matchPanico.max !== undefined && num > matchPanico.max;
        if (isBajo || isAlto) {
          setCritico(true);
          setAnormal(true);
          onPanicTrigger(matchPanico);
          return;
        }
      }
    }
  };

  return (
    <TableRow className={critico ? "bg-rose-500/10" : anormal ? "bg-amber-500/10" : ""}>
      <TableCell className="font-medium text-foreground">{prueba.nombre_prueba}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{prueba.categoria || "General"}</TableCell>
      <TableCell>
        <Input
          value={resultado}
          onChange={(e) => handleResultadoChange(e.target.value)}
          placeholder="Valor numérico / texto"
          className="h-8 rounded-lg font-mono text-sm"
          disabled={saved}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{prueba.rango_referencia_texto || "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {saved ? (
            <Badge variant={critico ? "destructive" : anormal ? "secondary" : "default"}>
              {critico ? "Crítico" : anormal ? "Anormal" : "Normal"}
            </Badge>
          ) : (
            <>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={anormal} onChange={(e) => setAnormal(e.target.checked)} /> Anormal
              </label>
              <label className="flex items-center gap-1 text-xs text-rose-600 font-semibold cursor-pointer">
                <input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} /> Pánico
              </label>
            </>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {!saved && resultado && (
          <Button
            size="sm"
            className="h-7 text-xs rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => onSave({ id: prueba.id, resultado, anormal, critico })}
          >
            Guardar
          </Button>
        )}
        {critico && <AlertTriangle className="h-4 w-4 text-rose-600 inline ml-1.5 animate-pulse" />}
      </TableCell>
    </TableRow>
  );
}
