import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ShieldAlert, PenTool, RotateCcw, CheckCircle2, Download, AlertTriangle, Heart, User, Sun, Droplets, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export interface BonoSesion {
  id: string;
  tratamiento: string;
  totalSesiones: number;
  sesionesRealizadas: number;
}

const FITZPATRICK_DATA: Record<string, { label: string; caracteristicas: string; reaccionSolar: string }> = {
  I: { label: "Tipo I (Muy Clara / Albina)", caracteristicas: "Ojos claros, cabello pelirrojo o rubio", reaccionSolar: "Siempre se quema, nunca se broncea" },
  II: { label: "Tipo II (Clara)", caracteristicas: "Cabello rubio o castaño claro, ojos claros/miel", reaccionSolar: "Se quema fácilmente, se broncea mínimamente" },
  III: { label: "Tipo III (Intermedia / Caucásica)", caracteristicas: "Piel blanca a cetrina, cabello castaño", reaccionSolar: "Se quema moderadamente, se broncea de forma gradual" },
  IV: { label: "Tipo IV (Mediterránea / Morena Clara)", caracteristicas: "Piel morena clara, cabello castaño oscuro/negro", reaccionSolar: "Rara vez se quema, siempre se broncea con facilidad" },
  V: { label: "Tipo V (Morena Oscura / Mestiza)", caracteristicas: "Piel pigmentada oscura natural", reaccionSolar: "Casi nunca se quema, pigmenta intensamente" },
  VI: { label: "Tipo VI (Negra / Ébano)", caracteristicas: "Piel intensamente pigmentada", reaccionSolar: "Nunca se quema, alta protección a RUV" },
};

export default function FichaBiotipoConsentimiento() {
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fitzpatrick, setFitzpatrick] = useState("III");
  const [biotipo, setBiotipo] = useState("mixto");
  const [tieneMarcapasos, setTieneMarcapasos] = useState(false);
  const [embarazoLactancia, setEmbarazoLactancia] = useState(false);
  const [implantesMetalicos, setImplantesMetalicos] = useState(false);
  const [isotretinoinaReciente, setIsotretinoinaReciente] = useState(false);

  // Bonos activos de sesiones de masajes / spa
  const [bonos, setBonos] = useState<BonoSesion[]>([
    { id: "b-1", tratamiento: "Masajes Descontracturantes + Piedras Calientes", totalSesiones: 6, sesionesRealizadas: 2 },
    { id: "b-2", tratamiento: "Drenaje Linfático Manual + Maderoterapia", totalSesiones: 10, sesionesRealizadas: 4 },
  ]);

  // Rutina de Skincare recomendada
  const [rutina, setRutina] = useState({
    limpiador: "Gel Limpiador Suave con Niacinamida",
    serum: "Sérum Vitamina C al 15% + Ácido Ferúlico",
    hidratante: "Emulsión Hidratante con Ácido Hialurónico",
    bloqueador: "Protector Solar Fluido SPF 50+ Invisible",
  });

  // Consentimiento y firma
  const [aceptaAparatologia, setAceptaAparatologia] = useState(false);
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
    ctx.strokeStyle = "#db2777";
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

  const registrarSesionBono = (id: string) => {
    setBonos((prev) =>
      prev.map((b) => {
        if (b.id === id && b.sesionesRealizadas < b.totalSesiones) {
          const nuevas = b.sesionesRealizadas + 1;
          toast.success(`Sesión ${nuevas}/${b.totalSesiones} consumida con éxito`);
          return { ...b, sesionesRealizadas: nuevas };
        }
        return b;
      })
    );
  };

  const handleValidarFicha = () => {
    if (!pacienteNombre.trim()) {
      toast.error("El nombre del cliente/paciente es obligatorio");
      return;
    }
    if (!aceptaAparatologia || !aceptaCuidadosPost) {
      toast.error("Debes aceptar las cláusulas de consentimiento y cuidados");
      return;
    }
    setFirmado(true);
    toast.success("Ficha dermoestética y consentimiento validados con éxito");
  };

  const tieneContraindicacion = tieneMarcapasos || embarazoLactancia || implantesMetalicos || isotretinoinaReciente;

  return (
    <div className="space-y-6">
      {/* 1. Header con Alerta de Seguridad */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Ficha Dermoestética & Biotipo Cutáneo (Solo Practitioner / Cosmiatra)
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluación Fitzpatrick, filtro de contraindicaciones, bonos de masajes y rutina facial para el hogar.
            </p>
          </div>
        </div>

        {tieneContraindicacion && (
          <Badge variant="destructive" className="rounded-xl px-3 py-1.5 text-xs gap-1.5 animate-pulse">
            <ShieldAlert className="h-4 w-4" /> Alerta: Contraindicación Activa para Aparatología
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Datos del Paciente, Fitzpatrick y Contraindicaciones */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-pink-500" /> Datos Generales & Diagnóstico Cutáneo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nombre Completo del Cliente</Label>
                  <Input
                    placeholder="Ej. Stephanie Valenzuela"
                    value={pacienteNombre}
                    onChange={(e) => setPacienteNombre(e.target.value)}
                    disabled={firmado}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Teléfono / WhatsApp</Label>
                  <Input
                    placeholder="+1 (809) 000-0000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={firmado}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Fototipo Escala de Fitzpatrick
                  </Label>
                  <Select value={fitzpatrick} onValueChange={setFitzpatrick} disabled={firmado}>
                    <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FITZPATRICK_DATA).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {FITZPATRICK_DATA[fitzpatrick]?.reaccionSolar}
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-blue-500" />
                    Biotipo Cutáneo Predominante
                  </Label>
                  <Select value={biotipo} onValueChange={setBiotipo} disabled={firmado}>
                    <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="graso">Graso / Seborreico (Poros dilatados, brillo constante)</SelectItem>
                      <SelectItem value="seco">Seco / Alípico (Tirantez, descamación, falta de lípidos)</SelectItem>
                      <SelectItem value="mixto">Mixto (Zona T grasa, mejillas secas/normales)</SelectItem>
                      <SelectItem value="sensible">Sensible / Reactivo (Rosácea, telangiectasias)</SelectItem>
                      <SelectItem value="eudermico">Eudérmico (Equilibrado, textura fina y uniforme)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtro de Contraindicaciones */}
              <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2.5">
                <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Triaje de Seguridad & Contraindicaciones para Aparatología / Químicos:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={tieneMarcapasos}
                      onCheckedChange={(c) => setTieneMarcapasos(!!c)}
                      disabled={firmado}
                    />
                    <span>Marcapasos / Dispositivo cardíaco (No Radiofrecuencia)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={embarazoLactancia}
                      onCheckedChange={(c) => setEmbarazoLactancia(!!c)}
                      disabled={firmado}
                    />
                    <span>Embarazo o Lactancia activa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={implantesMetalicos}
                      onCheckedChange={(c) => setImplantesMetalicos(!!c)}
                      disabled={firmado}
                    />
                    <span>Implantes o prótesis metálicas en zona a tratar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isotretinoinaReciente}
                      onCheckedChange={(c) => setIsotretinoinaReciente(!!c)}
                      disabled={firmado}
                    />
                    <span>Uso de Isotretinoína oral en últimos 6 meses</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consentimiento Informado & Firma */}
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PenTool className="h-4 w-4 text-pink-500" /> Consentimiento Informado de Tratamientos Estéticos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3 text-xs">
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-[11px]">
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={aceptaAparatologia}
                    onCheckedChange={(c) => setAceptaAparatologia(!!c)}
                    disabled={firmado}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Aceptación de Procedimiento:</strong> Consiento la realización de masajes, limpiezas faciales,
                    aparatología (cavitación, radiofrecuencia, presoterapia) o peeling suave, habiendo declarado mi historial de salud.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={aceptaCuidadosPost}
                    onCheckedChange={(c) => setAceptaCuidadosPost(!!c)}
                    disabled={firmado}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Cuidados Post-Sesión:</strong> Me comprometo a usar protector solar SPF 50+, no exponerme a cámaras de bronceado ni saunas en las próximas 48 horas.
                  </span>
                </label>
              </div>

              {!firmado ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Firma Digital del Cliente:</span>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground gap-1" onClick={limpiarFirma}>
                      <RotateCcw className="h-3 w-3" /> Limpiar
                    </Button>
                  </div>
                  <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
                    <canvas
                      ref={canvasRef}
                      width={450}
                      height={95}
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
                  <div className="flex justify-end pt-1">
                    <Button onClick={handleValidarFicha} className="rounded-xl gap-2 shadow-none bg-pink-600 hover:bg-pink-700 text-white">
                      <CheckCircle2 className="h-4 w-4" /> Validar y Guardar Ficha
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="font-semibold text-xs">Ficha & Consentimiento Firmados Correctamente</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 rounded-xl text-xs gap-1 border-emerald-500/30" onClick={() => toast.info("Generando comprobante digital...")}>
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Bonos de Masajes y Rutina Skincare */}
        <div className="space-y-4">
          {/* Bonos de Masajes con Saldo Decreciente */}
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Heart className="h-4 w-4 text-pink-500" /> Bonos & Paquetes Activos
              </CardTitle>
              <CardDescription className="text-xs">Saldo decreciente por sesión consumida</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3 text-xs">
              {bonos.map((b) => {
                const restantes = b.totalSesiones - b.sesionesRealizadas;
                const porcentaje = (b.sesionesRealizadas / b.totalSesiones) * 100;
                return (
                  <div key={b.id} className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-foreground text-[11px] leading-tight">{b.tratamiento}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0 bg-pink-500/10 text-pink-600 border-pink-500/30">
                        {restantes} libres
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Progreso: {b.sesionesRealizadas}/{b.totalSesiones} sesiones</span>
                        <span className="font-semibold">{Math.round(porcentaje)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={restantes <= 0}
                      className="w-full rounded-xl text-xs h-7 border-border/80 text-pink-600 hover:bg-pink-500/10"
                      onClick={() => registrarSesionBono(b.id)}
                    >
                      {restantes > 0 ? "Consumir 1 Sesión" : "Bono Completado ✓"}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Rutina de Skincare a Domicilio */}
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ShoppingBag className="h-4 w-4 text-purple-500" /> Prescripción de Skincare
              </CardTitle>
              <CardDescription className="text-xs">Recomendación cosmecéutica domiciliaria</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2.5 text-xs">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground">Paso 1: Higiene Facial</Label>
                <Input value={rutina.limpiador} onChange={(e) => setRutina({ ...rutina, limpiador: e.target.value })} className="rounded-xl mt-0.5 h-7 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground">Paso 2: Principio Activo (Sérum)</Label>
                <Input value={rutina.serum} onChange={(e) => setRutina({ ...rutina, serum: e.target.value })} className="rounded-xl mt-0.5 h-7 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground">Paso 3: Hidratante Barrera</Label>
                <Input value={rutina.hidratante} onChange={(e) => setRutina({ ...rutina, hidratante: e.target.value })} className="rounded-xl mt-0.5 h-7 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground">Paso 4: Fotoprotección SPF 50+</Label>
                <Input value={rutina.bloqueador} onChange={(e) => setRutina({ ...rutina, bloqueador: e.target.value })} className="rounded-xl mt-0.5 h-7 text-xs" />
              </div>
              <Button
                size="sm"
                className="w-full rounded-xl text-xs h-7 mt-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => toast.success("Rutina enviada al WhatsApp del cliente")}
              >
                Compartir por WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
