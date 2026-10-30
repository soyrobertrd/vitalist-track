import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Siren, HeartPulse, CheckCircle2 } from "lucide-react";
import {
  NivelManchester,
  PacienteUrgencias,
  CONFIG_MANCHESTER,
  FLUJOGRAMAS_MTS,
  BOXES_URGENCIAS,
} from "@/data/urgencias-manchester";
import { toast } from "sonner";

interface NuevoTriajeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (paciente: PacienteUrgencias) => void;
}

export function NuevoTriajeModal({ open, onOpenChange, onGuardar }: NuevoTriajeModalProps) {
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaEdadSexo, setNuevaEdadSexo] = useState("45a / M");
  const [nuevoMotivo, setNuevoMotivo] = useState("");
  const [flujogramaSel, setFlujogramaSel] = useState("dolor_toracico");
  const [discriminadorSel, setDiscriminadorSel] = useState("");
  const [nivelCalculado, setNivelCalculado] = useState<NivelManchester>(3);
  const [boxAsignar, setBoxAsignar] = useState("");

  // Signos vitales
  const [ta, setTa] = useState("120/80");
  const [fc, setFc] = useState("80");
  const [fr, setFr] = useState("18");
  const [spo2, setSpo2] = useState("98");
  const [temp, setTemp] = useState("36.5");
  const [eva, setEva] = useState("4");
  const [glasgow, setGlasgow] = useState("15");
  const [obs, setObs] = useState("");

  const flujoActual = FLUJOGRAMAS_MTS.find((f) => f.id === flujogramaSel);

  const handleSeleccionarDiscriminador = (d: { texto: string; nivel: number }) => {
    setDiscriminadorSel(d.texto);
    setNivelCalculado(d.nivel as NivelManchester);
  };

  const handleGuardar = () => {
    if (!nuevoNombre.trim() || !nuevoMotivo.trim()) {
      toast.error("Complete el nombre del paciente y el motivo de consulta.");
      return;
    }

    const nuevo: PacienteUrgencias = {
      id: `URG-2026-${Math.floor(100 + Math.random() * 899)}`,
      paciente_nombre: nuevoNombre,
      edad_sexo: nuevaEdadSexo,
      motivo_consulta: nuevoMotivo,
      flujograma: flujoActual?.nombre || "General",
      discriminador: discriminadorSel || "Sin discriminador crítico específico",
      nivel: nivelCalculado,
      hora_llegada: new Date().toISOString(),
      hora_triage: new Date().toISOString(),
      estado: boxAsignar ? "en_atencion" : "en_espera",
      box_asignado: boxAsignar || undefined,
      signos_vitales: {
        ta,
        fc: parseInt(fc) || 80,
        fr: parseInt(fr) || 18,
        spo2: parseInt(spo2) || 98,
        temp: parseFloat(temp) || 36.5,
        eva: parseInt(eva) || 0,
        glasgow: parseInt(glasgow) || 15,
      },
      observaciones: obs,
      activacion_alerta: nivelCalculado === 1 ? "codigo_azul" : null,
    };

    onGuardar(nuevo);
    toast.success(`Paciente ${nuevo.paciente_nombre} clasificado en Nivel ${nuevo.nivel}`, {
      description: `Prioridad ${CONFIG_MANCHESTER[nuevo.nivel].nombre}. Tiempo máx: ${CONFIG_MANCHESTER[nuevo.nivel].prioridadTexto}`,
    });

    // Reset
    setNuevoNombre("");
    setNuevoMotivo("");
    setDiscriminadorSel("");
    setObs("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Siren className="h-5 w-5 text-rose-500" />
            Asistente de Clasificación Manchester (5 Niveles)
          </DialogTitle>
          <DialogDescription>
            Seleccione el flujograma clínico y el discriminador clave para determinar el nivel de urgencia objetiva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Datos Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nombre Completo del Paciente *</Label>
              <Input
                className="rounded-xl"
                placeholder="Ej: Ramón Valdez Santana"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Edad / Sexo</Label>
              <Input
                className="rounded-xl"
                placeholder="Ej: 48 años / M"
                value={nuevaEdadSexo}
                onChange={(e) => setNuevaEdadSexo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Motivo de Consulta Espontáneo *</Label>
            <Input
              className="rounded-xl"
              placeholder="Ej: Dolor retroesternal opresivo con sensación de falta de aire..."
              value={nuevoMotivo}
              onChange={(e) => setNuevoMotivo(e.target.value)}
            />
          </div>

          {/* Selector de Flujograma y Discriminadores Manchester */}
          <div className="space-y-2 border border-border/70 rounded-2xl p-3.5 bg-muted/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <Label className="text-xs font-bold text-foreground">1. Seleccionar Flujograma Clínico MTS</Label>
              <Select
                value={flujogramaSel}
                onValueChange={(val) => {
                  setFlujogramaSel(val);
                  setDiscriminadorSel("");
                }}
              >
                <SelectTrigger className="w-full sm:w-64 h-8 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLUJOGRAMAS_MTS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discriminadores específicos */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs text-muted-foreground">
                2. Discriminadores clave (orden jerárquico de gravedad):
              </Label>
              <div className="space-y-1.5">
                {flujoActual?.discriminadores.map((d, idx) => {
                  const cfg = CONFIG_MANCHESTER[d.nivel as NivelManchester];
                  const isSelected = discriminadorSel === d.texto;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSeleccionarDiscriminador(d)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all ${
                        isSelected
                          ? `${cfg.cardBorder} ${cfg.bgLight} ring-2 ring-primary font-medium`
                          : "border-border/60 hover:bg-muted/50"
                      }`}
                    >
                      <span className="flex-1 pr-2">{d.texto}</span>
                      <Badge className={`${cfg.badgeClass} text-[10px]`}>
                        {cfg.codigoColor.toUpperCase()} (Nivel {d.nivel})
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Captura de Signos Vitales */}
          <div className="border border-border/70 rounded-2xl p-3.5 space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-rose-500" />
              Signos Vitales y Triaje Físico
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <Label className="text-[11px] text-muted-foreground">TA (mmHg)</Label>
                <Input value={ta} onChange={(e) => setTa(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">FC (lpm)</Label>
                <Input type="number" value={fc} onChange={(e) => setFc(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">FR (rpm)</Label>
                <Input type="number" value={fr} onChange={(e) => setFr(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">SpO2 (%)</Label>
                <Input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Temp (°C)</Label>
                <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Dolor EVA (0-10)</Label>
                <Input type="number" min="0" max="10" value={eva} onChange={(e) => setEva(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Glasgow (3-15)</Label>
                <Input type="number" min="3" max="15" value={glasgow} onChange={(e) => setGlasgow(e.target.value)} className="h-8 rounded-lg font-mono" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Asignar Box</Label>
                <Select value={boxAsignar} onValueChange={setBoxAsignar}>
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue placeholder="Sala de Espera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sala de Espera">Sala de Espera</SelectItem>
                    {BOXES_URGENCIAS.map((b) => (
                      <SelectItem key={b.id} value={b.nombre}>
                        {b.id} - {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dictamen del Triaje */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${CONFIG_MANCHESTER[nivelCalculado].bgLight} ${CONFIG_MANCHESTER[nivelCalculado].cardBorder}`}
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                Dictamen MTS: <span className="capitalize">{CONFIG_MANCHESTER[nivelCalculado].nombre}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Tiempo límite de atención médica: <strong>{CONFIG_MANCHESTER[nivelCalculado].prioridadTexto}</strong>
              </p>
            </div>
            <Badge className={`${CONFIG_MANCHESTER[nivelCalculado].badgeClass} text-sm px-3 py-1 font-mono uppercase shadow-none`}>
              {CONFIG_MANCHESTER[nivelCalculado].codigoColor}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Observaciones Clínicas / Alergias Conocidas</Label>
            <Textarea
              placeholder="Alergias, medicación previa, hora de inicio del dolor o síntomas..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              className="text-xs rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" className="rounded-xl bg-primary text-white" onClick={handleGuardar}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Confirmar y Clasificar Paciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
