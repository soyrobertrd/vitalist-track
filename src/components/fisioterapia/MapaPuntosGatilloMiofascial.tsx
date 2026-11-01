import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  Flame,
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle,
  Crosshair,
  Printer,
  Share2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export interface PuntoGatillo {
  id: string;
  musculo: string;
  zona: "cervicotoracico" | "lumbopelvico" | "miembro_superior" | "miembro_inferior";
  lado: "derecho" | "izquierdo" | "bilateral";
  tipo: "activo" | "latente";
  dolorReferido: string;
  espasmoTwitch: boolean;
  tecnicaAplicada: "puncion_seca_profunda" | "puncion_seca_superficial" | "terapia_manual_trps" | "tecarterapia_radiofrecuencia" | "ondas_choque";
  respuestaAlivio: string; // ej: "Disminución EVA de 8 a 3"
}

const MUSCULOS_FRECUENTES = [
  { nombre: "Trapecio Superior", zona: "cervicotoracico", referido: "Cefalea tensional temporal y retroauricular" },
  { nombre: "Elevador de la Escápula", zona: "cervicotoracico", referido: "Dolor en ángulo del cuello y borde vertebral escapular" },
  { nombre: "Infraespinoso", zona: "miembro_superior", referido: "Dolor cara anterior de hombro y brazo proximal" },
  { nombre: "Cuadrado Lumbar", zona: "lumbopelvico", referido: "Dolor sacroilíaco, cresta ilíaca y nalga" },
  { nombre: "Glúteo Medio", zona: "lumbopelvico", referido: "Dolor cara lateral de cadera y trocánter mayor" },
  { nombre: "Piramidal / Piriforme", zona: "lumbopelvico", referido: "Pseudo-ciática por cara posterior del muslo" },
  { nombre: "Recto Femoral", zona: "miembro_inferior", referido: "Dolor cara anterior de rodilla y tendón patelar" },
  { nombre: "Gastrocnemio / Gemelos", zona: "miembro_inferior", referido: "Dolor en fosa poplítea y tendón de Aquiles" },
];

export default function MapaPuntosGatilloMiofascial() {
  const [paciente] = useState({
    nombre: "Alejandro Mendoza Santos",
    edad: 34,
    diagnostico: "Síndrome de Dolor Miofascial + Sobrecarga Compensatoria LCA",
  });

  const [puntos, setPuntos] = useState<PuntoGatillo[]>([
    {
      id: "tr-1",
      musculo: "Cuadrado Lumbar",
      zona: "lumbopelvico",
      lado: "derecho",
      tipo: "activo",
      dolorReferido: "Dolor irradiado hacia cresta ilíaca y nalga al caminar",
      espasmoTwitch: true,
      tecnicaAplicada: "puncion_seca_profunda",
      respuestaAlivio: "EVA bajó de 7/10 a 2/10 inmediato",
    },
    {
      id: "tr-2",
      musculo: "Trapecio Superior",
      zona: "cervicotoracico",
      lado: "bilateral",
      tipo: "latente",
      dolorReferido: "Banda tensa palpable con dolor referido a la región temporal",
      espasmoTwitch: false,
      tecnicaAplicada: "terapia_manual_trps",
      respuestaAlivio: "Relajación de la banda tensa post-compresión isquémica",
    },
    {
      id: "tr-3",
      musculo: "Recto Femoral",
      zona: "miembro_inferior",
      lado: "derecho",
      tipo: "activo",
      dolorReferido: "Tirantez en polo superior de la patela en apoyo monopodal",
      espasmoTwitch: true,
      tecnicaAplicada: "tecarterapia_radiofrecuencia",
      respuestaAlivio: "Mejoría en el rango goniométrico de flexión activa",
    },
  ]);

  const [formulario, setFormulario] = useState({
    musculo: "Trapecio Superior",
    zona: "cervicotoracico" as PuntoGatillo["zona"],
    lado: "derecho" as PuntoGatillo["lado"],
    tipo: "activo" as PuntoGatillo["tipo"],
    dolorReferido: "",
    espasmoTwitch: true,
    tecnicaAplicada: "puncion_seca_profunda" as PuntoGatillo["tecnicaAplicada"],
    respuestaAlivio: "",
  });

  const handleSeleccionarMusculo = (nombre: string) => {
    const item = MUSCULOS_FRECUENTES.find((m) => m.nombre === nombre);
    if (item) {
      setFormulario({
        ...formulario,
        musculo: item.nombre,
        zona: item.zona as any,
        dolorReferido: item.referido,
      });
    } else {
      setFormulario({ ...formulario, musculo: nombre });
    }
  };

  const registrarPunto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario.musculo) {
      toast.error("Seleccione un músculo");
      return;
    }
    const nuevo: PuntoGatillo = {
      id: `tr-${Date.now()}`,
      musculo: formulario.musculo,
      zona: formulario.zona,
      lado: formulario.lado,
      tipo: formulario.tipo,
      dolorReferido: formulario.dolorReferido || "Dolor referido concordante",
      espasmoTwitch: formulario.espasmoTwitch,
      tecnicaAplicada: formulario.tecnicaAplicada,
      respuestaAlivio: formulario.respuestaAlivio || "Tolerancia adecuada",
    };
    setPuntos([nuevo, ...puntos]);
    toast.success(`Punto gatillo en ${nuevo.musculo} registrado exitosamente`);
    setFormulario({
      ...formulario,
      dolorReferido: "",
      respuestaAlivio: "",
    });
  };

  const eliminarPunto = (id: string) => {
    setPuntos(puntos.filter((p) => p.id !== id));
    toast.success("Registro eliminado");
  };

  return (
    <div className="space-y-6">
      {/* Header Informativo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-600 text-white shadow-sm">
            <Crosshair className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Mapa de Puntos Gatillo Miofasciales & Punción Seca
              </h2>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/30 text-xs">
                Síndrome de Dolor Miofascial (SDM)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Paciente: <span className="font-semibold text-foreground">{paciente.nombre}</span> — Registro clínico de bandas tensas y dolor referido
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-rose-600 text-white font-semibold text-xs px-3 py-1">
            {puntos.filter((p) => p.tipo === "activo").length} TrPs Activos detectados
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario de Registro de Punto Gatillo (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-rose-600" />
                Registrar Tratamiento de Punto Gatillo
              </CardTitle>
              <CardDescription className="text-xs">
                Palpación diagnóstica y técnica invasiva o manual aplicada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={registrarPunto} className="space-y-3.5">
                <div>
                  <Label className="text-xs">Músculo con Banda Tensa</Label>
                  <Select
                    value={formulario.musculo}
                    onValueChange={handleSeleccionarMusculo}
                  >
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCULOS_FRECUENTES.map((m) => (
                        <SelectItem key={m.nombre} value={m.nombre}>
                          {m.nombre} ({m.zona})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Lado Corporal</Label>
                    <Select
                      value={formulario.lado}
                      onValueChange={(v: any) => setFormulario({ ...formulario, lado: v })}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="derecho">Derecho</SelectItem>
                        <SelectItem value="izquierdo">Izquierdo</SelectItem>
                        <SelectItem value="bilateral">Bilateral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Estado del TrP</Label>
                    <Select
                      value={formulario.tipo}
                      onValueChange={(v: any) => setFormulario({ ...formulario, tipo: v })}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo (Dolor espontáneo)</SelectItem>
                        <SelectItem value="latente">Latente (Dolor a palpación)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Patrón de Dolor Referido</Label>
                  <Input
                    placeholder="Ej. Cefalea retroocular, tirantez en cara posterior de muslo"
                    value={formulario.dolorReferido}
                    onChange={(e) => setFormulario({ ...formulario, dolorReferido: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Técnica Fisioterapéutica Aplicada</Label>
                  <Select
                    value={formulario.tecnicaAplicada}
                    onValueChange={(v: any) => setFormulario({ ...formulario, tecnicaAplicada: v })}
                  >
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="puncion_seca_profunda">Punción Seca Profunda (Aguja APS)</SelectItem>
                      <SelectItem value="puncion_seca_superficial">Punción Seca Superficial (Baldry)</SelectItem>
                      <SelectItem value="terapia_manual_trps">Compresión Isquémica / Terapia Manual</SelectItem>
                      <SelectItem value="tecarterapia_radiofrecuencia">Diatermia por Radiofrecuencia (Tecar)</SelectItem>
                      <SelectItem value="ondas_choque">Ondas de Choque Radiales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <span>Respuesta de Espasmo Local (Twitch):</span>
                  <Button
                    type="button"
                    variant={formulario.espasmoTwitch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormulario({ ...formulario, espasmoTwitch: !formulario.espasmoTwitch })}
                    className={`h-7 rounded-lg text-xs font-semibold ${
                      formulario.espasmoTwitch ? "bg-rose-600 text-white" : ""
                    }`}
                  >
                    {formulario.espasmoTwitch ? "Positivo (+)" : "Negativo (-)"}
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Respuesta Inmediata / Alivio EVA</Label>
                  <Input
                    placeholder="Ej. Reducción de EVA 7 a 2, relajación de la banda"
                    value={formulario.respuestaAlivio}
                    onChange={(e) => setFormulario({ ...formulario, respuestaAlivio: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  Guardar Tratamiento de Punto Gatillo
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Historial y Mapeo de Puntos Gatillo (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-rose-600" />
                    Puntos Gatillo Registrados en la Sesión ({puntos.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Evolución del síndrome miofascial y técnicas de liberación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {puntos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-2xl">
                  No se han registrado puntos gatillo en esta sesión.
                </div>
              ) : (
                puntos.map((punto) => (
                  <div
                    key={punto.id}
                    className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-rose-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl text-white ${
                            punto.tipo === "activo" ? "bg-rose-600" : "bg-amber-500"
                          }`}
                        >
                          <Crosshair className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{punto.musculo}</h4>
                            <Badge
                              variant="outline"
                              className={
                                punto.tipo === "activo"
                                  ? "bg-rose-500/10 text-rose-700 border-rose-500/30 text-[10px]"
                                  : "bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]"
                              }
                            >
                              TrP {punto.tipo.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {punto.lado}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {punto.dolorReferido}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarPunto(punto.id)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-lg px-2"
                      >
                        Eliminar
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl">
                      <div>
                        <span className="text-muted-foreground">Técnica: </span>
                        <span className="font-semibold text-foreground capitalize">
                          {punto.tecnicaAplicada.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Twitch response: </span>
                        <span className="font-semibold text-foreground">
                          {punto.espasmoTwitch ? "Positiva (Confirmado)" : "No provocado"}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-border/40 text-[11px] text-teal-700 font-medium">
                        ✨ Respuesta: {punto.respuestaAlivio}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
