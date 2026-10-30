import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Syringe, Crown, Plus, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Zap, Gift, User, Flame } from "lucide-react";
import { toast } from "sonner";

export interface CabinaSpa {
  id: string;
  nombre: string;
  tipo: "facial_dermo" | "spa_masajes" | "aparatologia_corporal" | "laser_diodo" | "medica_inyectables";
  estado: "disponible" | "ocupada" | "higienizacion";
  terapeutaActual?: string;
  clienteActual?: string;
  equipamiento: string[];
  disparosLaserAcumulados?: number;
}

export interface RegistroVialInyectable {
  id: string;
  clienteNombre: string;
  medicoTratante: string;
  productoTipo: "toxina_botulinica" | "acido_hialuronico" | "bioestimulador_colageno";
  marcaComercial: string;
  numeroLote: string;
  fechaCaducidad: string;
  dosisAplicada: string; // ej: "35 UI" o "1.2 ml"
  zonasTratadas: string[];
  fechaAplicacion: string;
  fechaRetoqueRecomendada: string;
}

const CABINAS_INICIALES: CabinaSpa[] = [
  {
    id: "cab-1",
    nombre: "Cabina 1 (Loto Facial)",
    tipo: "facial_dermo",
    estado: "ocupada",
    terapeutaActual: "Cosmiatra Elena Rosado",
    clienteActual: "Mariana Tejeda",
    equipamiento: ["Hydrafacial Elite", "Vapor de Ozono", "Lámpara de Wood", "Alta Frecuencia"],
  },
  {
    id: "cab-2",
    nombre: "Cabina 2 (Oasis Spa & Parejas)",
    tipo: "spa_masajes",
    estado: "disponible",
    equipamiento: ["2 Camillas térmicas", "Kit piedras volcánicas", "Difusor ultrasónico aromático", "Cromoterapia"],
  },
  {
    id: "cab-3",
    nombre: "Cabina 3 (Sculpt Corporal)",
    tipo: "aparatologia_corporal",
    estado: "ocupada",
    terapeutaActual: "Masoterapeuta Carlos Ortiz",
    clienteActual: "Patricia Ramos",
    equipamiento: ["Criolipólisis 360", "Cavitación 40K", "Radiofrecuencia Multipolar", "Presoterapia 8 cámaras"],
  },
  {
    id: "cab-4",
    nombre: "Cabina 4 (Láser Médico Pro)",
    tipo: "laser_diodo",
    estado: "disponible",
    equipamiento: ["Láser Diodo Triple Onda (755/808/1064nm)", "Enfriamiento criogénico de zafiro"],
    disparosLaserAcumulados: 142500,
  },
  {
    id: "cab-5",
    nombre: "Consultorio Médico Estético",
    tipo: "medica_inyectables",
    estado: "disponible",
    equipamiento: ["Lámpara quirúrgica LED", "Centrífuga de PRP", "Nevera de biológicos 2-8°C", "Carro de reanimación"],
  },
];

const VIALES_INICIALES: RegistroVialInyectable[] = [
  {
    id: "vial-1",
    clienteNombre: "Valeria Guzmán",
    medicoTratante: "Dra. Sofía Morales (Médico Estético)",
    productoTipo: "toxina_botulinica",
    marcaComercial: "Botox® Allergan 100 UI",
    numeroLote: "BTX-9942B",
    fechaCaducidad: "08/2027",
    dosisAplicada: "40 UI",
    zonasTratadas: ["Frente (12 UI)", "Entrecejo / Glabela (18 UI)", "Patas de gallo (10 UI)"],
    fechaAplicacion: "28 Oct 2026",
    fechaRetoqueRecomendada: "12 Nov 2026 (Retoque 15 días)",
  },
  {
    id: "vial-2",
    clienteNombre: "Clara Minaya",
    medicoTratante: "Dra. Sofía Morales",
    productoTipo: "acido_hialuronico",
    marcaComercial: "Juvéderm® Ultra Plus XC",
    numeroLote: "JUV-4481A",
    fechaCaducidad: "11/2026",
    dosisAplicada: "1.0 ml",
    zonasTratadas: ["Perfilado e hidratación labial (0.6 ml)", "Surco nasogeniano bilateral (0.4 ml)"],
    fechaAplicacion: "25 Oct 2026",
    fechaRetoqueRecomendada: "09 Nov 2026",
  },
];

const tipoCabinaBadge: Record<CabinaSpa["tipo"], string> = {
  facial_dermo: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  spa_masajes: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  aparatologia_corporal: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  laser_diodo: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40",
  medica_inyectables: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
};

export default function CabinasSpaTrazabilidadViales() {
  const [cabinas, setCabinas] = useState<CabinaSpa[]>(CABINAS_INICIALES);
  const [viales, setViales] = useState<RegistroVialInyectable[]>(VIALES_INICIALES);
  const [openModalVial, setOpenModalVial] = useState(false);
  const [vialForm, setVialForm] = useState({
    clienteNombre: "",
    medicoTratante: "Dra. Sofía Morales",
    productoTipo: "toxina_botulinica" as RegistroVialInyectable["productoTipo"],
    marcaComercial: "Botox® Allergan",
    numeroLote: "",
    fechaCaducidad: "",
    dosisAplicada: "30 UI",
    zonasTratadas: "Frente, Entrecejo",
  });

  const handleGuardarVial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vialForm.clienteNombre.trim() || !vialForm.numeroLote.trim()) {
      toast.error("El nombre del paciente y número de lote son obligatorios para trazabilidad médica");
      return;
    }
    const nuevo: RegistroVialInyectable = {
      id: `vial-${Date.now()}`,
      clienteNombre: vialForm.clienteNombre,
      medicoTratante: vialForm.medicoTratante,
      productoTipo: vialForm.productoTipo,
      marcaComercial: vialForm.marcaComercial,
      numeroLote: vialForm.numeroLote,
      fechaCaducidad: vialForm.fechaCaducidad || "Vigente",
      dosisAplicada: vialForm.dosisAplicada,
      zonasTratadas: vialForm.zonasTratadas.split(",").map((s) => s.trim()),
      fechaAplicacion: new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }),
      fechaRetoqueRecomendada: "En 15 días posteriores",
    };
    setViales([nuevo, ...viales]);
    toast.success("Registro de vial y trazabilidad clínica guardado");
    setOpenModalVial(false);
  };

  const alternarEstadoCabina = (id: string, nuevoEstado: CabinaSpa["estado"]) => {
    setCabinas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
    );
    toast.info(`Cabina actualizada a: ${nuevoEstado}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con métricas generales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Clínica Estética, Spa & Centro de Masajes Multi-Cabina
            </h2>
            <p className="text-xs text-muted-foreground">
              Gestión de cabinas especializadas, contador de disparos láser y trazabilidad estricta de viales médicos.
            </p>
          </div>
        </div>

        <Dialog open={openModalVial} onOpenChange={setOpenModalVial}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5 shadow-none bg-purple-600 hover:bg-purple-700 text-white">
              <Syringe className="h-4 w-4" /> Registrar Lote / Inyectable
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Syringe className="h-5 w-5 text-purple-600" />
                Trazabilidad de Inyectable Médico (Botox / Ácido Hialurónico)
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGuardarVial} className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Paciente / Cliente</Label>
                  <Input
                    placeholder="Ej. Valeria Guzmán"
                    value={vialForm.clienteNombre}
                    onChange={(e) => setVialForm({ ...vialForm, clienteNombre: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Médico Aplicador</Label>
                  <Input
                    value={vialForm.medicoTratante}
                    onChange={(e) => setVialForm({ ...vialForm, medicoTratante: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo de Biológico / Relleno</Label>
                  <Select
                    value={vialForm.productoTipo}
                    onValueChange={(val: any) => setVialForm({ ...vialForm, productoTipo: val })}
                  >
                    <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toxina_botulinica">Toxina Botulínica (Neuromodulador)</SelectItem>
                      <SelectItem value="acido_hialuronico">Ácido Hialurónico Reticulado</SelectItem>
                      <SelectItem value="bioestimulador_colageno">Bioestimulador (Radiesse/Sculptra)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Marca Comercial</Label>
                  <Input
                    placeholder="Ej. Botox® Allergan 100 UI"
                    value={vialForm.marcaComercial}
                    onChange={(e) => setVialForm({ ...vialForm, marcaComercial: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-destructive">Número de Lote (Trazabilidad)</Label>
                  <Input
                    placeholder="BTX-XXXXX"
                    value={vialForm.numeroLote}
                    onChange={(e) => setVialForm({ ...vialForm, numeroLote: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fecha de Expiración</Label>
                  <Input
                    placeholder="MM/AAAA"
                    value={vialForm.fechaCaducidad}
                    onChange={(e) => setVialForm({ ...vialForm, fechaCaducidad: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Dosis / Volumen Aplicado</Label>
                  <Input
                    placeholder="Ej. 40 UI o 1.0 ml"
                    value={vialForm.dosisAplicada}
                    onChange={(e) => setVialForm({ ...vialForm, dosisAplicada: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs">Zonas Anatómicas (separadas por coma)</Label>
                  <Input
                    placeholder="Frente, Glabela, Patas de gallo..."
                    value={vialForm.zonasTratadas}
                    onChange={(e) => setVialForm({ ...vialForm, zonasTratadas: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                Validar Lote y Registrar Ficha Médica
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. Grid de Cabinas de Spa & Aparatología */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
            Estado de Cabinas de Spa & Aparatología en Tiempo Real
          </h3>
          <span className="text-xs text-muted-foreground">{cabinas.length} cabinas configuradas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cabinas.map((c) => (
            <Card key={c.id} className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">{c.nombre}</CardTitle>
                    <Badge variant="outline" className={`rounded-md text-[10px] mt-1 capitalize font-medium ${tipoCabinaBadge[c.tipo]}`}>
                      {c.tipo.replace("_", " ")}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={`rounded-md text-[10px] font-semibold ${c.estado === "disponible" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30"}`}>
                    {c.estado}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-2.5 text-xs">
                {c.estado === "ocupada" ? (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                    <p className="text-[11px] text-foreground font-semibold">Cliente: {c.clienteActual}</p>
                    <p className="text-[10px] text-muted-foreground">Terapeuta: {c.terapeutaActual}</p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Cabina sanitizada y climatizada</span>
                  </div>
                )}

                {c.disparosLaserAcumulados && (
                  <div className="p-2 rounded-lg bg-secondary/50 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap className="h-3.5 w-3.5 text-amber-500" /> Disparos Láser:
                    </span>
                    <span className="font-mono font-bold">{c.disparosLaserAcumulados.toLocaleString()} pulsos</span>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Equipamiento:</span>
                  <div className="flex flex-wrap gap-1">
                    {c.equipamiento.map((eq, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  {c.estado === "disponible" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl text-xs h-7 border-border/80"
                      onClick={() => alternarEstadoCabina(c.id, "ocupada")}
                    >
                      Ocupar Cabina
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl text-xs h-7 border-border/80 text-emerald-600 dark:text-emerald-400"
                      onClick={() => alternarEstadoCabina(c.id, "disponible")}
                    >
                      Liberar Cabina
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Trazabilidad de Viales Inyectables (Botox & Ácido Hialurónico) */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <div className="p-4 border-b border-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Syringe className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-foreground">
              Libro de Trazabilidad de Lotes de Toxina & Rellenos Faciales
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">{viales.length} viales registrados</span>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs">Paciente & Médico</TableHead>
              <TableHead className="text-xs">Biológico / Relleno</TableHead>
              <TableHead className="text-xs font-mono">Lote de Fábrica</TableHead>
              <TableHead className="text-xs">Dosis Aplicada</TableHead>
              <TableHead className="text-xs">Zonas de Inyección</TableHead>
              <TableHead className="text-xs">Fecha Aplicación</TableHead>
              <TableHead className="text-xs">Control Retoque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {viales.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="font-semibold text-foreground">{v.clienteNombre}</div>
                  <div className="text-[10px] text-muted-foreground">{v.medicoTratante}</div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{v.marcaComercial}</span>
                  <div className="text-[10px] text-muted-foreground capitalize">{v.productoTipo.replace(/_/g, " ")}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px] bg-secondary font-bold">
                    {v.numeroLote}
                  </Badge>
                  <div className="text-[9px] text-muted-foreground">Cad: {v.fechaCaducidad}</div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-sm text-purple-600 dark:text-purple-400 tabular-nums">
                    {v.dosisAplicada}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {v.zonasTratadas.map((z, idx) => (
                      <div key={idx} className="text-[10px] text-muted-foreground">
                        • {z}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{v.fechaAplicacion}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    <Clock className="h-3 w-3 mr-1" />
                    {v.fechaRetoqueRecomendada}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
