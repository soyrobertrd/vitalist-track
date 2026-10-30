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
import { Zap, Wrench, AlertTriangle, ShieldCheck, Plus, RotateCcw, Activity, Clock, CheckCircle2, DollarSign, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface EquipoAparatologia {
  id: string;
  nombre: string;
  tipo: "laser_diodo" | "hifu" | "ipl" | "radiofrecuencia" | "criolipolisis";
  numeroSerie: string;
  cabezalActual: string;
  disparosTotalesVida: number;
  disparosConsumidos: number;
  costoCabezalUSD: number;
  fechaUltimoMantenimiento: string;
  proximoMantenimiento: string;
  estado: "operativo" | "alerta_recambio" | "mantenimiento";
  cabinaAsignada: string;
}

const EQUIPOS_INICIALES: EquipoAparatologia[] = [
  {
    id: "eq-01",
    nombre: "Láser Diodo Soprano Titanium Trio",
    tipo: "laser_diodo",
    numeroSerie: "SN-TIT-2024-8841",
    cabezalActual: "Manípulo 4cm² Quattro",
    disparosTotalesVida: 20000000,
    disparosConsumidos: 16840000,
    costoCabezalUSD: 3200,
    fechaUltimoMantenimiento: "2026-08-15",
    proximoMantenimiento: "2026-11-15",
    estado: "alerta_recambio", // > 80% consumido
    cabinaAsignada: "Cabina 3 - Láser Diodo",
  },
  {
    id: "eq-02",
    nombre: "HIFU 7D Ultraformer III (Facial & Corporal)",
    tipo: "hifu",
    numeroSerie: "SN-HIFU-7D-1092",
    cabezalActual: "Cartucho 3.0mm (Dermis)",
    disparosTotalesVida: 20000,
    disparosConsumidos: 6420,
    costoCabezalUSD: 450,
    fechaUltimoMantenimiento: "2026-09-01",
    proximoMantenimiento: "2026-12-01",
    estado: "operativo",
    cabinaAsignada: "Cabina 1 - Facial Avanzado",
  },
  {
    id: "eq-03",
    nombre: "IPL Quantum Multifunción (Acné & Manchas)",
    tipo: "ipl",
    numeroSerie: "SN-IPL-QNT-4412",
    cabezalActual: "Lámpara Xenón Cristal Zafiro",
    disparosTotalesVida: 100000,
    disparosConsumidos: 38200,
    costoCabezalUSD: 600,
    fechaUltimoMantenimiento: "2026-07-20",
    proximoMantenimiento: "2026-10-20",
    estado: "operativo",
    cabinaAsignada: "Cabina 2 - Rejuvenecimiento",
  },
  {
    id: "eq-04",
    nombre: "Radiofrecuencia Fraccionada Microagujas",
    tipo: "radiofrecuencia",
    numeroSerie: "SN-RF-MN-098",
    cabezalActual: "Tip descartable 24 Pins",
    disparosTotalesVida: 50000,
    disparosConsumidos: 48900,
    costoCabezalUSD: 850,
    fechaUltimoMantenimiento: "2026-06-10",
    proximoMantenimiento: "2026-10-10",
    estado: "mantenimiento",
    cabinaAsignada: "Consultorio Médico",
  },
];

export default function AparatologiaPulsosSpa() {
  const [equipos, setEquipos] = useState<EquipoAparatologia[]>(EQUIPOS_INICIALES);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoAparatologia>(EQUIPOS_INICIALES[0]);
  const [openDisparoModal, setOpenDisparoModal] = useState<boolean>(false);
  const [openNuevoEquipoModal, setOpenNuevoEquipoModal] = useState<boolean>(false);

  // Form registrar disparos de sesión
  const [sesionForm, setSesionForm] = useState({
    paciente: "",
    zonaTratada: "Piernas Completas",
    pulsosAplicados: 1200,
    operador: "Dra. Nicole Sánchez",
    fluenciaJ: 12,
  });

  // Form nuevo equipo
  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: "",
    tipo: "laser_diodo" as const,
    numeroSerie: "",
    cabezalActual: "",
    disparosTotalesVida: 1000000,
    costoCabezalUSD: 1000,
    cabinaAsignada: "Cabina 1",
  });

  const registrarDisparos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesionForm.paciente || sesionForm.pulsosAplicados <= 0) {
      toast.error("Por favor completa los datos de la sesión y pulsos.");
      return;
    }

    setEquipos((prev) =>
      prev.map((eq) => {
        if (eq.id === equipoSeleccionado.id) {
          const nuevosConsumidos = eq.disparosConsumidos + sesionForm.pulsosAplicados;
          const pct = (nuevosConsumidos / eq.disparosTotalesVida) * 100;
          let nuevoEstado: "operativo" | "alerta_recambio" | "mantenimiento" = eq.estado;
          if (pct >= 85) nuevoEstado = "alerta_recambio";

          const actualizado = {
            ...eq,
            disparosConsumidos: nuevosConsumidos,
            estado: nuevoEstado,
          };
          setEquipoSeleccionado(actualizado);
          return actualizado;
        }
        return eq;
      })
    );

    setOpenDisparoModal(false);
    toast.success(
      `Se descontaron ${sesionForm.pulsosAplicados.toLocaleString()} disparos de ${equipoSeleccionado.nombre}.`
    );
  };

  const handleCrearEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEquipo.nombre || !nuevoEquipo.numeroSerie) {
      toast.error("Completa el nombre y número de serie.");
      return;
    }

    const nuevo: EquipoAparatologia = {
      id: `eq-${Date.now()}`,
      ...nuevoEquipo,
      disparosConsumidos: 0,
      fechaUltimoMantenimiento: new Date().toISOString().split("T")[0],
      proximoMantenimiento: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      estado: "operativo",
    };

    setEquipos([nuevo, ...equipos]);
    setEquipoSeleccionado(nuevo);
    setOpenNuevoEquipoModal(false);
    toast.success("Equipo de aparatología registrado con éxito.");
  };

  const resetearCabezal = (equipoId: string) => {
    setEquipos((prev) =>
      prev.map((eq) => {
        if (eq.id === equipoId) {
          const actualizado: EquipoAparatologia = {
            ...eq,
            disparosConsumidos: 0,
            estado: "operativo",
            fechaUltimoMantenimiento: new Date().toISOString().split("T")[0],
          };
          if (equipoSeleccionado.id === equipoId) setEquipoSeleccionado(actualizado);
          return actualizado;
        }
        return eq;
      })
    );
    toast.success("Contador de cabezal reiniciado por instalación de repuesto nuevo.");
  };

  // Cálculos métricos
  const disparosRestantes = Math.max(0, equipoSeleccionado.disparosTotalesVida - equipoSeleccionado.disparosConsumidos);
  const porcentajeConsumido = Math.min(100, (equipoSeleccionado.disparosConsumidos / equipoSeleccionado.disparosTotalesVida) * 100);
  const costoPorDisparo = (equipoSeleccionado.costoCabezalUSD / equipoSeleccionado.disparosTotalesVida);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Control de Aparatología & Contador de Disparos / Pulsos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoreo de vida útil de manípulos láser, cartuchos HIFU, lámparas IPL y prevención de fallas técnicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={openNuevoEquipoModal} onOpenChange={setOpenNuevoEquipoModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs gap-1.5 shadow-none">
                <Plus className="h-3.5 w-3.5" />
                Registrar Aparato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Nuevo Equipo de Aparatología
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearEquipo} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del Equipo y Modelo</Label>
                  <Input
                    placeholder="Ej. Láser Diodo Trio Ice"
                    value={nuevoEquipo.nombre}
                    onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tecnología</Label>
                    <Select
                      value={nuevoEquipo.tipo}
                      onValueChange={(v: any) => setNuevoEquipo({ ...nuevoEquipo, tipo: v })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laser_diodo">Láser Diodo</SelectItem>
                        <SelectItem value="hifu">HIFU 7D</SelectItem>
                        <SelectItem value="ipl">IPL / Luz Pulsada</SelectItem>
                        <SelectItem value="radiofrecuencia">Radiofrecuencia</SelectItem>
                        <SelectItem value="criolipolisis">Criolipólisis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Número de Serie</Label>
                    <Input
                      placeholder="SN-XXXX"
                      value={nuevoEquipo.numeroSerie}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, numeroSerie: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cabezal / Cartucho</Label>
                    <Input
                      placeholder="Ej. Manípulo 808nm"
                      value={nuevoEquipo.cabezalActual}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, cabezalActual: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pulsos Garantizados</Label>
                    <Input
                      type="number"
                      value={nuevoEquipo.disparosTotalesVida}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, disparosTotalesVida: parseInt(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Costo Repuesto (USD)</Label>
                    <Input
                      type="number"
                      value={nuevoEquipo.costoCabezalUSD}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, costoCabezalUSD: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cabina Asignada</Label>
                    <Input
                      placeholder="Cabina 1"
                      value={nuevoEquipo.cabinaAsignada}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, cabinaAsignada: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenNuevoEquipoModal(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="rounded-xl">
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openDisparoModal} onOpenChange={setOpenDisparoModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl h-9 text-xs gap-1.5 shadow-none bg-amber-600 hover:bg-amber-700 text-white">
                <Activity className="h-3.5 w-3.5" />
                Registrar Sesión & Pulsos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  Descontar Pulsos de {equipoSeleccionado.nombre}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={registrarDisparos} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Paciente / Cliente</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={sesionForm.paciente}
                    onChange={(e) => setSesionForm({ ...sesionForm, paciente: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Zona Anatómica</Label>
                    <Select
                      value={sesionForm.zonaTratada}
                      onValueChange={(v) => setSesionForm({ ...sesionForm, zonaTratada: v })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Piernas Completas">Piernas Completas</SelectItem>
                        <SelectItem value="Axilas">Axilas</SelectItem>
                        <SelectItem value="Bozo / Facial">Bozo / Facial</SelectItem>
                        <SelectItem value="Bikini Completo">Bikini Completo</SelectItem>
                        <SelectItem value="Espalda / Pecho">Espalda / Pecho</SelectItem>
                        <SelectItem value="Rostro Completo (HIFU)">Rostro Completo (HIFU)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pulsos Disparados</Label>
                    <Input
                      type="number"
                      min={1}
                      value={sesionForm.pulsosAplicados}
                      onChange={(e) => setSesionForm({ ...sesionForm, pulsosAplicados: parseInt(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Operador / Terapeuta</Label>
                    <Input
                      value={sesionForm.operador}
                      onChange={(e) => setSesionForm({ ...sesionForm, operador: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fluencia (J/cm²)</Label>
                    <Input
                      type="number"
                      value={sesionForm.fluenciaJ}
                      onChange={(e) => setSesionForm({ ...sesionForm, fluenciaJ: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl border border-border/70 text-xs text-muted-foreground">
                  * Costo amortizado de consumible para esta sesión:{" "}
                  <span className="font-bold text-foreground">
                    ${(costoPorDisparo * sesionForm.pulsosAplicados).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenDisparoModal(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
                    Aplicar y Descontar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid: Ficha de Telemetría del Equipo Seleccionado + Lista de Equipos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ficha de Telemetría y Salud del Cabezal */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {equipoSeleccionado.nombre}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Serie: <span className="font-mono text-foreground">{equipoSeleccionado.numeroSerie}</span> · Ubicación: {equipoSeleccionado.cabinaAsignada}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    equipoSeleccionado.estado === "operativo"
                      ? "default"
                      : equipoSeleccionado.estado === "alerta_recambio"
                      ? "destructive"
                      : "secondary"
                  }
                  className="capitalize text-[11px]"
                >
                  {equipoSeleccionado.estado.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Barra de progreso de vida útil de manípulo */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vida Útil del Cabezal ({equipoSeleccionado.cabezalActual})
                    </p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                      {equipoSeleccionado.disparosConsumidos.toLocaleString()} /{" "}
                      <span className="text-muted-foreground text-lg">
                        {equipoSeleccionado.disparosTotalesVida.toLocaleString()} pulsos
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-bold font-mono ${
                        porcentajeConsumido >= 85 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {(100 - porcentajeConsumido).toFixed(1)}% Restante
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {disparosRestantes.toLocaleString()} disparos disponibles
                    </p>
                  </div>
                </div>

                <Progress
                  value={porcentajeConsumido}
                  className={`h-3 rounded-full ${
                    porcentajeConsumido >= 85 ? "[&>div]:bg-rose-500" : "[&>div]:bg-amber-500"
                  }`}
                />
              </div>

              {/* Métricas operativas del equipo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/70 bg-card">
                  <p className="text-[11px] text-muted-foreground">Costo por Pulso</p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                    ${costoPorDisparo < 0.01 ? costoPorDisparo.toFixed(5) : costoPorDisparo.toFixed(3)} USD
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-card">
                  <p className="text-[11px] text-muted-foreground">Costo Repuesto</p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                    ${equipoSeleccionado.costoCabezalUSD} USD
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-card">
                  <p className="text-[11px] text-muted-foreground">Último Service</p>
                  <p className="text-xs font-semibold text-foreground mt-1">
                    {equipoSeleccionado.fechaUltimoMantenimiento}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/70 bg-card">
                  <p className="text-[11px] text-muted-foreground">Próximo Calibrado</p>
                  <p className="text-xs font-semibold text-foreground mt-1">
                    {equipoSeleccionado.proximoMantenimiento}
                  </p>
                </div>
              </div>

              {/* Alerta de recambio preventivo si aplica */}
              {porcentajeConsumido >= 80 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Advertencia de Agotamiento de Cabezal</p>
                    <p className="text-[11px] leading-relaxed">
                      El manípulo ha superado el 80% de su ciclo de vida. Se recomienda ordenar el módulo de repuesto con el proveedor técnico para evitar paro de cabina.
                    </p>
                  </div>
                </div>
              )}

              {/* Botón de recambio/reset de cabezal */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs text-muted-foreground">
                  ¿Instalaste un cabezal o cartucho nuevo?
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetearCabezal(equipoSeleccionado.id)}
                  className="rounded-xl text-xs gap-1.5 h-8 border-border/70"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Instalar Nuevo Cabezal (Reset Contador)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listado de Equipos */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Parque de Aparatología ({equipos.length})
          </h3>

          <div className="space-y-2.5">
            {equipos.map((eq) => {
              const isSelected = equipoSeleccionado.id === eq.id;
              const pct = (eq.disparosConsumidos / eq.disparosTotalesVida) * 100;
              return (
                <div
                  key={eq.id}
                  onClick={() => setEquipoSeleccionado(eq)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/5 shadow-sm"
                      : "border-border/70 hover:border-amber-500/40 bg-card hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{eq.nombre}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{eq.cabinaAsignada}</p>
                    </div>
                    <Badge
                      variant={eq.estado === "operativo" ? "outline" : "destructive"}
                      className="text-[10px] py-0 px-1.5 capitalize"
                    >
                      {eq.estado.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Pulsos: {eq.disparosConsumidos.toLocaleString()}</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 rounded-full" />
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
