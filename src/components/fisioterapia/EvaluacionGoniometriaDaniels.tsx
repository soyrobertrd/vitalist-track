import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Dumbbell, HeartPulse, CheckCircle2, RotateCcw, AlertCircle, Sparkles, User, Save, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ArticulacionRango {
  nombre: string;
  movimiento: string;
  rangoNormal: string;
  gradosMedidos: number;
  escalaDaniels: number; // 0 a 5
}

const RANGOS_REFERENCIA: Record<string, { movimiento: string; normal: string; defaultGrados: number }> = {
  hombro_flexion: { movimiento: "Flexión de Hombro", normal: "0° - 180°", defaultGrados: 130 },
  hombro_abduccion: { movimiento: "Abducción de Hombro", normal: "0° - 180°", defaultGrados: 120 },
  hombro_rot_externa: { movimiento: "Rotación Externa de Hombro", normal: "0° - 90°", defaultGrados: 60 },
  rodilla_flexion: { movimiento: "Flexión de Rodilla", normal: "0° - 135°", defaultGrados: 95 },
  rodilla_extension: { movimiento: "Extensión de Rodilla", normal: "0° - 10° (hiperext)", defaultGrados: 0 },
  tobillo_dorsiflexion: { movimiento: "Dorsiflexión de Tobillo", normal: "0° - 20°", defaultGrados: 10 },
  tobillo_plantiflexion: { movimiento: "Plantiflexión de Tobillo", normal: "0° - 50°", defaultGrados: 35 },
  columna_cervical_flexion: { movimiento: "Flexión Cervical", normal: "0° - 45°", defaultGrados: 30 },
  columna_lumbar_flexion: { movimiento: "Flexión Lumbar (Dedos-Suelo)", normal: "0° - 80°", defaultGrados: 50 },
};

const DANIELS_DESCRIPCION: Record<number, { etiqueta: string; detalle: string }> = {
  0: { etiqueta: "0 / 5 - Nula", detalle: "Sin contracción muscular palpable ni visible." },
  1: { etiqueta: "1 / 5 - Vestigios", detalle: "Evidencia de contracción leve, pero sin movimiento articular." },
  2: { etiqueta: "2 / 5 - Escasa", detalle: "Movimiento articular completo únicamente sin gravedad." },
  3: { etiqueta: "3 / 5 - Regular", detalle: "Movimiento completo contra la gravedad, sin resistencia." },
  4: { etiqueta: "4 / 5 - Buena", detalle: "Movimiento completo contra gravedad y resistencia moderada." },
  5: { etiqueta: "5 / 5 - Normal", detalle: "Fuerza muscular óptima contra resistencia máxima del evaluador." },
};

export default function EvaluacionGoniometriaDaniels() {
  const [paciente, setPaciente] = useState({
    nombre: "Alejandro Mendoza Santos",
    edad: 34,
    diagnosticoMedico: "Post-quirúrgico LCA Rodilla Derecha (Semana 4) + Tendinopatía Patelar",
    dolorEVA: 6, // 0 a 10
  });

  const [articulacionKey, setArticulacionKey] = useState<string>("rodilla_flexion");
  const [grados, setGrados] = useState<number>(95);
  const [daniels, setDaniels] = useState<number>(3);
  const [lado, setLado] = useState<"derecho" | "izquierdo" | "bilateral">("derecho");
  const [tipoDolor, setTipoDolor] = useState<string>("punzante");
  const [objetivos, setObjetivos] = useState(
    "1. Ganar rango de flexión a 120° en 3 semanas.\n2. Fortalecimiento excéntrico de cuádriceps (Daniels 4/5).\n3. Reeducación del patrón de marcha sin muletas."
  );

  const [historialEvaluaciones, setHistorialEvaluaciones] = useState<
    Array<{
      id: string;
      fecha: string;
      articulacion: string;
      lado: string;
      grados: number;
      daniels: number;
      eva: number;
    }>
  >([
    {
      id: "ev-1",
      fecha: "2026-10-15",
      articulacion: "Flexión de Rodilla",
      lado: "derecho",
      grados: 75,
      daniels: 2,
      eva: 8,
    },
    {
      id: "ev-2",
      fecha: "2026-10-28",
      articulacion: "Flexión de Rodilla",
      lado: "derecho",
      grados: 95,
      daniels: 3,
      eva: 5,
    },
  ]);

  const handleCambioArticulacion = (key: string) => {
    setArticulacionKey(key);
    if (RANGOS_REFERENCIA[key]) {
      setGrados(RANGOS_REFERENCIA[key].defaultGrados);
    }
  };

  const guardarEvaluacion = (e: React.FormEvent) => {
    e.preventDefault();
    const config = RANGOS_REFERENCIA[articulacionKey] || { movimiento: articulacionKey };
    const nueva = {
      id: `ev-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      articulacion: config.movimiento,
      lado,
      grados,
      daniels,
      eva: paciente.dolorEVA,
    };

    setHistorialEvaluaciones([nueva, ...historialEvaluaciones]);
    toast.success("Evaluación goniométrica y de fuerza registrada correctamente.");
  };

  const compartirWhatsApp = () => {
    const config = RANGOS_REFERENCIA[articulacionKey] || { movimiento: articulacionKey, normal: "—" };
    const texto = `🏃 *INFORME DE VALORACIÓN FISIOTERAPÉUTICA & KINESIOLOGÍA* 🏃
*Paciente:* ${paciente.nombre} (${paciente.edad} años)
*Diagnóstico:* ${paciente.diagnosticoMedico}
📅 *Fecha:* ${new Date().toLocaleDateString("es-DO")}

📐 *Goniometría Articular:*
• Movimiento: ${config.movimiento} (${lado.toUpperCase()})
• Rango Actual Medido: *${grados}°* (Rango Fisiológico Normal: ${config.normal})

💪 *Fuerza Muscular (Escala Daniels):*
• Calificación: *${daniels} / 5* — ${DANIELS_DESCRIPCION[daniels].detalle}

⚡ *Nivel de Dolor (Escala EVA):*
• *${paciente.dolorEVA} / 10* (${paciente.dolorEVA <= 3 ? "Leve" : paciente.dolorEVA <= 6 ? "Moderado" : "Severo"}) - Tipo: ${tipoDolor}

🎯 *Objetivos Terapéuticos:*
${objetivos}

¡Continuamos avanzando en tu rehabilitación funcional! ✨`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Informe abierto en WhatsApp.");
  };

  const refActual = RANGOS_REFERENCIA[articulacionKey] || { normal: "0° - 180°", movimiento: articulacionKey };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Valoración Goniométrica, Escala Daniels & Escala del Dolor (EVA)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Medición de grados articulares, balance muscular manual (0 a 5) y evolución funcional biomecánica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl h-9 text-xs gap-1.5 shadow-none"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Informe
          </Button>

          <Button
            size="sm"
            onClick={compartirWhatsApp}
            className="rounded-xl h-9 text-xs gap-1.5 shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartir WhatsApp
          </Button>
        </div>
      </div>

      {/* Datos del Paciente y Diagnóstico Funcional */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Paciente</Label>
            <Input
              value={paciente.nombre}
              onChange={(e) => setPaciente({ ...paciente, nombre: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Edad</Label>
            <Input
              type="number"
              value={paciente.edad}
              onChange={(e) => setPaciente({ ...paciente, edad: parseInt(e.target.value) || 0 })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <Label className="text-xs">Diagnóstico Traumatológico / Fisiátrico</Label>
            <Input
              value={paciente.diagnosticoMedico}
              onChange={(e) => setPaciente({ ...paciente, diagnosticoMedico: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid: Goniometría a la izquierda + Daniels & Dolor a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOQUE GONIOMETRÍA */}
        <Card className="rounded-2xl border-border/80 shadow-none border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4" /> Goniometría Articular (Rango de Movimiento - ROM)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Normal: {refActual.normal}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Articulación y Movimiento</Label>
                <Select value={articulacionKey} onValueChange={handleCambioArticulacion}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hombro_flexion">Hombro - Flexión</SelectItem>
                    <SelectItem value="hombro_abduccion">Hombro - Abducción</SelectItem>
                    <SelectItem value="hombro_rot_externa">Hombro - Rotación Externa</SelectItem>
                    <SelectItem value="rodilla_flexion">Rodilla - Flexión</SelectItem>
                    <SelectItem value="rodilla_extension">Rodilla - Extensión</SelectItem>
                    <SelectItem value="tobillo_dorsiflexion">Tobillo - Dorsiflexión</SelectItem>
                    <SelectItem value="tobillo_plantiflexion">Tobillo - Plantiflexión</SelectItem>
                    <SelectItem value="columna_cervical_flexion">Columna Cervical - Flexión</SelectItem>
                    <SelectItem value="columna_lumbar_flexion">Columna Lumbar - Flexión</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Lado Evaluado</Label>
                <Select value={lado} onValueChange={(v: any) => setLado(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="derecho">Derecho</SelectItem>
                    <SelectItem value="izquierdo">Izquierdo</SelectItem>
                    <SelectItem value="bilateral">Bilateral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Slider de Grados Goniométricos */}
            <div className="space-y-2 pt-2 p-3 bg-muted/30 rounded-xl border border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Grados Medidos con Goniómetro:</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {grados}°
                </span>
              </div>
              <Slider
                value={[grados]}
                min={0}
                max={180}
                step={1}
                onValueChange={(val) => setGrados(val[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0° (Bloqueo)</span>
                <span>Referencia Fisiológica: {refActual.normal}</span>
                <span>180°</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOQUE DANIELS Y ESCALA EVA DOLOR */}
        <Card className="rounded-2xl border-border/80 shadow-none border-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4" /> Balance Muscular (Daniels) & Dolor (EVA)
              </span>
              <Badge
                variant={paciente.dolorEVA <= 3 ? "outline" : paciente.dolorEVA <= 6 ? "secondary" : "destructive"}
                className="text-[10px]"
              >
                EVA: {paciente.dolorEVA} / 10
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Escala Daniels (0 a 5) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Fuerza Muscular (Escala de Daniels 0-5)</Label>
              <Select value={daniels.toString()} onValueChange={(v) => setDaniels(parseInt(v) || 0)}>
                <SelectTrigger className="h-9 text-xs rounded-xl font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {DANIELS_DESCRIPCION[d].etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground italic">
                {DANIELS_DESCRIPCION[daniels].detalle}
              </p>
            </div>

            {/* Escala Visual Análoga (EVA 0 a 10) */}
            <div className="space-y-2 pt-1 p-3 bg-muted/30 rounded-xl border border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Intensidad del Dolor (EVA):</span>
                <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                  {paciente.dolorEVA} de 10
                </span>
              </div>
              <Slider
                value={[paciente.dolorEVA]}
                min={0}
                max={10}
                step={1}
                onValueChange={(val) => setPaciente({ ...paciente, dolorEVA: val[0] })}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span className="text-emerald-600">0 (Sin dolor)</span>
                <span className="text-amber-500">5 (Moderado)</span>
                <span className="text-rose-600">10 (Máximo insoportable)</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button onClick={guardarEvaluacion} size="sm" className="rounded-xl h-8 text-xs gap-1.5">
                <Save className="h-3.5 w-3.5" /> Registrar en Historial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial Evolutivo & Objetivos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evolución Goniométrica del Paciente
          </h3>
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {historialEvaluaciones.map((h) => (
                  <div key={h.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">
                        {h.articulacion} ({h.lado})
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        📅 Fecha: {h.fecha}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <div className="text-right">
                        <span className="text-emerald-600 font-bold">{h.grados}° ROM</span>
                        <p className="text-[10px] text-muted-foreground">Daniels: {h.daniels}/5</p>
                      </div>
                      <Badge variant={h.eva <= 3 ? "outline" : "secondary"} className="text-[10px]">
                        EVA: {h.eva}/10
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Objetivos Terapéuticos Funcionales
          </h3>
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="p-4 space-y-2">
              <Textarea
                value={objetivos}
                onChange={(e) => setObjetivos(e.target.value)}
                rows={5}
                className="text-xs rounded-xl leading-relaxed"
                placeholder="Metas a corto, mediano y largo plazo..."
              />
              <p className="text-[10px] text-muted-foreground">
                * Basado en las guías de práctica clínica de la WCPT (World Physiotherapy).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
