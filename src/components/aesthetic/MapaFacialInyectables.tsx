import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Syringe, Sparkles, RotateCcw, CheckCircle2, User, Eye, Download, Info } from "lucide-react";
import { toast } from "sonner";

export interface PuntoInyeccion {
  id: string;
  zona: string;
  x: number; // Porcentaje relativo 0-100 en SVG
  y: number; // Porcentaje relativo 0-100 en SVG
  unidadesUI?: number;
  volumenMl?: number;
  producto: "toxina" | "acido_hialuronico";
}

const PUNTOS_PREDEFINIDOS = [
  { id: "frente-izq", zona: "Frente Izq", x: 38, y: 22, producto: "toxina" as const, unidadesUI: 4 },
  { id: "frente-centro", zona: "Frente Medial", x: 50, y: 19, producto: "toxina" as const, unidadesUI: 4 },
  { id: "frente-der", zona: "Frente Der", x: 62, y: 22, producto: "toxina" as const, unidadesUI: 4 },
  { id: "glabela-procerus", zona: "Procerus", x: 50, y: 32, producto: "toxina" as const, unidadesUI: 6 },
  { id: "corrugador-izq", zona: "Corrugador Izq", x: 44, y: 30, producto: "toxina" as const, unidadesUI: 5 },
  { id: "corrugador-der", zona: "Corrugador Der", x: 56, y: 30, producto: "toxina" as const, unidadesUI: 5 },
  { id: "pata-gallo-izq", zona: "Orbicular Izq", x: 28, y: 38, producto: "toxina" as const, unidadesUI: 4 },
  { id: "pata-gallo-der", zona: "Orbicular Der", x: 72, y: 38, producto: "toxina" as const, unidadesUI: 4 },
  { id: "pomulo-ck1-izq", zona: "Pómulo Izq (CK1)", x: 34, y: 52, producto: "acido_hialuronico" as const, volumenMl: 0.2 },
  { id: "pomulo-ck1-der", zona: "Pómulo Der (CK1)", x: 66, y: 52, producto: "acido_hialuronico" as const, volumenMl: 0.2 },
  { id: "labio-sup", zona: "Labio Superior", x: 50, y: 71, producto: "acido_hialuronico" as const, volumenMl: 0.3 },
  { id: "labio-inf", zona: "Labio Inferior", x: 50, y: 77, producto: "acido_hialuronico" as const, volumenMl: 0.3 },
];

export default function MapaFacialInyectables() {
  const [pacienteNombre, setPacienteNombre] = useState("Valeria Guzmán");
  const [medico, setMedico] = useState("Dra. Sofía Morales");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"toxina" | "acido_hialuronico">("toxina");
  const [puntos, setPuntos] = useState<PuntoInyeccion[]>(PUNTOS_PREDEFINIDOS);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<PuntoInyeccion | null>(null);

  const totalToxinaUI = puntos
    .filter((p) => p.producto === "toxina")
    .reduce((acc, p) => acc + (p.unidadesUI || 0), 0);

  const totalAcidoMl = puntos
    .filter((p) => p.producto === "acido_hialuronico")
    .reduce((acc, p) => acc + (p.volumenMl || 0), 0);

  const handlePuntoClick = (p: PuntoInyeccion) => {
    setPuntoSeleccionado(p);
  };

  const handleEliminarPunto = (id: string) => {
    setPuntos((prev) => prev.filter((p) => p.id !== id));
    setPuntoSeleccionado(null);
    toast.info("Punto de punción eliminado del mapa");
  };

  const reiniciarPuntos = () => {
    setPuntos(PUNTOS_PREDEFINIDOS);
    setPuntoSeleccionado(null);
    toast.success("Mapa facial restablecido a valores estándar");
  };

  return (
    <Card className="rounded-2xl border-border/80 shadow-none">
      <CardHeader className="p-4 md:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Syringe className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Mapa Facial Interactivo de Puntos de Inyección (Face Mapping)
              </CardTitle>
              <CardDescription className="text-xs">
                Mapeo anatómico para Toxina Botulínica (UI) y Rellenos de Ácido Hialurónico (MD Codes)
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reiniciarPuntos}
              className="rounded-xl h-8 text-xs gap-1.5 border-border/80"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restablecer
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Mapa facial guardado en el expediente clínico")}
              className="rounded-xl h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-none"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Guardar Mapeo
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-6 text-xs">
        {/* Cabecera con datos del paciente y dosis totales */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60">
          <div>
            <Label className="text-[11px] text-muted-foreground">Paciente</Label>
            <Input
              value={pacienteNombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              className="rounded-xl mt-0.5 h-7 text-xs font-medium"
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Médico Aplicador</Label>
            <Input
              value={medico}
              onChange={(e) => setMedico(e.target.value)}
              className="rounded-xl mt-0.5 h-7 text-xs font-medium"
            />
          </div>
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-400">Total Toxina (Botox)</p>
              <p className="text-lg font-bold tabular-nums text-purple-700 dark:text-purple-400">{totalToxinaUI} UI</p>
            </div>
            <Syringe className="h-4 w-4 text-purple-500 opacity-60" />
          </div>
          <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-pink-700 dark:text-pink-400">Total Ácido Hialurónico</p>
              <p className="text-lg font-bold tabular-nums text-pink-700 dark:text-pink-400">{totalAcidoMl.toFixed(1)} ml</p>
            </div>
            <Sparkles className="h-4 w-4 text-pink-500 opacity-60" />
          </div>
        </div>

        {/* Mapeo Facial SVG y Detalle Lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Lienzo Facial Anatómico */}
          <div className="lg:col-span-2 relative bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full max-w-[380px] aspect-[3/4] relative select-none">
              {/* Ilustración Facial SVG Anatómica Limpia */}
              <svg viewBox="0 0 100 130" className="w-full h-full stroke-muted-foreground/40 fill-muted/15">
                {/* Contorno Craneofacial */}
                <path
                  d="M 50,8 C 22,8 20,40 20,68 C 20,95 35,122 50,122 C 65,122 80,95 80,68 C 80,40 78,8 50,8 Z"
                  strokeWidth="1.2"
                />
                {/* Ojos */}
                <ellipse cx="36" cy="46" rx="6.5" ry="3.5" strokeWidth="0.8" fill="none" />
                <ellipse cx="64" cy="46" rx="6.5" ry="3.5" strokeWidth="0.8" fill="none" />
                <circle cx="36" cy="46" r="1.8" className="fill-muted-foreground/30 stroke-none" />
                <circle cx="64" cy="46" r="1.8" className="fill-muted-foreground/30 stroke-none" />
                {/* Cejas */}
                <path d="M 28,40 Q 36,36 44,40" strokeWidth="1" fill="none" />
                <path d="M 56,40 Q 64,36 72,40" strokeWidth="1" fill="none" />
                {/* Nariz */}
                <path d="M 50,42 L 50,66 L 46,70 L 54,70" strokeWidth="0.9" fill="none" />
                {/* Labios */}
                <path d="M 39,83 Q 50,80 61,83 Q 50,88 39,83 Z" strokeWidth="0.8" className="fill-pink-500/10" />
                <path d="M 40,83 Q 50,91 60,83" strokeWidth="0.8" fill="none" />
                {/* Mentón */}
                <path d="M 44,106 Q 50,110 56,106" strokeWidth="0.7" fill="none" />
              </svg>

              {/* Puntos de Punción Interactivos */}
              {puntos.map((punto) => {
                const esToxina = punto.producto === "toxina";
                const seleccionado = puntoSeleccionado?.id === punto.id;
                return (
                  <button
                    key={punto.id}
                    type="button"
                    onClick={() => handlePuntoClick(punto)}
                    style={{ left: `${punto.x}%`, top: `${punto.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all ${
                      esToxina
                        ? "bg-purple-600 text-white shadow-purple-500/50"
                        : "bg-pink-600 text-white shadow-pink-500/50"
                    } ${seleccionado ? "ring-4 ring-primary w-6 h-6 text-[10px] font-bold z-20" : "w-5 h-5 text-[9px] font-semibold z-10 hover:scale-125"}`}
                    title={`${punto.zona} (${esToxina ? `${punto.unidadesUI} UI` : `${punto.volumenMl} ml`})`}
                  >
                    {esToxina ? punto.unidadesUI : punto.volumenMl}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                <span>Toxina Botulínica (UI)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-pink-600 inline-block" />
                <span>Ácido Hialurónico (ml)</span>
              </div>
            </div>
          </div>

          {/* Panel Lateral: Detalle del Punto Seleccionado */}
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/80 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4 text-purple-600" />
                  {puntoSeleccionado ? "Detalle de Punción" : "Puntos Anatómicos"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                {puntoSeleccionado ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{puntoSeleccionado.zona}</span>
                        <Badge
                          variant="outline"
                          className={
                            puntoSeleccionado.producto === "toxina"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                              : "bg-pink-500/10 text-pink-600 border-pink-500/30"
                          }
                        >
                          {puntoSeleccionado.producto === "toxina" ? "Toxina" : "Relleno AH"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Dosis programada:{" "}
                        <strong className="text-foreground">
                          {puntoSeleccionado.producto === "toxina"
                            ? `${puntoSeleccionado.unidadesUI} UI`
                            : `${puntoSeleccionado.volumenMl} ml`}
                        </strong>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl text-xs h-7 border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => handleEliminarPunto(puntoSeleccionado.id)}
                      >
                        Eliminar Punto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl text-xs h-7 border-border/80"
                        onClick={() => setPuntoSeleccionado(null)}
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[11px] italic">
                    Haz clic sobre cualquier círculo del rostro para ver su dosificación o editarla.
                  </p>
                )}

                {/* Resumen de Zonas Clave */}
                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Protocolo Clínico:</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    • Inyección intramuscular superficial en frente y patas de gallo.<br />
                    • Inyección en plano supraperióstico para pómulos (MD Codes CK1/CK2).<br />
                    • Cita de revisión y retoque obligatoria a los 14-15 días.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
