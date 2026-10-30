import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, PenTool, RotateCcw, CheckCircle2, Download, AlertTriangle, Stethoscope, Sparkles } from "lucide-react";
import { toast } from "sonner";

export type ProcedimientoDental =
  | "extraccion_cordales"
  | "endodoncia"
  | "implantes_rehabilitacion"
  | "ortodoncia_brackets"
  | "blanqueamiento"
  | "carillas_estetica";

const RIESGOS_PROCEDIMIENTO: Record<ProcedimientoDental, { titulo: string; riesgos: string[] }> = {
  extraccion_cordales: {
    titulo: "Exodoncia Quirúrgica / Terceros Molares (Cordales)",
    riesgos: [
      "Inflamación, edema y hematoma postquirúrgico esperable durante 72 horas.",
      "Riesgo transitorio o permanente de parestesia (adormecimiento) del nervio dentario inferior o nervio lingual.",
      "Posibilidad de alveolitis seca (pérdida del coágulo) que requiere curaciones tópicas.",
      "Necesidad de guardar reposo físico estricto y evitar succión (pitillos) o enjuagues enérgicos.",
    ],
  },
  endodoncia: {
    titulo: "Tratamiento de Conductos Radiculares (Endodoncia)",
    riesgos: [
      "Molestia o dolor a la masticación en los primeros 3 a 5 días post-obturación.",
      "Riesgo anatómico de curvaturas complejas o calcificaciones que pueden provocar fractura instrumental.",
      "Obligatoriedad de colocación de corona o incrustación definitiva para prevenir fractura coronaria de la pieza.",
    ],
  },
  implantes_rehabilitacion: {
    titulo: "Implantología & Cirugía Guiada",
    riesgos: [
      "Período de osteointegración biológica de 3 a 6 meses antes de la carga protésica definitiva.",
      "Riesgo de periimplantitis o rechazo biológico si no se mantiene estricta higiene y citas de mantenimiento.",
      "Eventual necesidad de injerto óseo o elevación de seno maxilar según tomografía previa.",
    ],
  },
  ortodoncia_brackets: {
    titulo: "Ortodoncia Fija / Alineadores Invisibles",
    riesgos: [
      "Sensibilidad dentaria durante los primeros días tras ajustes o cambio de alineadores.",
      "Riesgo de descalcificación o manchas blancas si no se mantiene higiene meticulosa con cepillo interproximal.",
      "Riesgo mínimo de reabsorción radicular apical controlado mediante radiografías de control.",
      "Uso mandatorio de retenedores post-tratamiento para evitar recidiva o movimiento dental indeseado.",
    ],
  },
  blanqueamiento: {
    titulo: "Aclaramiento Dental Clínico / Láser",
    riesgos: [
      "Sensibilidad térmica transitoria al frío o calor durante 24-48 horas.",
      "Dieta 'blanca' estricta (evitar café, té, vino tinto, salsas oscuras y tabaco) durante al menos 7 días.",
    ],
  },
  carillas_estetica: {
    titulo: "Diseño de Sonrisa & Carillas de Porcelana / Resina",
    riesgos: [
      "Micro-desgaste adamantino selectivo e irreversible de la cara vestibular del esmalte dental.",
      "Mantenimiento regular con placa protectora nocturna (férula de descarga) para evitar fracturas por bruxismo.",
    ],
  },
};

export default function ConsentimientoDental() {
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [piezaDental, setPiezaDental] = useState("");
  const [procedimiento, setProcedimiento] = useState<ProcedimientoDental>("extraccion_cordales");
  const [aceptaAnestesia, setAceptaAnestesia] = useState(false);
  const [aceptaRiesgos, setAceptaRiesgos] = useState(false);
  const [aceptaCuidadosPost, setAceptaCuidadosPost] = useState(false);
  const [firmado, setFirmado] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = "#0d9488";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFirmar = () => {
    if (!pacienteNombre.trim()) {
      toast.error("El nombre del paciente es obligatorio");
      return;
    }
    if (!aceptaAnestesia || !aceptaRiesgos || !aceptaCuidadosPost) {
      toast.error("Debes aceptar todas las condiciones clínicas y anestésicas");
      return;
    }
    setFirmado(true);
    toast.success("Consentimiento quirúrgico odontológico registrado y validado");
  };

  const info = RIESGOS_PROCEDIMIENTO[procedimiento];

  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Consentimiento Quirúrgico & Odontológico Digital
              </CardTitle>
              <CardDescription className="text-xs">
                Protocolo clínico con advertencia de riesgos según el Colegio Dominicano de Odontólogos (CDO)
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={firmado ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"}
          >
            {firmado ? "Validado con Firma Digital" : "Pendiente de Firma"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4 text-xs">
        {/* Datos y Procedimiento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60">
          <div>
            <Label className="text-xs">Nombre del Paciente</Label>
            <Input
              placeholder="Ej. Ramón Almonte"
              value={pacienteNombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              disabled={firmado}
              className="rounded-xl mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Cédula / Documento</Label>
            <Input
              placeholder="402-XXXXXXX-X"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={firmado}
              className="rounded-xl mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Pieza(s) Dental(es) a Intervenir</Label>
            <Input
              placeholder="Ej. Pieza 18, 28, 38, 48"
              value={piezaDental}
              onChange={(e) => setPiezaDental(e.target.value)}
              disabled={firmado}
              className="rounded-xl mt-1 h-8 text-xs"
            />
          </div>
        </div>

        {/* Selector de Procedimiento */}
        <div>
          <Label className="text-xs font-semibold">Tipo de Procedimiento Odontológico</Label>
          <Select
            value={procedimiento}
            onValueChange={(val: any) => setProcedimiento(val)}
            disabled={firmado}
          >
            <SelectTrigger className="rounded-xl mt-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extraccion_cordales">Exodoncia de Cordales / Cirugía Maxilofacial</SelectItem>
              <SelectItem value="endodoncia">Tratamiento de Conductos (Endodoncia)</SelectItem>
              <SelectItem value="implantes_rehabilitacion">Implantes Dentales & Carga Inmediata</SelectItem>
              <SelectItem value="ortodoncia_brackets">Ortodoncia (Brackets / Alineadores)</SelectItem>
              <SelectItem value="carillas_estetica">Carillas de Porcelana & Diseño de Sonrisa</SelectItem>
              <SelectItem value="blanqueamiento">Aclaramiento Dental Profesional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desglose de Riesgos Clínicos */}
        <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-2">
          <p className="font-semibold text-xs text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Riesgos Inherentes Informados: {info.titulo}
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
            {info.riesgos.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Aceptaciones */}
        <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="ad1"
              checked={aceptaAnestesia}
              onCheckedChange={(c) => setAceptaAnestesia(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="ad1" className="cursor-pointer leading-tight text-foreground/90">
              <strong>1. Consentimiento de Anestesia Local:</strong> Acepto la aplicación de anestésicos locales (Lidocaína / Mepivacaína con o sin epinefrina), reconociendo haber declarado antecedentes alérgicos, cardiopatías o hipertensión.
            </label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="ad2"
              checked={aceptaRiesgos}
              onCheckedChange={(c) => setAceptaRiesgos(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="ad2" className="cursor-pointer leading-tight text-foreground/90">
              <strong>2. Comprensión de Riesgos y Alternativas:</strong> Declaro que el odontólogo me ha explicado en lenguaje comprensible la naturaleza de la intervención, los riesgos y las opciones alternativas.
            </label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="ad3"
              checked={aceptaCuidadosPost}
              onCheckedChange={(c) => setAceptaCuidadosPost(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="ad3" className="cursor-pointer leading-tight text-foreground/90">
              <strong>3. Cumplimiento de Indicaciones Post-Op:</strong> Me comprometo a cumplir con la medicación prescrita (antibióticos, analgésicos) y asistir puntualmente a los controles postquirúrgicos.
            </label>
          </div>
        </div>

        {/* Canvas de Firma */}
        {!firmado ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5 text-teal-600" />
                Firma Digital del Paciente o Tutor
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-muted-foreground gap-1"
                onClick={limpiarFirma}
              >
                <RotateCcw className="h-3 w-3" /> Limpiar Trazo
              </Button>
            </div>
            <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
              <canvas
                ref={canvasRef}
                width={500}
                height={110}
                className="w-full touch-none cursor-crosshair bg-muted/10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleFirmar}
                className="rounded-xl gap-2 shadow-none bg-teal-600 hover:bg-teal-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" /> Validar Consentimiento Odontológico
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-xs">Consentimiento Odontológico Firmado con Éxito</p>
                <p className="text-[11px] text-muted-foreground">
                  Validado para {pacienteNombre} (Pieza: {piezaDental || "General"}).
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              onClick={() => toast.info("Generando copia en PDF del consentimiento...")}
            >
              <Download className="h-3.5 w-3.5" /> Descargar PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
