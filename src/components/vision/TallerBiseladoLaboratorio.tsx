import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Glasses, Wrench, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Plus, Send, Eye, Building2, Search, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

interface TrabajoTaller {
  id: string;
  codigoOrden: string;
  paciente: string;
  telefono: string;
  montura: string;
  tipoBiselado: "acetato_v" | "ranurado_nylor" | "taladrado_al_aire" | "metal_cerrado";
  disenoLente: string;
  laboratorioTallado: string;
  etapa: "ingresada" | "tallado_digital" | "biselado_montaje" | "control_calidad" | "listo_entrega" | "entregado";
  fechaPrometida: string;
  focimetriaOk: boolean;
  garantiaDias: number;
}

const TRABAJOS_INICIALES: TrabajoTaller[] = [
  {
    id: "ord-801",
    codigoOrden: "ORD-OPT-2026-081",
    paciente: "Carolina Batista",
    telefono: "809-555-1122",
    montura: "Ray-Ban RX5154 Clubmaster (Acetato/Metal)",
    tipoBiselado: "acetato_v",
    disenoLente: "Progresivo Digital Free-Form BlueBlock",
    laboratorioTallado: "Lab Digital Óptico Santo Domingo",
    etapa: "biselado_montaje",
    fechaPrometida: "2026-10-31",
    focimetriaOk: true,
    garantiaDias: 60,
  },
  {
    id: "ord-802",
    codigoOrden: "ORD-OPT-2026-082",
    paciente: "Lic. Marcos Henríquez",
    telefono: "829-555-4490",
    montura: "Silhouette Titan Minimal Art (Al Aire)",
    tipoBiselado: "taladrado_al_aire",
    disenoLente: "Monofocal Alto Índice 1.67 Antirreflejo",
    laboratorioTallado: "Essilor Dominicana",
    etapa: "control_calidad",
    fechaPrometida: "2026-10-30",
    focimetriaOk: true,
    garantiaDias: 90,
  },
  {
    id: "ord-803",
    codigoOrden: "ORD-OPT-2026-083",
    paciente: "Dra. Carmen Suero",
    telefono: "809-555-7761",
    montura: "Oakley Pitchman R (Nylor Semi al Aire)",
    tipoBiselado: "ranurado_nylor",
    disenoLente: "Policarbonato Transitions Gen 8 Gris",
    laboratorioTallado: "Lab Digital Óptico Santo Domingo",
    etapa: "listo_entrega",
    fechaPrometida: "2026-10-29",
    focimetriaOk: true,
    garantiaDias: 30,
  },
  {
    id: "ord-804",
    codigoOrden: "ORD-OPT-2026-084",
    paciente: "Franklin Pimentel",
    telefono: "849-555-9011",
    montura: "Armazón Metálico Flex Titanium",
    tipoBiselado: "metal_cerrado",
    disenoLente: "Bifocal Flattop 28 CR-39",
    laboratorioTallado: "Taller Interno Central",
    etapa: "tallado_digital",
    fechaPrometida: "2026-11-02",
    focimetriaOk: false,
    garantiaDias: 30,
  },
];

const GABINETES_OPTICOS = [
  { id: "gab-1", nombre: "Gabinete 1 - Refracción & Foróptero", especialista: "Lic. Roberto Guzman, OD", estado: "ocupado", pacienteActual: "Manuel Rivas" },
  { id: "gab-2", nombre: "Gabinete 2 - Lámpara Hendidura & Tonometría", especialista: "Dr. Víctor Peña (Oftalmólogo)", estado: "disponible", pacienteActual: null },
  { id: "gab-3", nombre: "Gabinete 3 - Contactología & Adaptación", especialista: "Lic. Mariana Soto", estado: "disponible", pacienteActual: null },
];

export default function TallerBiseladoLaboratorio() {
  const [trabajos, setTrabajos] = useState<TrabajoTaller[]>(TRABAJOS_INICIALES);
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todos");
  const [openNuevaOrden, setOpenNuevaOrden] = useState<boolean>(false);

  // Form nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({
    paciente: "",
    telefono: "",
    montura: "",
    tipoBiselado: "acetato_v" as const,
    disenoLente: "Monofocal Policarbonato",
    laboratorioTallado: "Lab Digital Óptico Santo Domingo",
    fechaPrometida: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    garantiaDias: 60,
  });

  const handleCrearOrden = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaOrden.paciente || !nuevaOrden.montura) {
      toast.error("Por favor completa los datos del paciente y la montura.");
      return;
    }

    const nueva: TrabajoTaller = {
      id: `ord-${Date.now()}`,
      codigoOrden: `ORD-OPT-${Date.now().toString().slice(-4)}`,
      ...nuevaOrden,
      etapa: "ingresada",
      focimetriaOk: false,
    };

    setTrabajos([nueva, ...trabajos]);
    setOpenNuevaOrden(false);
    toast.success(`Orden de trabajo ${nueva.codigoOrden} enviada al taller de biselado.`);
  };

  const avanzarEtapa = (id: string, etapaActual: TrabajoTaller["etapa"]) => {
    const ordenEtapas: TrabajoTaller["etapa"][] = [
      "ingresada",
      "tallado_digital",
      "biselado_montaje",
      "control_calidad",
      "listo_entrega",
      "entregado",
    ];

    const idx = ordenEtapas.indexOf(etapaActual);
    if (idx < ordenEtapas.length - 1) {
      const siguiente = ordenEtapas[idx + 1];
      setTrabajos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, etapa: siguiente, focimetriaOk: siguiente === "control_calidad" || siguiente === "listo_entrega" ? true : t.focimetriaOk } : t))
      );
      toast.success(`Orden actualizada a: ${siguiente.replace("_", " ").toUpperCase()}`);
    }
  };

  const notificarWhatsAppListo = (trabajo: TrabajoTaller) => {
    const texto = `Hola *${trabajo.paciente}*, te informamos de parte de tu Centro Óptico que tus lentes con montura *${trabajo.montura}* ya están montados, calibrados y listos para retiro y prueba de adaptación. 👓✨\n\nPuedes pasar en nuestro horario habitual. Tu trabajo cuenta con *${trabajo.garantiaDias} días de garantía de adaptación*. ¡Te esperamos!`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Aviso de lentes listos abierto en WhatsApp.");
  };

  const trabajosFiltrados = trabajos.filter((t) => {
    if (filtroEtapa === "todos") return true;
    return t.etapa === filtroEtapa;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-500" />
            Taller de Biselado, Trazabilidad de Laboratorio & Gabinetes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Flujo de corte, ranurado nylor, taladrado al aire, control focimétrico ANSI y gestión de gabinetes de consulta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
            <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las etapas</SelectItem>
              <SelectItem value="ingresada">Ingresada</SelectItem>
              <SelectItem value="tallado_digital">Tallado Digital</SelectItem>
              <SelectItem value="biselado_montaje">Biselado & Montaje</SelectItem>
              <SelectItem value="control_calidad">Control Focimétrico</SelectItem>
              <SelectItem value="listo_entrega">Listos para Retiro</SelectItem>
              <SelectItem value="entregado">Entregados</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={openNuevaOrden} onOpenChange={setOpenNuevaOrden}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl h-9 text-xs gap-1.5 shadow-none">
                <Plus className="h-3.5 w-3.5" />
                Nueva Orden Taller
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Glasses className="h-4 w-4 text-primary" />
                  Nueva Orden de Biselado & Montaje
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearOrden} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Paciente / Cliente</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={nuevaOrden.paciente}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, paciente: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono / WhatsApp</Label>
                    <Input
                      placeholder="809-555-0000"
                      value={nuevaOrden.telefono}
                      onChange={(e) => setNuevaOrden({ ...nuevaOrden, telefono: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha Prometida</Label>
                    <Input
                      type="date"
                      value={nuevaOrden.fechaPrometida}
                      onChange={(e) => setNuevaOrden({ ...nuevaOrden, fechaPrometida: e.target.value })}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Montura (Marca, Modelo, Color)</Label>
                  <Input
                    placeholder="Ej. Ray-Ban RX5154 Carey"
                    value={nuevaOrden.montura}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, montura: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de Montaje / Bisel</Label>
                    <Select
                      value={nuevaOrden.tipoBiselado}
                      onValueChange={(v: any) => setNuevaOrden({ ...nuevaOrden, tipoBiselado: v })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acetato_v">Bisel V Estándar (Acetato)</SelectItem>
                        <SelectItem value="metal_cerrado">Bisel Plano Fino (Metal)</SelectItem>
                        <SelectItem value="ranurado_nylor">Ranurado Hilo Nylor</SelectItem>
                        <SelectItem value="taladrado_al_aire">Taladrado al Aire (3 Piezas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Garantía (Días)</Label>
                    <Select
                      value={nuevaOrden.garantiaDias.toString()}
                      onValueChange={(v) => setNuevaOrden({ ...nuevaOrden, garantiaDias: parseInt(v) || 30 })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Días</SelectItem>
                        <SelectItem value="60">60 Días (Progresivos)</SelectItem>
                        <SelectItem value="90">90 Días Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Diseño de Lente</Label>
                  <Input
                    value={nuevaOrden.disenoLente}
                    onChange={(e) => setNuevaOrden({ ...nuevaOrden, disenoLente: e.target.value })}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenNuevaOrden(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="rounded-xl">
                    Enviar al Taller
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Monitor de Gabinetes Ópticos / Oftalmológicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GABINETES_OPTICOS.map((gab) => (
          <Card key={gab.id} className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs font-bold text-foreground">{gab.nombre}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{gab.especialista}</p>
                {gab.pacienteActual && (
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    Paciente en gabinete: {gab.pacienteActual}
                  </p>
                )}
              </div>
              <Badge
                variant={gab.estado === "disponible" ? "default" : "secondary"}
                className="capitalize text-[10px]"
              >
                {gab.estado}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de Trabajos en Taller */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">Código Orden</TableHead>
              <TableHead className="text-xs">Paciente / Teléfono</TableHead>
              <TableHead className="text-xs">Montura & Tipo Montaje</TableHead>
              <TableHead className="text-xs">Diseño / Laboratorio</TableHead>
              <TableHead className="text-xs">Entrega Prometida</TableHead>
              <TableHead className="text-xs text-center">Focimetría</TableHead>
              <TableHead className="text-xs text-center">Etapa Taller</TableHead>
              <TableHead className="text-xs text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trabajosFiltrados.map((trabajo) => (
              <TableRow key={trabajo.id} className="text-xs">
                <TableCell className="font-mono font-bold text-primary">{trabajo.codigoOrden}</TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{trabajo.paciente}</p>
                  <p className="text-[10px] text-muted-foreground">{trabajo.telefono}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{trabajo.montura}</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
                    {trabajo.tipoBiselado.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{trabajo.disenoLente}</p>
                  <p className="text-[10px] text-muted-foreground">{trabajo.laboratorioTallado}</p>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">{trabajo.fechaPrometida}</TableCell>
                <TableCell className="text-center">
                  {trabajo.focimetriaOk ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3 inline" /> ANSI Aprobada
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 inline" /> En proceso
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      trabajo.etapa === "listo_entrega"
                        ? "default"
                        : trabajo.etapa === "entregado"
                        ? "outline"
                        : "secondary"
                    }
                    className="capitalize text-[10px]"
                  >
                    {trabajo.etapa.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {trabajo.etapa === "listo_entrega" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => notificarWhatsAppListo(trabajo)}
                        className="h-7 text-xs rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1"
                      >
                        <Send className="h-3 w-3" /> Avisar WA
                      </Button>
                    ) : trabajo.etapa !== "entregado" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => avanzarEtapa(trabajo.id, trabajo.etapa)}
                        className="h-7 text-xs rounded-lg text-primary hover:bg-primary/10 gap-1"
                      >
                        Avanzar <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Entregado ✓</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {trabajosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay trabajos en taller para la etapa seleccionada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
