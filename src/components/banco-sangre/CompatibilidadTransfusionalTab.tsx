import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet, AlertTriangle, CheckCircle2, ShieldCheck, HeartPulse, Info } from "lucide-react";

export type GrupoSanguineo = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";

interface ReglaCompatibilidad {
  cgrCompatibles: GrupoSanguineo[];
  cgrOptimo: GrupoSanguineo;
  plasmaCompatibles: GrupoSanguineo[];
  anticuerposNaturales: string;
}

const TABLA_COMPATIBILIDAD: Record<GrupoSanguineo, ReglaCompatibilidad> = {
  "O-": {
    cgrCompatibles: ["O-"],
    cgrOptimo: "O-",
    plasmaCompatibles: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    anticuerposNaturales: "Anti-A y Anti-B en suero",
  },
  "O+": {
    cgrCompatibles: ["O-", "O+"],
    cgrOptimo: "O+",
    plasmaCompatibles: ["O+", "A+", "B+", "AB+"],
    anticuerposNaturales: "Anti-A y Anti-B en suero",
  },
  "A-": {
    cgrCompatibles: ["O-", "A-"],
    cgrOptimo: "A-",
    plasmaCompatibles: ["A-", "A+", "AB-", "AB+"],
    anticuerposNaturales: "Anti-B en suero",
  },
  "A+": {
    cgrCompatibles: ["O-", "O+", "A-", "A+"],
    cgrOptimo: "A+",
    plasmaCompatibles: ["A+", "AB+"],
    anticuerposNaturales: "Anti-B en suero",
  },
  "B-": {
    cgrCompatibles: ["O-", "B-"],
    cgrOptimo: "B-",
    plasmaCompatibles: ["B-", "B+", "AB-", "AB+"],
    anticuerposNaturales: "Anti-A en suero",
  },
  "B+": {
    cgrCompatibles: ["O-", "O+", "B-", "B+"],
    cgrOptimo: "B+",
    plasmaCompatibles: ["B+", "AB+"],
    anticuerposNaturales: "Anti-A en suero",
  },
  "AB-": {
    cgrCompatibles: ["O-", "A-", "B-", "AB-"],
    cgrOptimo: "AB-",
    plasmaCompatibles: ["AB-", "AB+"],
    anticuerposNaturales: "Sin anticuerpos Anti-A ni Anti-B",
  },
  "AB+": {
    cgrCompatibles: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    cgrOptimo: "AB+",
    plasmaCompatibles: ["AB+"],
    anticuerposNaturales: "Receptor universal de glóbulos rojos",
  },
};

export function CompatibilidadTransfusionalTab() {
  const [grupoReceptor, setGrupoReceptor] = useState<GrupoSanguineo>("A+");
  const [componente, setComponente] = useState<"cgr" | "plasma" | "plaquetas">("cgr");

  const regla = TABLA_COMPATIBILIDAD[grupoReceptor];

  return (
    <div className="space-y-6">
      {/* Selector de Paciente / Receptor */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-red-700 bg-red-50 dark:bg-red-950/40 border-red-300">
                  Calculadora Inmunohematológica ABO / RhD
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-1">Verificación Cruzada de Compatibilidad</CardTitle>
              <p className="text-xs text-muted-foreground">
                Prevención de hemólisis aguda intravascular y choque anafiláctico transfusional.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Grupo Receptor:</span>
                <Select value={grupoReceptor} onValueChange={(v: any) => setGrupoReceptor(v)}>
                  <SelectTrigger className="w-28 h-9 rounded-xl font-bold font-mono text-red-600 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl font-mono">
                    {(Object.keys(TABLA_COMPATIBILIDAD) as GrupoSanguineo[]).map(g => (
                      <SelectItem key={g} value={g} className="font-bold">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Componente:</span>
                <Select value={componente} onValueChange={(v: any) => setComponente(v)}>
                  <SelectTrigger className="w-36 h-9 rounded-xl text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="cgr">Glóbulos Rojos (CGR)</SelectItem>
                    <SelectItem value="plasma">Plasma Fresco (PFC)</SelectItem>
                    <SelectItem value="plaquetas">Plaquetas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Tarjeta de Compatibilidad Óptima */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Grupo Iso-Grupo Óptimo para Receptor {grupoReceptor}:
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-mono text-red-600 dark:text-red-400">
                  {componente === "cgr" ? regla.cgrOptimo : grupoReceptor}
                </span>
                <Badge className="bg-emerald-600 text-white text-[11px] gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Isogrupo Preferente
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Anticuerpos naturales en el receptor: <strong>{regla.anticuerposNaturales}</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 text-xs space-y-1 w-full md:w-auto">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary" /> Regla de Oro Transfusional
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {componente === "cgr"
                  ? "Los glóbulos rojos no deben poseer antígenos contra los anticuerpos del plasma receptor."
                  : "El plasma transfundido no debe poseer anticuerpos contra los eritrocitos del receptor."}
              </p>
            </div>
          </div>

          {/* Grilla Visual de Todos los Grupos y su Estatus */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">
              Donantes Compatibles para este Paciente ({componente === "cgr" ? "Concentrado de Hematíes" : "Plasma"}):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {(Object.keys(TABLA_COMPATIBILIDAD) as GrupoSanguineo[]).map(g => {
                const esCompatible =
                  componente === "cgr"
                    ? regla.cgrCompatibles.includes(g)
                    : regla.plasmaCompatibles.includes(g);
                const esOptimo = g === grupoReceptor;

                return (
                  <div
                    key={g}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      esOptimo
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30"
                        : esCompatible
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300"
                        : "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-900 dark:text-red-400 opacity-60"
                    }`}
                  >
                    <span className="text-xl font-black font-mono block">{g}</span>
                    <span className="text-[10px] font-bold block mt-1 uppercase">
                      {esOptimo ? "Óptimo" : esCompatible ? "Compatible" : "Incompatible"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
