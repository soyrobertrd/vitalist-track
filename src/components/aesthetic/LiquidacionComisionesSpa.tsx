import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, UserCheck, Calendar, Download, CheckCircle2, Clock, Calculator, Percent, ShieldCheck, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface LiquidacionItem {
  id: string;
  profesional: string;
  rol: "medico_estetico" | "cosmiatra" | "masoterapeuta";
  servicio: string;
  fecha: string;
  precioServicio: number;
  costoInsumos: number; // Ej. viales, tips, ampollas
  baseComisionable: number;
  porcentajeComision: number;
  montoComision: number;
  estado: "pendiente" | "liquidado";
}

const SERVICIOS_HISTORIAL: LiquidacionItem[] = [
  {
    id: "liq-101",
    profesional: "Dr. Alejandro Morales",
    rol: "medico_estetico",
    servicio: "Armonización Facial (Botox + 2 Viales AH)",
    fecha: "2026-10-28",
    precioServicio: 38000,
    costoInsumos: 14000, // Costo de viales botox y juvederm
    baseComisionable: 24000,
    porcentajeComision: 50,
    montoComision: 12000,
    estado: "pendiente",
  },
  {
    id: "liq-102",
    profesional: "Lic. Stephanie Taveras",
    rol: "cosmiatra",
    servicio: "Limpieza Hidrafacial Profunda + Peeling",
    fecha: "2026-10-29",
    precioServicio: 4500,
    costoInsumos: 600,
    baseComisionable: 3900,
    porcentajeComision: 35,
    montoComision: 1365,
    estado: "liquidado",
  },
  {
    id: "liq-103",
    profesional: "Yadira Mercedes",
    rol: "masoterapeuta",
    servicio: "Masaje Descontracturante & Piedras Calientes 80m",
    fecha: "2026-10-29",
    precioServicio: 3200,
    costoInsumos: 300,
    baseComisionable: 2900,
    porcentajeComision: 40,
    montoComision: 1160,
    estado: "pendiente",
  },
  {
    id: "liq-104",
    profesional: "Lic. Stephanie Taveras",
    rol: "cosmiatra",
    servicio: "Venta Kit Skincare Domiciliario (Protector + C)",
    fecha: "2026-10-30",
    precioServicio: 5600,
    costoInsumos: 3500,
    baseComisionable: 2100,
    porcentajeComision: 15,
    montoComision: 315,
    estado: "pendiente",
  },
];

export default function LiquidacionComisionesSpa() {
  const [items, setItems] = useState<LiquidacionItem[]>(SERVICIOS_HISTORIAL);
  const [filtroProfesional, setFiltroProfesional] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [openModalNuevo, setOpenModalNuevo] = useState<boolean>(false);

  // Form nuevo servicio
  const [nuevoForm, setNuevoForm] = useState({
    profesional: "Dr. Alejandro Morales",
    rol: "medico_estetico" as "medico_estetico" | "cosmiatra" | "masoterapeuta",
    servicio: "",
    precioServicio: 0,
    costoInsumos: 0,
    porcentajeComision: 40,
  });

  const handleCrearServicio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoForm.servicio || nuevoForm.precioServicio <= 0) {
      toast.error("Por favor completa el nombre del servicio y precio cobrado.");
      return;
    }

    const base = Math.max(0, nuevoForm.precioServicio - nuevoForm.costoInsumos);
    const comision = (base * nuevoForm.porcentajeComision) / 100;

    const nuevo: LiquidacionItem = {
      id: `liq-${Date.now()}`,
      profesional: nuevoForm.profesional,
      rol: nuevoForm.rol,
      servicio: nuevoForm.servicio,
      fecha: new Date().toISOString().split("T")[0],
      precioServicio: nuevoForm.precioServicio,
      costoInsumos: nuevoForm.costoInsumos,
      baseComisionable: base,
      porcentajeComision: nuevoForm.porcentajeComision,
      montoComision: comision,
      estado: "pendiente",
    };

    setItems([nuevo, ...items]);
    setOpenModalNuevo(false);
    toast.success("Servicio registrado para liquidación de honorarios.");
  };

  const liquidarItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, estado: "liquidado" } : i))
    );
    toast.success("Comisión marcada como liquidada.");
  };

  const liquidarTodoPendiente = () => {
    setItems((prev) => prev.map((i) => ({ ...i, estado: "liquidado" })));
    toast.success("Todas las comisiones pendientes han sido liquidadas.");
  };

  // Filtrado
  const itemsFiltrados = items.filter((i) => {
    if (filtroProfesional !== "todos" && i.profesional !== filtroProfesional) return false;
    if (filtroEstado !== "todos" && i.estado !== filtroEstado) return false;
    return true;
  });

  // Métricas
  const totalGenerado = itemsFiltrados.reduce((acc, i) => acc + i.precioServicio, 0);
  const totalInsumosDeducidos = itemsFiltrados.reduce((acc, i) => acc + i.costoInsumos, 0);
  const totalComisiones = itemsFiltrados.reduce((acc, i) => acc + i.montoComision, 0);
  const totalPendiente = itemsFiltrados
    .filter((i) => i.estado === "pendiente")
    .reduce((acc, i) => acc + i.montoComision, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Liquidación de Honorarios & Comisiones por Terapeuta / Médico
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cálculo de splits con deducción de insumos clínicos, porcentajes por cabina y cierres de nómina ágiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalPendiente > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={liquidarTodoPendiente}
              className="rounded-xl h-9 text-xs gap-1.5 shadow-none text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Liquidar Pendientes
            </Button>
          )}

          <Dialog open={openModalNuevo} onOpenChange={setOpenModalNuevo}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl h-9 text-xs gap-1.5 shadow-none">
                <Plus className="h-3.5 w-3.5" />
                Registrar Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Nuevo Registro para Comisión
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearServicio} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Profesional / Terapeuta</Label>
                  <Select
                    value={nuevoForm.profesional}
                    onValueChange={(v) => {
                      let rol: "medico_estetico" | "cosmiatra" | "masoterapeuta" = "cosmiatra";
                      let pct = 35;
                      if (v.includes("Dr.")) {
                        rol = "medico_estetico";
                        pct = 50;
                      } else if (v.includes("Yadira")) {
                        rol = "masoterapeuta";
                        pct = 40;
                      }
                      setNuevoForm({ ...nuevoForm, profesional: v, rol, porcentajeComision: pct });
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr. Alejandro Morales">Dr. Alejandro Morales (Médico Estético)</SelectItem>
                      <SelectItem value="Lic. Stephanie Taveras">Lic. Stephanie Taveras (Cosmiatra)</SelectItem>
                      <SelectItem value="Yadira Mercedes">Yadira Mercedes (Masoterapeuta Spa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Servicio o Tratamiento</Label>
                  <Input
                    placeholder="Ej. Limpieza Facial / Relleno"
                    value={nuevoForm.servicio}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, servicio: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Precio Cobrado (DOP)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={nuevoForm.precioServicio || ""}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, precioServicio: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Insumos a Deducir (DOP)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={nuevoForm.costoInsumos || ""}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, costoInsumos: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">% Comisión Terapeuta</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={nuevoForm.porcentajeComision}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, porcentajeComision: parseFloat(e.target.value) || 0 })}
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground">Comisión Resultante:</span>
                    <span className="text-xs font-bold text-primary font-mono">
                      RD${" "}
                      {(
                        (Math.max(0, nuevoForm.precioServicio - nuevoForm.costoInsumos) * nuevoForm.porcentajeComision) /
                        100
                      ).toLocaleString()}{" "}
                      DOP
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenModalNuevo(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="rounded-xl">
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Facturado Total</p>
            <p className="text-lg font-bold font-mono text-foreground mt-0.5">
              RD$ {totalGenerado.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Insumos Deducidos</p>
            <p className="text-lg font-bold font-mono text-foreground mt-0.5">
              RD$ {totalInsumosDeducidos.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Comisiones</p>
            <p className="text-lg font-bold font-mono text-foreground mt-0.5">
              RD$ {totalComisiones.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
              Pendiente por Pagar
            </p>
            <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              RD$ {totalPendiente.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filtroProfesional} onValueChange={setFiltroProfesional}>
          <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Profesional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los profesionales</SelectItem>
            <SelectItem value="Dr. Alejandro Morales">Dr. Alejandro Morales</SelectItem>
            <SelectItem value="Lic. Stephanie Taveras">Lic. Stephanie Taveras</SelectItem>
            <SelectItem value="Yadira Mercedes">Yadira Mercedes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="liquidado">Liquidados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Servicios y Comisiones */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">Fecha</TableHead>
              <TableHead className="text-xs">Profesional / Rol</TableHead>
              <TableHead className="text-xs">Tratamiento Realizado</TableHead>
              <TableHead className="text-xs text-right">Precio Cobrado</TableHead>
              <TableHead className="text-xs text-right">Costo Insumo</TableHead>
              <TableHead className="text-xs text-center">% Split</TableHead>
              <TableHead className="text-xs text-right">Comisión a Pagar</TableHead>
              <TableHead className="text-xs text-center">Estado</TableHead>
              <TableHead className="text-xs text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsFiltrados.map((item) => (
              <TableRow key={item.id} className="text-xs">
                <TableCell className="font-mono text-muted-foreground">{item.fecha}</TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{item.profesional}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{item.rol.replace("_", " ")}</p>
                </TableCell>
                <TableCell className="font-medium text-foreground">{item.servicio}</TableCell>
                <TableCell className="text-right font-mono font-medium">RD$ {item.precioServicio.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {item.costoInsumos > 0 ? `-RD$ ${item.costoInsumos.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-primary">{item.porcentajeComision}%</TableCell>
                <TableCell className="text-right font-mono font-bold text-foreground">
                  RD$ {item.montoComision.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={item.estado === "liquidado" ? "default" : "secondary"}
                    className="capitalize text-[10px]"
                  >
                    {item.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {item.estado === "pendiente" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => liquidarItem(item.id)}
                      className="h-7 text-xs rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      Pagar
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Liquidado
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {itemsFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No se encontraron registros de comisiones con los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
