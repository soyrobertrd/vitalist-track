import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileSignature,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Printer,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

export interface RegistroConsentimientoQuirurgico {
  id: string;
  pacienteNombre: string;
  tipoProcedimiento: "cirugia" | "anestesia" | "transfusion" | "endoscopia";
  nombreProcedimiento: string;
  medicoResponsable: string;
  testigoNombre: string;
  firmaUrl: string;
  firmanteNombre: string;
  parentesco: string;
  fechaHora: string;
}

interface ConsentimientoQuirurgicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNombre: string;
  onGuardarConsentimiento: (datos: RegistroConsentimientoQuirurgico) => void;
}

export function ConsentimientoQuirurgicoModal({
  open,
  onOpenChange,
  pacienteNombre,
  onGuardarConsentimiento,
}: ConsentimientoQuirurgicoModalProps) {
  const [tipoProcedimiento, setTipoProcedimiento] = useState<"cirugia" | "anestesia" | "transfusion" | "endoscopia">("cirugia");
  const [nombreProcedimiento, setNombreProcedimiento] = useState("Colecistectomía Laparoscópica");
  const [medicoResponsable, setMedicoResponsable] = useState("Dr. Fernando Castillo (Cirujano General)");
  const [testigoNombre, setTestigoNombre] = useState("Lic. Laura Peña (Enfermera Instrumentista)");
  const [firmanteNombre, setFirmanteNombre] = useState(pacienteNombre);
  const [parentesco, setParentesco] = useState("Paciente");

  const [aceptaRiesgos, setAceptaRiesgos] = useState(false);
  const [aceptaAlternativas, setAceptaAlternativas] = useState(false);
  const [aceptaEmergencia, setAceptaEmergencia] = useState(false);

  // Canvas táctil para firma
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleGuardar = () => {
    if (!hasSignature) {
      toast.error("El paciente o familiar debe firmar en el recuadro digital.");
      return;
    }
    if (!aceptaRiesgos || !aceptaAlternativas) {
      toast.error("Debe marcar las casillas obligatorias de aceptación informada.");
      return;
    }

    const canvas = canvasRef.current;
    const firmaUrl = canvas ? canvas.toDataURL("image/png") : "";

    const nuevoRegistro: RegistroConsentimientoQuirurgico = {
      id: "consent-" + Date.now(),
      pacienteNombre,
      tipoProcedimiento,
      nombreProcedimiento,
      medicoResponsable,
      testigoNombre,
      firmaUrl,
      firmanteNombre,
      parentesco,
      fechaHora: new Date().toLocaleString(),
    };

    onGuardarConsentimiento(nuevoRegistro);
    toast.success("Consentimiento quirúrgico registrado y blindado legalmente.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300 gap-1 text-[11px]">
              <Scale className="h-3.5 w-3.5" /> Bioética & Acreditación Hospitalaria
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-foreground mt-2">
            Consentimiento Informado para Procedimiento Quirúrgico / Invasivo
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Documento médico-legal obligatorio previo a intervenciones quirúrgicas, anestésicas o invasivas.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Datos del Procedimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/80">
            <div>
              <Label className="text-[11px]">Tipo de Intervención</Label>
              <Select
                value={tipoProcedimiento}
                onValueChange={(v: any) => setTipoProcedimiento(v)}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cirugia">Cirugía Mayor / Menor</SelectItem>
                  <SelectItem value="anestesia">Anestesia General / Neuroaxial</SelectItem>
                  <SelectItem value="transfusion">Transfusión de Hemoderivados</SelectItem>
                  <SelectItem value="endoscopia">Procedimiento Endoscópico / Cateterismo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px]">Nombre del Procedimiento</Label>
              <Input
                value={nombreProcedimiento}
                onChange={e => setNombreProcedimiento(e.target.value)}
                className="h-8 text-xs rounded-xl mt-1 bg-background"
              />
            </div>

            <div>
              <Label className="text-[11px]">Médico Especialista Responsable</Label>
              <Input
                value={medicoResponsable}
                onChange={e => setMedicoResponsable(e.target.value)}
                className="h-8 text-xs rounded-xl mt-1 bg-background"
              />
            </div>

            <div>
              <Label className="text-[11px]">Testigo Asistencial Calificado</Label>
              <Input
                value={testigoNombre}
                onChange={e => setTestigoNombre(e.target.value)}
                className="h-8 text-xs rounded-xl mt-1 bg-background"
              />
            </div>
          </div>

          {/* Declaración de Riesgos y Beneficios */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
            <span className="font-bold text-amber-900 dark:text-amber-300 block">
              Declaración y Cláusulas Ético-Legales:
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Declaro que el médico tratante me ha explicado en lenguaje claro la naturaleza de la intervención{" "}
              <strong>{nombreProcedimiento}</strong>, sus beneficios esperados, alternativas y los riesgos inherentes
              (infección, sangrado, reacciones adversas y necesidad de conversión quirúrgica en caso fortuito).
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="q1" checked={aceptaRiesgos} onCheckedChange={c => setAceptaRiesgos(!!c)} />
                <label htmlFor="q1" className="text-[11px] leading-tight cursor-pointer">
                  He recibido explicaciones satisfactorias y resuelto todas mis dudas sobre los riesgos y cuidados postoperatorios.
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="q2" checked={aceptaAlternativas} onCheckedChange={c => setAceptaAlternativas(!!c)} />
                <label htmlFor="q2" className="text-[11px] leading-tight cursor-pointer">
                  Comprendo las consecuencias de no realizar el procedimiento y consiento libremente su ejecución.
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="q3" checked={aceptaEmergencia} onCheckedChange={c => setAceptaEmergencia(!!c)} />
                <label htmlFor="q3" className="text-[11px] leading-tight cursor-pointer">
                  Autorizo la realización de maniobras adicionales imprevistas si fuesen requeridas para preservar mi vida o salud.
                </label>
              </div>
            </div>
          </div>

          {/* Datos del Firmante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Nombre del Firmante</Label>
              <Input
                value={firmanteNombre}
                onChange={e => setFirmanteNombre(e.target.value)}
                className="h-8 text-xs rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px]">Parentesco / Condición</Label>
              <Input
                value={parentesco}
                onChange={e => setParentesco(e.target.value)}
                placeholder="Paciente / Cónyuge / Tutor Legal"
                className="h-8 text-xs rounded-xl mt-1"
              />
            </div>
          </div>

          {/* Lienzo Canvas de Firma Táctil */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <FileSignature className="h-4 w-4 text-teal-600" />
                Firma Digital en Pantalla del Paciente o Tutor Legal:
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCanvas}
                className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Limpiar Trazo
              </Button>
            </div>

            <div className="border-2 border-dashed border-border/80 rounded-xl bg-card overflow-hidden touch-none relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-32 cursor-crosshair bg-white dark:bg-slate-100"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                  Dibuje la firma aquí con el dedo o stylus...
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleGuardar}
            disabled={!hasSignature || !aceptaRiesgos || !aceptaAlternativas}
            className="rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Certificar Consentimiento Quirúrgico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
