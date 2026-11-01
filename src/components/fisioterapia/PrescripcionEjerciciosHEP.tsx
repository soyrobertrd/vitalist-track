import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dumbbell,
  PlayCircle,
  Plus,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  User,
  Heart,
  Flame,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export interface EjercicioTerapeutico {
  id: string;
  nombre: string;
  zona: "cervical" | "hombro" | "lumbar" | "cadera" | "rodilla" | "tobillo";
  tipoContraccion: "isometrica" | "concentrica" | "excentrica" | "movilidad";
  series: number;
  repeticiones: string;
  frecuencia: string;
  resistencia: string;
  evaPermitido: number; // dolor max permitible (0-10)
  instrucciones: string;
}

const CATALOGO_BASE: EjercicioTerapeutico[] = [
  {
    id: "ex-1",
    nombre: "Contracciones Cuadricipitales Isométricas",
    zona: "rodilla",
    tipoContraccion: "isometrica",
    series: 3,
    repeticiones: "10 reps de 6 seg",
    frecuencia: "2 veces al día",
    resistencia: "Toalla enrollada bajo la rodilla",
    evaPermitido: 2,
    instrucciones: "Tumbado boca arriba, presione la rodilla contra la toalla apretando el muslo. Mantenga 6 segundos y relaje.",
  },
  {
    id: "ex-2",
    nombre: "Puente Glúteo Bipodal con Banda Elástica",
    zona: "cadera",
    tipoContraccion: "concentrica",
    series: 3,
    repeticiones: "12 a 15 reps",
    frecuencia: "1 vez al día",
    resistencia: "Banda TheraBand Roja (Media)",
    evaPermitido: 3,
    instrucciones: "Boca arriba con rodillas flexionadas y banda sobre las rodillas. Eleve la pelvis apretando glúteos sin arquear la espalda.",
  },
  {
    id: "ex-3",
    nombre: "Rotación Externa de Hombro con TheraBand",
    zona: "hombro",
    tipoContraccion: "concentrica",
    series: 3,
    repeticiones: "12 reps",
    frecuencia: "1 vez al día",
    resistencia: "Banda TheraBand Amarilla (Ligera)",
    evaPermitido: 2,
    instrucciones: "Codo pegado al costado a 90°. Rote el antebrazo hacia afuera lentamente manteniendo la escápula estable.",
  },
  {
    id: "ex-4",
    nombre: "Descenso de Escalón Excéntrico (Cuádriceps/Tendón)",
    zona: "rodilla",
    tipoContraccion: "excentrica",
    series: 3,
    repeticiones: "10 reps lentas (3 seg bajada)",
    frecuencia: "Días alternos",
    resistencia: "Peso corporal sobre escalón de 15cm",
    evaPermitido: 4,
    instrucciones: "Baje lentamente con la pierna afectada controlando el descenso sin que la rodilla colapse hacia adentro.",
  },
  {
    id: "ex-5",
    nombre: "Retracción Cervical en Doble Mentón (Chin Tuck)",
    zona: "cervical",
    tipoContraccion: "isometrica",
    series: 3,
    repeticiones: "10 reps de 5 seg",
    frecuencia: "3 veces al día",
    resistencia: "Autocarga / Presión manual suave",
    evaPermitido: 1,
    instrucciones: "Sentado erguido, lleve el mentón hacia atrás horizontalmente como sacando papada. No incline la cabeza hacia abajo.",
  },
  {
    id: "ex-6",
    nombre: "Gato-Camello (Movilidad Raquídea)",
    zona: "lumbar",
    tipoContraccion: "movilidad",
    series: 2,
    repeticiones: "10 ciclos fluidos",
    frecuencia: "Mañana y noche",
    resistencia: "Sin carga",
    evaPermitido: 2,
    instrucciones: "En cuatro puntos, alterne entre arquear la espalda mirando al techo y redondear la columna mirando al ombligo.",
  },
];

export default function PrescripcionEjerciciosHEP() {
  const [paciente, setPaciente] = useState({
    nombre: "Alejandro Mendoza Santos",
    edad: 34,
    diagnostico: "Rehabilitación Post-LCA Rodilla Derecha (Fase 2)",
    fase: "Hipertrofia & Control Neuromuscular",
  });

  const [rutina, setRutina] = useState<EjercicioTerapeutico[]>([
    CATALOGO_BASE[0],
    CATALOGO_BASE[1],
    CATALOGO_BASE[3],
  ]);

  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoEj, setNuevoEj] = useState<Partial<EjercicioTerapeutico>>({
    nombre: "",
    zona: "rodilla",
    tipoContraccion: "concentrica",
    series: 3,
    repeticiones: "12 reps",
    frecuencia: "1 vez al día",
    resistencia: "Banda media",
    evaPermitido: 2,
    instrucciones: "",
  });

  const agregarDesdeCatalogo = (ej: EjercicioTerapeutico) => {
    if (rutina.some((r) => r.id === ej.id)) {
      toast.info("El ejercicio ya está incluido en la rutina activa");
      return;
    }
    setRutina([...rutina, ej]);
    toast.success(`"${ej.nombre}" agregado al plan del paciente`);
  };

  const eliminarDeRutina = (id: string) => {
    setRutina(rutina.filter((r) => r.id !== id));
    toast.success("Ejercicio retirado de la rutina");
  };

  const guardarNuevoPersonalizado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEj.nombre) {
      toast.error("Indique el nombre del ejercicio");
      return;
    }
    const creado: EjercicioTerapeutico = {
      id: `custom-${Date.now()}`,
      nombre: nuevoEj.nombre,
      zona: (nuevoEj.zona as any) || "rodilla",
      tipoContraccion: (nuevoEj.tipoContraccion as any) || "concentrica",
      series: Number(nuevoEj.series) || 3,
      repeticiones: nuevoEj.repeticiones || "10 reps",
      frecuencia: nuevoEj.frecuencia || "Diaria",
      resistencia: nuevoEj.resistencia || "Sin resistencia",
      evaPermitido: Number(nuevoEj.evaPermitido) || 2,
      instrucciones: nuevoEj.instrucciones || "Ejecutar con control postural estricto.",
    };
    setRutina([...rutina, creado]);
    setModalNuevo(false);
    toast.success("Ejercicio personalizado creado y agregado a la rutina");
  };

  const compartirWhatsApp = () => {
    const texto = `🏋️ *PROGRAMA DE EJERCICIOS DOMICILIARIOS (HEP)*\n*Paciente:* ${paciente.nombre}\n*Diagnóstico:* ${paciente.diagnostico}\n\n${rutina
      .map(
        (ej, idx) =>
          `*${idx + 1}. ${ej.nombre}*\n• Series: ${ej.series} | Repeticiones: ${ej.repeticiones}\n• Carga/Banda: ${ej.resistencia}\n• Frecuencia: ${ej.frecuencia}\n• Dolor máx tolerable: ${ej.evaPermitido}/10 EVA\n• Instrucciones: ${ej.instrucciones}\n`
      )
      .join("\n")}⚠️ *Nota:* Suspenda el ejercicio si el dolor supera el umbral indicado o si aparece inflamación aguda.`;
    navigator.clipboard.writeText(texto);
    toast.success("Plan copiado al portapapeles en formato WhatsApp listo para enviar");
  };

  const imprimirRutina = () => {
    window.print();
  };

  const catalogoFiltrado =
    filtroZona === "todas"
      ? CATALOGO_BASE
      : CATALOGO_BASE.filter((item) => item.zona === filtroZona);

  return (
    <div className="space-y-6">
      {/* Encabezado del Programa Domiciliario */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-600 text-white shadow-sm">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Prescripción de Ejercicios Terapéuticos (HEP)
              </h2>
              <Badge variant="outline" className="bg-teal-500/10 text-teal-700 border-teal-500/30 text-xs">
                Home Exercise Program
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Paciente: <span className="font-semibold text-foreground">{paciente.nombre}</span> ({paciente.edad} años) — {paciente.diagnostico}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={compartirWhatsApp}
            className="rounded-xl gap-1.5 text-xs font-semibold border-teal-500/30 text-teal-700 hover:bg-teal-500/10"
          >
            <Share2 className="h-3.5 w-3.5" />
            Enviar a WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={imprimirRutina}
            className="rounded-xl gap-1.5 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Plan
          </Button>

          <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                Crear Ejercicio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-teal-700">
                  <Sparkles className="h-5 w-5" />
                  Nuevo Ejercicio Personalizado
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={guardarNuevoPersonalizado} className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs">Nombre del Ejercicio</Label>
                  <Input
                    placeholder="Ej. Sentadilla isométrica en pared"
                    value={nuevoEj.nombre}
                    onChange={(e) => setNuevoEj({ ...nuevoEj, nombre: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Zona Anatómica</Label>
                    <Select
                      value={nuevoEj.zona}
                      onValueChange={(v: any) => setNuevoEj({ ...nuevoEj, zona: v })}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cervical">Cervical</SelectItem>
                        <SelectItem value="hombro">Hombro</SelectItem>
                        <SelectItem value="lumbar">Lumbar</SelectItem>
                        <SelectItem value="cadera">Cadera</SelectItem>
                        <SelectItem value="rodilla">Rodilla</SelectItem>
                        <SelectItem value="tobillo">Tobillo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Contracción</Label>
                    <Select
                      value={nuevoEj.tipoContraccion}
                      onValueChange={(v: any) => setNuevoEj({ ...nuevoEj, tipoContraccion: v })}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="isometrica">Isométrica</SelectItem>
                        <SelectItem value="concentrica">Concéntrica</SelectItem>
                        <SelectItem value="excentrica">Excéntrica</SelectItem>
                        <SelectItem value="movilidad">Movilidad / Estiramiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Series</Label>
                    <Input
                      type="number"
                      value={nuevoEj.series}
                      onChange={(e) => setNuevoEj({ ...nuevoEj, series: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Repeticiones</Label>
                    <Input
                      placeholder="12 reps"
                      value={nuevoEj.repeticiones}
                      onChange={(e) => setNuevoEj({ ...nuevoEj, repeticiones: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">EVA Máx (0-10)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={nuevoEj.evaPermitido}
                      onChange={(e) => setNuevoEj({ ...nuevoEj, evaPermitido: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Carga / Resistencia</Label>
                  <Input
                    placeholder="Ej. Banda TheraBand verde / Mancuerna 2kg"
                    value={nuevoEj.resistencia}
                    onChange={(e) => setNuevoEj({ ...nuevoEj, resistencia: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs">Instrucciones al Paciente</Label>
                  <Textarea
                    placeholder="Postura correcta, velocidad de movimiento y cuidados..."
                    rows={2}
                    value={nuevoEj.instrucciones}
                    onChange={(e) => setNuevoEj({ ...nuevoEj, instrucciones: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalNuevo(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                    Agregar a Rutina
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Rutina Prescrita Activa (Columna Izquierda 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    Rutina Prescrita Activa ({rutina.length} ejercicios)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ejercicios programados para realizar en domicilio o en el box de kinesiología
                  </CardDescription>
                </div>
                <Badge className="bg-teal-600 text-white font-semibold text-xs">
                  Fase de Fuerza & Control
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rutina.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-2xl">
                  No hay ejercicios en la rutina activa. Selecciona del catálogo de la derecha.
                </div>
              ) : (
                rutina.map((ej, index) => (
                  <div
                    key={ej.id}
                    className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-teal-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-teal-700 font-bold text-xs">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{ej.nombre}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] capitalize py-0 border-border">
                              {ej.zona}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] capitalize py-0">
                              {ej.tipoContraccion}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {ej.series} series × {ej.repeticiones}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarDeRutina(ej.id)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-lg px-2"
                      >
                        Quitar
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl">
                      <div>
                        <span className="text-muted-foreground">Resistencia: </span>
                        <span className="font-semibold text-foreground">{ej.resistencia}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frecuencia: </span>
                        <span className="font-semibold text-foreground">{ej.frecuencia}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          Dolor máximo permitido:
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            ej.evaPermitido <= 2
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              : ej.evaPermitido <= 4
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                          }
                        >
                          Hasta {ej.evaPermitido}/10 EVA
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground italic pl-1">
                      💡 {ej.instrucciones}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Catálogo Clínico de Fisioterapia (Columna Derecha 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    Catálogo de Ejercicios
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Protocolos kinésicos basados en evidencia
                  </CardDescription>
                </div>
              </div>

              {/* Filtro por articulación / zona */}
              <div className="pt-2">
                <Select value={filtroZona} onValueChange={setFiltroZona}>
                  <SelectTrigger className="h-8 rounded-xl text-xs">
                    <SelectValue placeholder="Filtrar por zona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las zonas anatómicas</SelectItem>
                    <SelectItem value="cervical">Columna Cervical</SelectItem>
                    <SelectItem value="hombro">Complejo Hombro</SelectItem>
                    <SelectItem value="lumbar">Columna Lumbar</SelectItem>
                    <SelectItem value="cadera">Cadera & Pelvis</SelectItem>
                    <SelectItem value="rodilla">Rodilla & Fémoro-patelar</SelectItem>
                    <SelectItem value="tobillo">Tobillo & Pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {catalogoFiltrado.map((item) => {
                const yaAgregado = rutina.some((r) => r.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground leading-snug">{item.nombre}</span>
                        <Badge variant="outline" className="text-[9px] py-0 border-teal-500/30 text-teal-700 capitalize">
                          {item.zona}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {item.instrucciones}
                      </p>
                      <div className="text-[10px] text-teal-700 font-medium">
                        {item.series} series × {item.repeticiones} • {item.resistencia}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={yaAgregado ? "secondary" : "outline"}
                      disabled={yaAgregado}
                      onClick={() => agregarDesdeCatalogo(item)}
                      className="h-7 text-xs rounded-lg shrink-0 px-2 font-semibold"
                    >
                      {yaAgregado ? "En plan" : "+ Agregar"}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
