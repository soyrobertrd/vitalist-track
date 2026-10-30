import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Thermometer,
  Gauge,
  Plus,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export interface ControlAutoclaveRegistro {
  id: string;
  equipo: string;
  fecha: string;
  tipoPrueba: "bowie_dick" | "indicador_biologico" | "prueba_vacio" | "ciclo_rutina";
  temperaturaC: number;
  presionBar: number;
  tiempoMesetaMin: number;
  resultado: "conforme" | "no_conforme" | "en_incubacion";
  incubacionHoras?: number;
  operador: string;
  loteBiologico?: string;
  observaciones?: string;
}

const DEFAULT_CONTROLES: ControlAutoclaveRegistro[] = [
  {
    id: "ctrl-1",
    equipo: "Autoclave Principal 01 (Matachana 500L)",
    fecha: "2026-10-29 06:30",
    tipoPrueba: "bowie_dick",
    temperaturaC: 134.2,
    presionBar: 3.1,
    tiempoMesetaMin: 3.5,
    resultado: "conforme",
    operador: "Lic. Miguel Ángel Sosa",
    observaciones: "Hoja de viraje homogéneo color uniforme negro. Sin bolsas de aire residuales.",
  },
  {
    id: "ctrl-2",
    equipo: "Autoclave Principal 01 (Matachana 500L)",
    fecha: "2026-10-29 07:00",
    tipoPrueba: "indicador_biologico",
    temperaturaC: 134.0,
    presionBar: 3.0,
    tiempoMesetaMin: 5.0,
    resultado: "en_incubacion",
    incubacionHoras: 1,
    loteBiologico: "BIO-GEO-2026-99",
    operador: "Lic. Miguel Ángel Sosa",
    observaciones: "Lectura por fluorescencia en auto-lectora 3M Attest a 56°C. Resultado final en 2 horas.",
  },
  {
    id: "ctrl-3",
    equipo: "Autoclave 02 (Tuttnauer 250L)",
    fecha: "2026-10-28 07:15",
    tipoPrueba: "indicador_biologico",
    temperaturaC: 134.1,
    presionBar: 3.05,
    tiempoMesetaMin: 5.0,
    resultado: "conforme",
    incubacionHoras: 3,
    loteBiologico: "BIO-GEO-2026-87",
    operador: "Tec. Patricia Luna",
    observaciones: "Fluorescencia Negativa (Ausencia de crecimiento bacteriano). Carga aprobada.",
  },
  {
    id: "ctrl-4",
    equipo: "Esterilizador Plasma H2O2 (Sterrad NX)",
    fecha: "2026-10-28 08:30",
    tipoPrueba: "ciclo_rutina",
    temperaturaC: 54.5,
    presionBar: 0.8,
    tiempoMesetaMin: 45.0,
    resultado: "conforme",
    operador: "Tec. Patricia Luna",
    observaciones: "Ciclo estándar para instrumental laparoscópico y cámaras de video.",
  },
];

export const ControlCalidadAutoclaveTab: React.FC = () => {
  const [controles, setControles] = useState<ControlAutoclaveRegistro[]>(DEFAULT_CONTROLES);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    equipo: "Autoclave Principal 01 (Matachana 500L)",
    tipoPrueba: "bowie_dick" as ControlAutoclaveRegistro["tipoPrueba"],
    temperaturaC: 134.0,
    presionBar: 3.1,
    tiempoMesetaMin: 3.5,
    resultado: "conforme" as ControlAutoclaveRegistro["resultado"],
    operador: "Lic. Miguel Ángel Sosa",
    loteBiologico: "BIO-GEO-2026-102",
    observaciones: "",
  });

  const handleCrear = () => {
    const nuevo: ControlAutoclaveRegistro = {
      id: `ctrl-${Date.now()}`,
      equipo: form.equipo,
      fecha: new Date().toISOString().replace("T", " ").substring(0, 16),
      tipoPrueba: form.tipoPrueba,
      temperaturaC: Number(form.temperaturaC),
      presionBar: Number(form.presionBar),
      tiempoMesetaMin: Number(form.tiempoMesetaMin),
      resultado: form.resultado,
      loteBiologico: form.tipoPrueba === "indicador_biologico" ? form.loteBiologico : undefined,
      operador: form.operador,
      observaciones: form.observaciones || "Prueba rutinaria de validación física y biológica.",
    };

    setControles([nuevo, ...controles]);
    toast.success("Control de calidad de esterilizador registrado exitosamente");
    setOpenModal(false);
  };

  const pruebaBadge = (tipo: ControlAutoclaveRegistro["tipoPrueba"]) => {
    switch (tipo) {
      case "bowie_dick":
        return <Badge variant="outline" className="text-[11px] font-semibold border-sky-500 text-sky-600">Test Bowie-Dick</Badge>;
      case "indicador_biologico":
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[11px]">Indicador Biológico (Esporas)</Badge>;
      case "prueba_vacio":
        return <Badge variant="secondary" className="text-[11px]">Prueba de Fuga de Vacío</Badge>;
      case "ciclo_rutina":
        return <Badge variant="outline" className="text-[11px]">Ciclo de Carga Estándar</Badge>;
    }
  };

  const resultadoBadge = (res: ControlAutoclaveRegistro["resultado"]) => {
    switch (res) {
      case "conforme":
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Conforme / Aprobado
          </Badge>
        );
      case "en_incubacion":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">
            <Clock className="h-3.5 w-3.5 mr-1 animate-pulse" /> En Incubación
          </Badge>
        );
      case "no_conforme":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3.5 w-3.5 mr-1" /> No Conforme / Bloqueado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Control Biológico, Físico y Químico de Autoclaves
          </h3>
          <p className="text-xs text-muted-foreground">
            Validación diaria según norma ISO 11138 e ISO 11140 para esterilización en vapor y plasma
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Control de Autoclave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Activity className="h-4 w-4 text-primary" />
                Registrar Test de Esterilizador
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <Label className="text-xs">Equipo Esterilizador</Label>
                <Select value={form.equipo} onValueChange={(v) => setForm({ ...form, equipo: v })}>
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Autoclave Principal 01 (Matachana 500L)">Autoclave 01 (Vapor 500L)</SelectItem>
                    <SelectItem value="Autoclave 02 (Tuttnauer 250L)">Autoclave 02 (Vapor 250L)</SelectItem>
                    <SelectItem value="Esterilizador Plasma H2O2 (Sterrad NX)">Plasma Peróxido (Sterrad NX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tipo de Prueba</Label>
                  <Select
                    value={form.tipoPrueba}
                    onValueChange={(v: any) => setForm({ ...form, tipoPrueba: v })}
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bowie_dick">Test de Bowie-Dick</SelectItem>
                      <SelectItem value="indicador_biologico">Indicador Biológico (Esporas)</SelectItem>
                      <SelectItem value="prueba_vacio">Prueba de Fuga de Vacío</SelectItem>
                      <SelectItem value="ciclo_rutina">Ciclo de Rutina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Resultado Obtenido</Label>
                  <Select
                    value={form.resultado}
                    onValueChange={(v: any) => setForm({ ...form, resultado: v })}
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conforme">Conforme (Aprobado)</SelectItem>
                      <SelectItem value="en_incubacion">En Incubación (Pendiente)</SelectItem>
                      <SelectItem value="no_conforme">No Conforme (Falla)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.temperaturaC}
                    onChange={(e) => setForm({ ...form, temperaturaC: parseFloat(e.target.value) || 0 })}
                    className="text-xs mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Presión (bar)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={form.presionBar}
                    onChange={(e) => setForm({ ...form, presionBar: parseFloat(e.target.value) || 0 })}
                    className="text-xs mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Meseta (min)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.tiempoMesetaMin}
                    onChange={(e) => setForm({ ...form, tiempoMesetaMin: parseFloat(e.target.value) || 0 })}
                    className="text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              {form.tipoPrueba === "indicador_biologico" && (
                <div>
                  <Label className="text-xs">Lote de Ampolla Biológica (G. stearothermophilus)</Label>
                  <Input
                    value={form.loteBiologico}
                    onChange={(e) => setForm({ ...form, loteBiologico: e.target.value })}
                    className="text-xs mt-1 font-mono"
                    placeholder="Lote BIO-2026-X"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">Observaciones Técnicas</Label>
                <Input
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="text-xs mt-1"
                  placeholder="Detalles de viraje o curva de presión..."
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button size="sm" onClick={handleCrear} className="w-full">
                Guardar Validación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-2.5">
        {controles.map((c) => (
          <Card key={c.id} className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{c.equipo}</span>
                    {pruebaBadge(c.tipoPrueba)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Responsable: <strong className="text-foreground">{c.operador}</strong> · Fecha: {c.fecha}
                  </p>
                </div>
                {resultadoBadge(c.resultado)}
              </div>

              <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30 rounded-xl text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-rose-500" />
                  <span>Temp: <strong className="font-mono text-foreground">{c.temperaturaC}°C</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-sky-500" />
                  <span>Presión: <strong className="font-mono text-foreground">{c.presionBar} bar</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Meseta: <strong className="font-mono text-foreground">{c.tiempoMesetaMin} min</strong></span>
                </div>
              </div>

              {c.observaciones && (
                <p className="text-[11px] text-muted-foreground italic px-1">
                  Nota: {c.observaciones}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
