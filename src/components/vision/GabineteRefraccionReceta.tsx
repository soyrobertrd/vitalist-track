import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Glasses, FileText, Send, Printer, RotateCcw, CheckCircle2, ShieldCheck, User, Sparkles, AlertCircle, Compass } from "lucide-react";
import { toast } from "sonner";

interface GraduacionOjo {
  esfera: string;
  cilindro: string;
  eje: string;
  adicion: string;
  dp: string;
  agudezaVisualSin: string;
  agudezaVisualCon: string;
}

export default function GabineteRefraccionReceta() {
  const [paciente, setPaciente] = useState({
    nombre: "Manuel Antonio Rivas",
    edad: 48,
    telefono: "809-555-8932",
    ocupacion: "Diseñador Gráfico / Trabajo en Pantallas",
  });

  const [od, setOd] = useState<GraduacionOjo>({
    esfera: "-1.75",
    cilindro: "-0.75",
    eje: "85",
    adicion: "+1.75",
    dp: "31.5",
    agudezaVisualSin: "20/60",
    agudezaVisualCon: "20/20",
  });

  const [oi, setOi] = useState<GraduacionOjo>({
    esfera: "-2.00",
    cilindro: "-1.00",
    eje: "95",
    adicion: "+1.75",
    dp: "32.0",
    agudezaVisualSin: "20/80",
    agudezaVisualCon: "20/20",
  });

  const [tipoLente, setTipoLente] = useState("progresivo_digital");
  const [material, setMaterial] = useState("policarbonato");
  const [tratamientos, setTratamientos] = useState({
    antirreflejo: true,
    filtroAzul: true,
    fotocromatico: false,
    polarizado: false,
  });

  const [observaciones, setObservaciones] = useState(
    "Uso permanente para visión lejana y lectura digital prolongada. Refracción bajo control con foróptero."
  );

  // Lienzo Canvas de firma del especialista
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
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
    setHasSignature(false);
  };

  const enviarRecetaWhatsApp = () => {
    const texto = `👓 *RECETA OFTÁLMICA / ÓPTICA OFICIAL* 👓
Optometría & Oftalmología Especializada

👤 *Paciente:* ${paciente.nombre} (${paciente.edad} años)
📅 *Fecha:* ${new Date().toLocaleDateString("es-DO")}

👁️ *OJO DERECHO (OD):*
• Esfera: ${od.esfera} | Cilindro: ${od.cilindro} | Eje: ${od.eje}°
• ADD (Cerca): ${od.adicion} | DP: ${od.dp} mm
• Agudeza visual: ${od.agudezaVisualCon}

👁️ *OJO IZQUIERDO (OI):*
• Esfera: ${oi.esfera} | Cilindro: ${oi.cilindro} | Eje: ${oi.eje}°
• ADD (Cerca): ${oi.adicion} | DP: ${oi.dp} mm
• Agudeza visual: ${oi.agudezaVisualCon}

🔍 *Diseño Óptico Recomendado:*
• Tipo: ${tipoLente.replace(/_/g, " ").toUpperCase()}
• Material: ${material.toUpperCase()}
• Tratamientos: ${tratamientos.filtroAzul ? "Filtro Blue Block ✓ " : ""}${tratamientos.antirreflejo ? "Antirreflejo ✓ " : ""}${tratamientos.fotocromatico ? "Fotocromático Transitions ✓ " : ""}

📝 *Observaciones:* ${observaciones}
👨‍⚕️ *Firma y Exequátur:* Registrado en sistema clínico.`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Receta oftálmica formateada y abierta en WhatsApp.");
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-500" />
            Gabinete de Refracción & Prescripción Oftálmica Digital
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Graduación clínica esfero-cilíndrica, cálculo de adición para presbicia, DP pupilar y firma digital.
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
            Imprimir Receta
          </Button>

          <Button
            size="sm"
            onClick={enviarRecetaWhatsApp}
            className="rounded-xl h-9 text-xs gap-1.5 shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar Receta WhatsApp
          </Button>
        </div>
      </div>

      {/* Datos del Paciente */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nombre del Paciente</Label>
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
          <div className="space-y-1">
            <Label className="text-xs">Teléfono / WhatsApp</Label>
            <Input
              value={paciente.telefono}
              onChange={(e) => setPaciente({ ...paciente, telefono: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ocupación / Uso Visual</Label>
            <Input
              value={paciente.ocupacion}
              onChange={(e) => setPaciente({ ...paciente, ocupacion: e.target.value })}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ficha de Refracción: Ojo Derecho (OD) vs Ojo Izquierdo (OI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OJO DERECHO (OD) */}
        <Card className="rounded-2xl border-border/80 shadow-none border-blue-500/20 bg-blue-50/5 dark:bg-blue-950/5">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> OD — Ojo Derecho
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                AV Corregida: {od.agudezaVisualCon}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Esfera (SPH)</Label>
                <Input
                  value={od.esfera}
                  onChange={(e) => setOd({ ...od, esfera: e.target.value })}
                  placeholder="-0.00 / +0.00"
                  className="h-9 text-xs font-mono font-bold rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cilindro (CYL)</Label>
                <Input
                  value={od.cilindro}
                  onChange={(e) => setOd({ ...od, cilindro: e.target.value })}
                  placeholder="-0.00"
                  className="h-9 text-xs font-mono font-bold rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Eje (AXIS °)</Label>
                <Input
                  value={od.eje}
                  onChange={(e) => setOd({ ...od, eje: e.target.value })}
                  placeholder="0° - 180°"
                  className="h-9 text-xs font-mono font-bold rounded-xl text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">Adición (ADD)</Label>
                <Input
                  value={od.adicion}
                  onChange={(e) => setOd({ ...od, adicion: e.target.value })}
                  placeholder="+0.00"
                  className="h-9 text-xs font-mono rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DP Mono (mm)</Label>
                <Input
                  value={od.dp}
                  onChange={(e) => setOd({ ...od, dp: e.target.value })}
                  placeholder="31.5"
                  className="h-9 text-xs font-mono rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">AV Sin Corrección</Label>
                <Input
                  value={od.agudezaVisualSin}
                  onChange={(e) => setOd({ ...od, agudezaVisualSin: e.target.value })}
                  placeholder="20/60"
                  className="h-9 text-xs font-mono rounded-xl text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OJO IZQUIERDO (OI) */}
        <Card className="rounded-2xl border-border/80 shadow-none border-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between text-indigo-600 dark:text-indigo-400">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> OI — Ojo Izquierdo
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                AV Corregida: {oi.agudezaVisualCon}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Esfera (SPH)</Label>
                <Input
                  value={oi.esfera}
                  onChange={(e) => setOi({ ...oi, esfera: e.target.value })}
                  placeholder="-0.00 / +0.00"
                  className="h-9 text-xs font-mono font-bold rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cilindro (CYL)</Label>
                <Input
                  value={oi.cilindro}
                  onChange={(e) => setOi({ ...oi, cilindro: e.target.value })}
                  placeholder="-0.00"
                  className="h-9 text-xs font-mono font-bold rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Eje (AXIS °)</Label>
                <Input
                  value={oi.eje}
                  onChange={(e) => setOi({ ...oi, eje: e.target.value })}
                  placeholder="0° - 180°"
                  className="h-9 text-xs font-mono font-bold rounded-xl text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">Adición (ADD)</Label>
                <Input
                  value={oi.adicion}
                  onChange={(e) => setOi({ ...oi, adicion: e.target.value })}
                  placeholder="+0.00"
                  className="h-9 text-xs font-mono rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DP Mono (mm)</Label>
                <Input
                  value={oi.dp}
                  onChange={(e) => setOi({ ...oi, dp: e.target.value })}
                  placeholder="32.0"
                  className="h-9 text-xs font-mono rounded-xl text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">AV Sin Corrección</Label>
                <Input
                  value={oi.agudezaVisualSin}
                  onChange={(e) => setOi({ ...oi, agudezaVisualSin: e.target.value })}
                  placeholder="20/80"
                  className="h-9 text-xs font-mono rounded-xl text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Especificaciones de Cristales & Tratamientos */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
            <Glasses className="h-4 w-4 text-primary" />
            Especificación Óptica de Laboratorio (Lentes & Tratamientos)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Diseño Óptico Recomendado</Label>
              <Select value={tipoLente} onValueChange={setTipoLente}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monofocal">Monofocal (Visión Lejana / Lectura)</SelectItem>
                  <SelectItem value="bifocal_kryptok">Bifocal Flattop / Invisible</SelectItem>
                  <SelectItem value="progresivo_digital">Progresivo / Multifocal Digital Free-Form</SelectItem>
                  <SelectItem value="lentes_contacto_toricos">Lentes de Contacto Blandos Tóricos</SelectItem>
                  <SelectItem value="lentes_contacto_multifocales">Lentes de Contacto Multifocales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Material del Lente / Índice de Refracción</Label>
              <Select value={material} onValueChange={setMaterial}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cr39">Orgánico CR-39 (Índice 1.50 - Económico)</SelectItem>
                  <SelectItem value="policarbonato">Policarbonato Airwear (Índice 1.59 - Resistente a impactos)</SelectItem>
                  <SelectItem value="alto_indice_167">Alto Índice 1.67 (Para altas dioptrías - Delgado)</SelectItem>
                  <SelectItem value="ultra_delgado_174">Ultra Delgado 1.74 (Estética premium dioptrías {">"} 5D)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Tratamientos Adicionales de Superficie</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2 border border-border/70 p-2.5 rounded-xl bg-card">
                <Checkbox
                  id="ar"
                  checked={tratamientos.antirreflejo}
                  onCheckedChange={(c) => setTratamientos({ ...tratamientos, antirreflejo: !!c })}
                />
                <label htmlFor="ar" className="text-xs font-medium cursor-pointer">
                  Antirreflejo Green
                </label>
              </div>

              <div className="flex items-center space-x-2 border border-border/70 p-2.5 rounded-xl bg-card">
                <Checkbox
                  id="blue"
                  checked={tratamientos.filtroAzul}
                  onCheckedChange={(c) => setTratamientos({ ...tratamientos, filtroAzul: !!c })}
                />
                <label htmlFor="blue" className="text-xs font-medium cursor-pointer">
                  Filtro Luz Azul (Blue Block)
                </label>
              </div>

              <div className="flex items-center space-x-2 border border-border/70 p-2.5 rounded-xl bg-card">
                <Checkbox
                  id="foto"
                  checked={tratamientos.fotocromatico}
                  onCheckedChange={(c) => setTratamientos({ ...tratamientos, fotocromatico: !!c })}
                />
                <label htmlFor="foto" className="text-xs font-medium cursor-pointer">
                  Fotocromático Transitions
                </label>
              </div>

              <div className="flex items-center space-x-2 border border-border/70 p-2.5 rounded-xl bg-card">
                <Checkbox
                  id="pola"
                  checked={tratamientos.polarizado}
                  onCheckedChange={(c) => setTratamientos({ ...tratamientos, polarizado: !!c })}
                />
                <label htmlFor="pola" className="text-xs font-medium cursor-pointer">
                  Polarizado (Sol HD)
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observaciones Clínicas o Instrucciones para el Montaje</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Firma Digital del Optometrista / Oftalmólogo */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center justify-between text-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Validación y Firma Digital del Profesional (Exequátur)
            </span>
            {hasSignature && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                Firma validada ✓
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 max-w-sm">
            <p className="text-xs font-semibold text-foreground">Lic. Roberto Guzman, OD</p>
            <p className="text-[11px] text-muted-foreground">Optometrista Clínico · Exequátur Ley 42-01</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
              Firma digital válida para despachos de monturas y lentes en ópticas nacionales y laboratorios de tallado digital.
            </p>
          </div>

          <div className="space-y-2 flex flex-col items-center">
            <div className="border border-border/80 rounded-xl bg-white overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={280}
                height={100}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair block touch-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={limpiarFirma}
                className="h-7 text-[11px] text-muted-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Limpiar firma
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
