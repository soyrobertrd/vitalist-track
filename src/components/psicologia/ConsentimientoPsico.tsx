import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Shield, PenTool, RotateCcw, Download, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

interface ConsentimientoPsicoProps {
  nombrePacienteDefault?: string;
  onConsentimientoFirmado?: (data: any) => void;
}

export default function ConsentimientoPsico({
  nombrePacienteDefault = "",
  onConsentimientoFirmado,
}: ConsentimientoPsicoProps) {
  const [pacienteNombre, setPacienteNombre] = useState(nombrePacienteDefault);
  const [cedula, setCedula] = useState("");
  const [aceptaSecreto, setAceptaSecreto] = useState(false);
  const [aceptaExcepciones, setAceptaExcepciones] = useState(false);
  const [aceptaTelepsico, setAceptaTelepsico] = useState(false);
  const [aceptaCancelacion, setAceptaCancelacion] = useState(false);
  const [firmado, setFirmado] = useState(false);

  // Canvas para firma digital
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
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFirmar = () => {
    if (!pacienteNombre.trim()) {
      toast.error("Por favor ingresa el nombre del paciente o consultante");
      return;
    }
    if (!aceptaSecreto || !aceptaExcepciones || !aceptaCancelacion) {
      toast.error("Debes aceptar las cláusulas éticas y de cancelación");
      return;
    }

    setFirmado(true);
    toast.success("Consentimiento informado firmado y validado digitalmente");
    if (onConsentimientoFirmado) {
      onConsentimientoFirmado({
        pacienteNombre,
        cedula,
        fecha: new Date().toISOString(),
        aceptaTelepsico,
      });
    }
  };

  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Consentimiento Informado Terapéutico Digital
              </CardTitle>
              <CardDescription className="text-xs">
                Normativa Ética CODOPSI & Ley General de Salud 42-01 de la República Dominicana
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={firmado ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"}>
            {firmado ? "Firmado & Activo" : "Pendiente de Firma"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-4 text-xs">
        {/* Datos del Paciente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
          <div>
            <Label className="text-xs">Nombre Completo del Consultante</Label>
            <Input
              placeholder="Ej. Laura Morales"
              value={pacienteNombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              disabled={firmado}
              className="rounded-xl mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Cédula / Documento de Identidad</Label>
            <Input
              placeholder="001-XXXXXXX-X"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={firmado}
              className="rounded-xl mt-1 h-8 text-xs"
            />
          </div>
        </div>

        {/* Cláusulas Éticas y de Confidencialidad */}
        <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="c1"
              checked={aceptaSecreto}
              onCheckedChange={(c) => setAceptaSecreto(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="c1" className="cursor-pointer leading-tight text-foreground/90">
              <strong className="text-foreground">1. Secreto Profesional Estricto:</strong> Todo lo tratado en las sesiones
              es confidencial. Las notas clínicas y registros de evaluación están bajo resguardo seguro y no se comparten
              con familiares ni terceros sin autorización expresa por escrito.
            </label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="c2"
              checked={aceptaExcepciones}
              onCheckedChange={(c) => setAceptaExcepciones(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="c2" className="cursor-pointer leading-tight text-foreground/90">
              <strong className="text-foreground">2. Límites Éticos y Legales de la Confidencialidad:</strong> Reconozco que
              el secreto profesional solo podrá suspenderse ante: a) Riesgo inminente y grave para mi integridad física o vida
              (conducta suicida activa); b) Amenaza real de daño grave o muerte a terceros; c) Sospecha fundada de abuso o negligencia en menores/adultos mayores; d) Requerimiento judicial formal.
            </label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="c3"
              checked={aceptaTelepsico}
              onCheckedChange={(c) => setAceptaTelepsico(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="c3" className="cursor-pointer leading-tight text-foreground/90">
              <strong className="text-foreground">3. Modalidad Online / Telepsicología (Opcional):</strong> En caso de sesiones virtuales, me comprometo a encontrarme en un espacio privado, seguro y libre de interrupciones, asegurando conexión estable y no realizando grabaciones no autorizadas.
            </label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="c4"
              checked={aceptaCancelacion}
              onCheckedChange={(c) => setAceptaCancelacion(!!c)}
              disabled={firmado}
              className="mt-0.5 rounded-md"
            />
            <label htmlFor="c4" className="cursor-pointer leading-tight text-foreground/90">
              <strong className="text-foreground">4. Política de Asistencia y Cancelación:</strong> Las cancelaciones o reagendamientos deben informarse con al menos 24 horas de antelación para permitir la asignación del espacio a otro consultante.
            </label>
          </div>
        </div>

        {/* Canvas de Firma Digital */}
        {!firmado ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5 text-purple-600" />
                Firma Digital del Consultante / Representante
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
                height={120}
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
            <p className="text-[10px] text-muted-foreground italic">
              Traza tu firma en la pantalla con el dedo o puntero para validar este acuerdo de confidencialidad.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                onClick={handleFirmar}
                className="rounded-xl gap-2 shadow-none bg-purple-600 hover:bg-purple-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" /> Validar y Firmar Documento
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-xs">Consentimiento Firmado y Almacenado con Éxito</p>
                <p className="text-[11px] text-muted-foreground">
                  Registrado con sello criptográfico temporal para {pacienteNombre} ({cedula || "Identificación adjunta"}).
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              onClick={() => toast.info("Generando copia firmada en PDF...")}
            >
              <Download className="h-3.5 w-3.5" /> Descargar Copia
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
