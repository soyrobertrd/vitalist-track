import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Activity, Dumbbell, User, Plus, CheckCircle2, Clock, Share2, AlertCircle, Heart, Building2, Flame } from "lucide-react";
import { toast } from "sonner";

interface BoxTerapia {
  id: string;
  nombre: string;
  equipamiento: string;
  tipo: "electroterapia" | "termoterapia_ultrasonido" | "traccion" | "puncion_seca" | "gimnasio";
  estado: "disponible" | "ocupado" | "desinfeccion";
  pacienteActual: string | null;
  tiempoRestanteMin: number | null;
}

interface BonoSesionesRehab {
  id: string;
  paciente: string;
  telefono: string;
  diagnostico: string;
  totalSesiones: number;
  sesionesRealizadas: number;
  fechaInicio: string;
  fisioterapeutaAsignado: string;
}

const BOXES_INICIALES: BoxTerapia[] = [
  {
    id: "box-1",
    nombre: "Box 1 - Electroterapia & TENS",
    equipamiento: "Equipo Chattanooga Intellect Neo (TENS/EMS/Rusas)",
    tipo: "electroterapia",
    estado: "ocupado",
    pacienteActual: "Alejandro Mendoza (LCA)",
    tiempoRestanteMin: 15,
  },
  {
    id: "box-2",
    nombre: "Box 2 - Ultrasonido & Termoterapia",
    equipamiento: "Ultrasonido 1/3 MHz + Compresas Húmedo-Calientes Hydrocollator",
    tipo: "termoterapia_ultrasonido",
    estado: "disponible",
    pacienteActual: null,
    tiempoRestanteMin: null,
  },
  {
    id: "box-3",
    nombre: "Box 3 - Magnetoterapia & Láser",
    equipamiento: "Cilindro Magnetoterapia BTL + Láser Alta Intensidad 12W",
    tipo: "electroterapia",
    estado: "ocupado",
    pacienteActual: "María Teresa Cruz (Hernia Discal)",
    tiempoRestanteMin: 20,
  },
  {
    id: "box-4",
    nombre: "Box 4 - Punción Seca & Terapia Manual",
    equipamiento: "Camilla Eléctrica 3 Cuerpos + Kit Agujas APS Acupuntura",
    tipo: "puncion_seca",
    estado: "disponible",
    pacienteActual: null,
    tiempoRestanteMin: null,
  },
  {
    id: "box-5",
    nombre: "Box 5 - Tracción Descompresiva",
    equipamiento: "Mesa de Tracción Cervical & Lumbar Computarizada",
    tipo: "traccion",
    estado: "desinfeccion",
    pacienteActual: null,
    tiempoRestanteMin: null,
  },
  {
    id: "gim-1",
    nombre: "Área Abierta - Gimnasio Terapéutico",
    equipamiento: "Espalderas, Balones Bobath, Bosu, Bandas TheraBand y Pesas",
    tipo: "gimnasio",
    estado: "ocupado",
    pacienteActual: "Grupo Reeducación Postural (3 Px)",
    tiempoRestanteMin: 35,
  },
];

const BONOS_INICIALES: BonoSesionesRehab[] = [
  {
    id: "bono-101",
    paciente: "Alejandro Mendoza",
    telefono: "809-555-8911",
    diagnostico: "Rehabilitación Post-LCA Rodilla",
    totalSesiones: 12,
    sesionesRealizadas: 7,
    fechaInicio: "2026-10-10",
    fisioterapeutaAsignado: "Lic. Carlos Guzmán, PT",
  },
  {
    id: "bono-102",
    paciente: "María Teresa Cruz",
    telefono: "829-555-3200",
    diagnostico: "Lumbociatalgia por Hernia L4-L5",
    totalSesiones: 10,
    sesionesRealizadas: 4,
    fechaInicio: "2026-10-18",
    fisioterapeutaAsignado: "Lic. Laura Pimentel, PT",
  },
  {
    id: "bono-103",
    paciente: "Pedro Julio Vargas",
    telefono: "809-555-4422",
    diagnostico: "Hombro Congelado / Capsulitis Adhesiva",
    totalSesiones: 15,
    sesionesRealizadas: 14,
    fechaInicio: "2026-09-25",
    fisioterapeutaAsignado: "Lic. Carlos Guzmán, PT",
  },
];

export default function BoxesTerapiaFisicaBonos() {
  const [boxes, setBoxes] = useState<BoxTerapia[]>(BOXES_INICIALES);
  const [bonos, setBonos] = useState<BonoSesionesRehab[]>(BONOS_INICIALES);
  const [openNuevoBono, setOpenNuevoBono] = useState<boolean>(false);

  // Form nuevo bono
  const [nuevoBonoForm, setNuevoBonoForm] = useState({
    paciente: "",
    telefono: "",
    diagnostico: "",
    totalSesiones: 10,
    fisioterapeutaAsignado: "Lic. Carlos Guzmán, PT",
  });

  const handleCrearBono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoBonoForm.paciente || !nuevoBonoForm.diagnostico) {
      toast.error("Por favor completa los datos del paciente y diagnóstico.");
      return;
    }

    const nuevo: BonoSesionesRehab = {
      id: `bono-${Date.now()}`,
      ...nuevoBonoForm,
      sesionesRealizadas: 0,
      fechaInicio: new Date().toISOString().split("T")[0],
    };

    setBonos([nuevo, ...bonos]);
    setOpenNuevoBono(false);
    toast.success("Paquete de sesiones de rehabilitación registrado.");
  };

  const registrarAsistenciaSesion = (bonoId: string) => {
    setBonos((prev) =>
      prev.map((b) => {
        if (b.id === bonoId) {
          if (b.sesionesRealizadas >= b.totalSesiones) {
            toast.error("Este paquete ya completó todas sus sesiones.");
            return b;
          }
          const nuevaSesion = b.sesionesRealizadas + 1;
          toast.success(`Sesión ${nuevaSesion}/${b.totalSesiones} registrada para ${b.paciente}.`);
          return { ...b, sesionesRealizadas: nuevaSesion };
        }
        return b;
      })
    );
  };

  const enviarWhatsAppRutina = (bono: BonoSesionesRehab) => {
    const restantes = bono.totalSesiones - bono.sesionesRealizadas;
    const texto = `Hola *${bono.paciente}*, te saludamos desde tu Centro de Fisioterapia & Rehabilitación. 🏃✨\n\n📌 *Estado de tu Tratamiento (${bono.diagnostico}):*\n• Sesiones asistidas: *${bono.sesionesRealizadas} de ${bono.totalSesiones}*\n• Sesiones restantes: *${restantes}*\n• Fisioterapeuta: ${bono.fisioterapeutaAsignado}\n\n🏠 *Pautas para la casa:* Recuerda aplicar hielo/compresa fría por 15 minutos si hay dolor agudo y realizar tus ejercicios de estiramiento prescritos 2 veces al día.\n\n¡Seguimos con todo tu proceso de recuperación! 💪`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Recordatorio de sesiones abierto en WhatsApp.");
  };

  const liberarBox = (boxId: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, estado: "disponible", pacienteActual: null, tiempoRestanteMin: null } : b))
    );
    toast.success("Box liberado y listo para el siguiente paciente.");
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Mapa de Boxes Terapéuticos & Paquetes de Sesiones
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión en tiempo real de boxes (TENS, Ultrasonido, Tracción, Gimnasio) y control de bonos de rehabilitación.
          </p>
        </div>

        <Dialog open={openNuevoBono} onOpenChange={setOpenNuevoBono}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 text-xs gap-1.5 shadow-none bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-3.5 w-3.5" />
              Nuevo Paquete de Sesiones
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-emerald-600" />
                Registrar Paquete de Fisioterapia
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearBono} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Paciente</Label>
                <Input
                  placeholder="Nombre completo"
                  value={nuevoBonoForm.paciente}
                  onChange={(e) => setNuevoBonoForm({ ...nuevoBonoForm, paciente: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono / WhatsApp</Label>
                  <Input
                    placeholder="809-555-0000"
                    value={nuevoBonoForm.telefono}
                    onChange={(e) => setNuevoBonoForm({ ...nuevoBonoForm, telefono: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Número de Sesiones</Label>
                  <Select
                    value={nuevoBonoForm.totalSesiones.toString()}
                    onValueChange={(v) => setNuevoBonoForm({ ...nuevoBonoForm, totalSesiones: parseInt(v) || 10 })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Sesiones</SelectItem>
                      <SelectItem value="10">10 Sesiones (Estándar)</SelectItem>
                      <SelectItem value="15">15 Sesiones (Post-quirúrgico)</SelectItem>
                      <SelectItem value="20">20 Sesiones (Neurológico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Diagnóstico o Tratamiento</Label>
                <Input
                  placeholder="Ej. Lumbalgia mecánica, Post-LCA"
                  value={nuevoBonoForm.diagnostico}
                  onChange={(e) => setNuevoBonoForm({ ...nuevoBonoForm, diagnostico: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fisioterapeuta Asignado</Label>
                <Input
                  value={nuevoBonoForm.fisioterapeutaAsignado}
                  onChange={(e) => setNuevoBonoForm({ ...nuevoBonoForm, fisioterapeutaAsignado: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpenNuevoBono(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Crear Paquete
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mapa de Boxes Terapéuticos */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ocupación de Boxes y Equipamiento en Vivo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map((box) => (
            <Card key={box.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">{box.nombre}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{box.equipamiento}</p>
                  </div>
                  <Badge
                    variant={box.estado === "disponible" ? "default" : box.estado === "ocupado" ? "secondary" : "outline"}
                    className="capitalize text-[10px]"
                  >
                    {box.estado}
                  </Badge>
                </div>

                {box.pacienteActual ? (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3 text-emerald-600" /> {box.pacienteActual}
                      </p>
                      {box.tiempoRestanteMin && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> Restan ~{box.tiempoRestanteMin} min de sesión
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => liberarBox(box.id)}
                      className="h-7 text-[11px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      Liberar
                    </Button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/20 text-center">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Box sanitizado y listo para ingresar paciente
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabla de Bonos y Control de Sesiones */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Paquetes de Rehabilitación Activos ({bonos.length})
        </h3>
        <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Paciente / Contacto</TableHead>
                <TableHead className="text-xs">Diagnóstico</TableHead>
                <TableHead className="text-xs">Fisioterapeuta</TableHead>
                <TableHead className="text-xs">Progreso de Sesiones</TableHead>
                <TableHead className="text-xs text-center">Saldo Restante</TableHead>
                <TableHead className="text-xs text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonos.map((bono) => {
                const pct = (bono.sesionesRealizadas / bono.totalSesiones) * 100;
                const restantes = bono.totalSesiones - bono.sesionesRealizadas;
                const completado = bono.sesionesRealizadas >= bono.totalSesiones;
                return (
                  <TableRow key={bono.id} className="text-xs">
                    <TableCell>
                      <p className="font-medium text-foreground">{bono.paciente}</p>
                      <p className="text-[10px] text-muted-foreground">{bono.telefono}</p>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{bono.diagnostico}</TableCell>
                    <TableCell className="text-muted-foreground">{bono.fisioterapeutaAsignado}</TableCell>
                    <TableCell className="w-[180px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>{bono.sesionesRealizadas} / {bono.totalSesiones}</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {completado ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Completado ✓
                        </Badge>
                      ) : (
                        <span className="text-foreground">{restantes} sesiones</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!completado && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => registrarAsistenciaSesion(bono.id)}
                            className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            +1 Asistencia
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => enviarWhatsAppRutina(bono)}
                          className="h-7 text-xs border-border/70 gap-1"
                        >
                          <Share2 className="h-3 w-3" /> WA
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
