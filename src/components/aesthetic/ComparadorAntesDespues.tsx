import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Camera, Split, Eye, ShieldCheck, Share2, Upload, Calendar, User, Sparkles, CheckCircle2, AlertCircle, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

interface FotoCaso {
  id: string;
  paciente: string;
  procedimiento: string;
  categoria: "facial" | "corporal" | "laser" | "spa";
  fechaAntes: string;
  fechaDespues: string;
  semanasEvolucion: number;
  autorizaRedes: boolean;
  anonimizado: boolean;
  notaClinica: string;
  antesImg: string;
  despuesImg: string;
}

const CASOS_DEMO: FotoCaso[] = [
  {
    id: "caso-01",
    paciente: "Camila Peña Valenzuela",
    procedimiento: "Armonización Facial & Relleno Mandibular",
    categoria: "facial",
    fechaAntes: "2026-09-10",
    fechaDespues: "2026-10-25",
    semanasEvolucion: 6,
    autorizaRedes: true,
    anonimizado: false,
    notaClinica: "2 viales de Ácido Hialurónico reticulado alta densidad (24mg/ml) en ángulo mandibular y mentón.",
    antesImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    despuesImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "caso-02",
    paciente: "Altagracia Rosario",
    procedimiento: "Peeling Químico TCA & Microneedling (Acné)",
    categoria: "facial",
    fechaAntes: "2026-08-15",
    fechaDespues: "2026-10-18",
    semanasEvolucion: 9,
    autorizaRedes: true,
    anonimizado: true,
    notaClinica: "3 sesiones de Dermapen con ácido tranexámico + 1 sesión TCA 15%. Reducción 70% cicatrices pigmentadas.",
    antesImg: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80",
    despuesImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "caso-03",
    paciente: "Yomaira Gómez",
    procedimiento: "Maderoterapia Reductiva & Drenaje Linfático",
    categoria: "corporal",
    fechaAntes: "2026-09-01",
    fechaDespues: "2026-10-20",
    semanasEvolucion: 7,
    autorizaRedes: false,
    anonimizado: true,
    notaClinica: "Paquete de 10 sesiones abdomen y flancos con copa sueca y tabla modeladora. Disminución de 6.5 cm de cintura.",
    antesImg: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
    despuesImg: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
  },
];

export default function ComparadorAntesDespues() {
  const [casos, setCasos] = useState<FotoCaso[]>(CASOS_DEMO);
  const [casoSeleccionado, setCasoSeleccionado] = useState<FotoCaso>(CASOS_DEMO[0]);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [openNuevoModal, setOpenNuevoModal] = useState<boolean>(false);

  // Form state
  const [nuevoForm, setNuevoForm] = useState({
    paciente: "",
    procedimiento: "",
    categoria: "facial" as "facial" | "corporal" | "laser" | "spa",
    fechaAntes: new Date().toISOString().split("T")[0],
    fechaDespues: new Date().toISOString().split("T")[0],
    semanasEvolucion: 4,
    autorizaRedes: false,
    anonimizado: true,
    notaClinica: "",
    antesImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    despuesImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  });

  const handleCrearCaso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoForm.paciente || !nuevoForm.procedimiento) {
      toast.error("Por favor completa el nombre del paciente y procedimiento.");
      return;
    }

    const nuevo: FotoCaso = {
      id: `caso-${Date.now()}`,
      ...nuevoForm,
    };

    setCasos([nuevo, ...casos]);
    setCasoSeleccionado(nuevo);
    setOpenNuevoModal(false);
    toast.success("Registro de evolución fotográfica guardado correctamente.");
  };

  const casosFiltrados = casos.filter((c) => {
    if (filtroCategoria === "todos") return true;
    return c.categoria === filtroCategoria;
  });

  const compartirWhatsApp = (caso: FotoCaso) => {
    const texto = `Hola ${caso.paciente}, te compartimos el informe de evolución estética de tu procedimiento: *${caso.procedimiento}*.\n\n📅 Inicio: ${caso.fechaAntes}\n📅 Evaluación: ${caso.fechaDespues} (${caso.semanasEvolucion} semanas de evolución)\n📝 Pautas clínicas: ${caso.notaClinica}\n\nGracias por confiar en nuestro centro clínico y estético.`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header descriptivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Evolución Fotográfica & Comparador Split (Antes / Después)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro fotográfico estandarizado con visor interactivo dividido y control legal de privacidad de imagen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[140px] rounded-xl h-9 text-xs">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las áreas</SelectItem>
              <SelectItem value="facial">Facial & Inyectables</SelectItem>
              <SelectItem value="corporal">Corporal & Masajes</SelectItem>
              <SelectItem value="laser">Láser & Aparatología</SelectItem>
              <SelectItem value="spa">Spa & Bienestar</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={openNuevoModal} onOpenChange={setOpenNuevoModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl h-9 text-xs gap-1.5 shadow-none">
                <Upload className="h-3.5 w-3.5" />
                Cargar Caso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4 text-primary" />
                  Nuevo Registro de Fotos Antes / Después
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearCaso} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Paciente / Cliente</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={nuevoForm.paciente}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, paciente: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Procedimiento</Label>
                    <Input
                      placeholder="Ej. Toxina Botulínica"
                      value={nuevoForm.procedimiento}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, procedimiento: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Área / Categoría</Label>
                    <Select
                      value={nuevoForm.categoria}
                      onValueChange={(v: any) => setNuevoForm({ ...nuevoForm, categoria: v })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facial">Facial</SelectItem>
                        <SelectItem value="corporal">Corporal</SelectItem>
                        <SelectItem value="laser">Láser / Aparatos</SelectItem>
                        <SelectItem value="spa">Spa / Masajes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha Antes</Label>
                    <Input
                      type="date"
                      value={nuevoForm.fechaAntes}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, fechaAntes: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha Después</Label>
                    <Input
                      type="date"
                      value={nuevoForm.fechaDespues}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, fechaDespues: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Semanas de intervalo</Label>
                    <Input
                      type="number"
                      min={1}
                      value={nuevoForm.semanasEvolucion}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, semanasEvolucion: parseInt(e.target.value) || 1 })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nota de Parámetros o Técnica Empleada</Label>
                  <Input
                    placeholder="Ej. Cantidad de sesiones, dosis, cabezal, respuesta cutánea"
                    value={nuevoForm.notaClinica}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, notaClinica: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Consentimiento legal de imagen */}
                <div className="rounded-xl border border-border/70 p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="redes"
                      checked={nuevoForm.autorizaRedes}
                      onCheckedChange={(c) => setNuevoForm({ ...nuevoForm, autorizaRedes: !!c })}
                    />
                    <label htmlFor="redes" className="text-xs font-medium cursor-pointer">
                      El paciente autorizó uso de imagen con fines clínicos / educativos
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonimo"
                      checked={nuevoForm.anonimizado}
                      onCheckedChange={(c) => setNuevoForm({ ...nuevoForm, anonimizado: !!c })}
                    />
                    <label htmlFor="anonimo" className="text-xs text-muted-foreground cursor-pointer">
                      Modo anonimizado (cubrir rasgos identificatorios / ojos)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenNuevoModal(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="rounded-xl">
                    Guardar Caso
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid principal: Comparador Split a la izquierda + Selector de casos a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visor interactivo Split */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Split className="h-4 w-4 text-primary" />
                    {casoSeleccionado.procedimiento}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Paciente: <span className="font-semibold text-foreground">{casoSeleccionado.paciente}</span> · {casoSeleccionado.semanasEvolucion} semanas de evolución
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={casoSeleccionado.autorizaRedes ? "default" : "secondary"} className="text-[11px] gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {casoSeleccionado.autorizaRedes ? "Consentimiento firmado" : "Uso interno"}
                  </Badge>
                  {casoSeleccionado.anonimizado && (
                    <Badge variant="outline" className="text-[11px]">
                      Anonimizado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Visor Split Slider */}
              <div className="relative w-full h-[360px] sm:h-[440px] rounded-xl overflow-hidden select-none bg-neutral-900 border border-border/80">
                {/* Imagen Después (Fondo) */}
                <img
                  src={casoSeleccionado.despuesImg}
                  alt="Después"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-neutral-900/80 text-neutral-100 font-semibold text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm z-10 border border-neutral-700">
                  DESPUÉS ({casoSeleccionado.fechaDespues})
                </span>

                {/* Imagen Antes (Recortada por slider) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={casoSeleccionado.antesImg}
                    alt="Antes"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: "100%", minWidth: "100%", height: "100%" }}
                  />
                  <span className="absolute top-3 left-3 bg-neutral-900/80 text-neutral-100 font-semibold text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm z-10 border border-neutral-700">
                    ANTES ({casoSeleccionado.fechaAntes})
                  </span>
                </div>

                {/* Línea divisoria */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Slider de control */}
              <div className="space-y-1.5 px-2">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>← Ver Antes ({sliderPos}%)</span>
                  <span>Ver Después ({100 - sliderPos}%) →</span>
                </div>
                <Slider
                  value={[sliderPos]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => setSliderPos(val[0])}
                  className="cursor-pointer"
                />
              </div>

              {/* Ficha clínica del caso */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Detalle Clínico & Tratamiento Aplicado:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {casoSeleccionado.notaClinica}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  * Las fotografías clínicas cumplen con la Ley 172-13 y normativa de confidencialidad MISPAS.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => compartirWhatsApp(casoSeleccionado)}
                  className="rounded-xl text-xs gap-1.5 h-8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartir Reporte WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Galería lateral de casos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Casos Registrados ({casosFiltrados.length})
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {casosFiltrados.map((caso) => {
              const isSelected = casoSeleccionado.id === caso.id;
              return (
                <div
                  key={caso.id}
                  onClick={() => {
                    setCasoSeleccionado(caso);
                    setSliderPos(50);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/70 hover:border-primary/40 bg-card hover:bg-muted/10"
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/70">
                      <img
                        src={caso.despuesImg}
                        alt={caso.procedimiento}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute bottom-0 inset-x-0 rounded-none text-[9px] py-0 px-1 justify-center bg-neutral-900/80">
                        {caso.semanasEvolucion} sem
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {caso.procedimiento}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {caso.paciente}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
                          {caso.categoria}
                        </Badge>
                        {caso.autorizaRedes && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3 inline" /> Redes ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
