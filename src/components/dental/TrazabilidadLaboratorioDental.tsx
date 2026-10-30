import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, Plus, Sparkles, CheckCircle2, Clock, AlertCircle, ArrowRight, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";

export interface TrabajoLaboratorio {
  id: string;
  pacienteNombre: string;
  doctorTratante: string;
  laboratorioNombre: string;
  tipoTrabajo: "corona_zirconia" | "carilla_emax" | "implante_hibrida" | "removible_metal" | "alineadores_invisibles";
  piezaDental: string;
  colorGuiaVita: string;
  etapaActual: "envio_impresion" | "prueba_estructura" | "prueba_bizcocho" | "listo_cementar" | "instalado";
  fechaEnvio: string;
  fechaPrometida: string;
  costoLaboratorio: number;
  notasTecnicas: string;
}

const TRABAJOS_INICIALES: TrabajoLaboratorio[] = [
  {
    id: "lab-101",
    pacienteNombre: "Camila Henríquez",
    doctorTratante: "Dra. Carolina Abreu (Rehabilitación)",
    laboratorioNombre: "Laboratorio Dental Santo Domingo CAD/CAM",
    tipoTrabajo: "corona_zirconia",
    piezaDental: "Pieza 21 (Incisivo Central Sup)",
    colorGuiaVita: "BL2 / Bleach",
    etapaActual: "prueba_bizcocho",
    fechaEnvio: "22 Oct 2026",
    fechaPrometida: "31 Oct 2026",
    costoLaboratorio: 4500,
    notasTecnicas: "Translucidez en borde incisal con caracterización gingival.",
  },
  {
    id: "lab-102",
    pacienteNombre: "José Miguel Báez",
    doctorTratante: "Dr. Ramón Castillo (Implantología)",
    laboratorioNombre: "NovaDental Lab Pro",
    tipoTrabajo: "implante_hibrida",
    piezaDental: "Piezas 46 y 47",
    colorGuiaVita: "A2",
    etapaActual: "prueba_estructura",
    fechaEnvio: "24 Oct 2026",
    fechaPrometida: "02 Nov 2026",
    costoLaboratorio: 8200,
    notasTecnicas: "Pilar de titanio customizado con tornillo pasante.",
  },
  {
    id: "lab-103",
    pacienteNombre: "Valeria Guzmán",
    doctorTratante: "Dra. Altagracia Peña",
    laboratorioNombre: "OrthoAlign Lab",
    tipoTrabajo: "alineadores_invisibles",
    piezaDental: "Arcada Superior e Inferior",
    colorGuiaVita: "N/A",
    etapaActual: "listo_cementar",
    fechaEnvio: "18 Oct 2026",
    fechaPrometida: "29 Oct 2026",
    costoLaboratorio: 15000,
    notasTecnicas: "Set de 8 alineadores serie 1 con attachments impresos.",
  },
];

const etapaLabels: Record<TrabajoLaboratorio["etapaActual"], { label: string; color: string }> = {
  envio_impresion: { label: "1. Envío Scan / Impresión", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  prueba_estructura: { label: "2. Prueba Estructura Metal/Cofia", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  prueba_bizcocho: { label: "3. Prueba Bizcocho / Color", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  listo_cementar: { label: "4. Listo para Cementar", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40" },
  instalado: { label: "5. Instalado en Boca ✓", color: "bg-muted text-muted-foreground border-border" },
};

const tipoTrabajoLabels: Record<TrabajoLaboratorio["tipoTrabajo"], string> = {
  corona_zirconia: "Corona Monolítica Zirconia 3D",
  carilla_emax: "Carilla Disilicato de Litio (E-Max)",
  implante_hibrida: "Prótesis sobre Implante / Híbrida",
  removible_metal: "Prótesis Removible Cromo-Cobalto",
  alineadores_invisibles: "Plan de Alineadores Invisibles",
};

export default function TrazabilidadLaboratorioDental() {
  const [trabajos, setTrabajos] = useState<TrabajoLaboratorio[]>(TRABAJOS_INICIALES);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    pacienteNombre: "",
    doctorTratante: "Dr. Tratante",
    laboratorioNombre: "Laboratorio Dental Principal",
    tipoTrabajo: "corona_zirconia" as TrabajoLaboratorio["tipoTrabajo"],
    piezaDental: "Pieza 11",
    colorGuiaVita: "A2",
    fechaPrometida: "",
    costoLaboratorio: 4000,
    notasTecnicas: "",
  });

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pacienteNombre.trim()) {
      toast.error("El nombre del paciente es obligatorio");
      return;
    }
    const nuevo: TrabajoLaboratorio = {
      id: `lab-${Date.now()}`,
      pacienteNombre: form.pacienteNombre,
      doctorTratante: form.doctorTratante,
      laboratorioNombre: form.laboratorioNombre,
      tipoTrabajo: form.tipoTrabajo,
      piezaDental: form.piezaDental,
      colorGuiaVita: form.colorGuiaVita,
      etapaActual: "envio_impresion",
      fechaEnvio: new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }),
      fechaPrometida: form.fechaPrometida || "En 7 días laborales",
      costoLaboratorio: Number(form.costoLaboratorio),
      notasTecnicas: form.notasTecnicas,
    };
    setTrabajos([nuevo, ...trabajos]);
    toast.success("Orden protésica enviada a laboratorio dental");
    setOpenModal(false);
  };

  const avanzarEtapa = (id: string) => {
    const etapasOrden: TrabajoLaboratorio["etapaActual"][] = [
      "envio_impresion",
      "prueba_estructura",
      "prueba_bizcocho",
      "listo_cementar",
      "instalado",
    ];

    setTrabajos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const idx = etapasOrden.indexOf(t.etapaActual);
          if (idx < etapasOrden.length - 1) {
            const siguiente = etapasOrden[idx + 1];
            toast.success(`Trabajo avanzado a: ${etapaLabels[siguiente].label}`);
            return { ...t, etapaActual: siguiente };
          }
        }
        return t;
      })
    );
  };

  const enProcesoCount = trabajos.filter((t) => t.etapaActual !== "instalado").length;
  const listosCount = trabajos.filter((t) => t.etapaActual === "listo_cementar").length;

  return (
    <div className="space-y-6">
      {/* Encabezado y KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Trazabilidad de Laboratorios Dentales & Prótesis
            </h2>
            <p className="text-xs text-muted-foreground">
              Control de etapas protésicas: Envíos, pruebas de estructura, bizcocho, color VITA y cementación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
            {enProcesoCount} en laboratorio
          </Badge>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
            {listosCount} listos para cementar
          </Badge>
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5 shadow-none">
                <Plus className="h-4 w-4" /> Nueva Orden Protésica
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-5 w-5 text-amber-500" />
                  Orden a Laboratorio Dental
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrear} className="space-y-3 pt-2 text-xs">
                <div>
                  <Label className="text-xs">Paciente</Label>
                  <Input
                    placeholder="Ej. Camila Henríquez"
                    value={form.pacienteNombre}
                    onChange={(e) => setForm({ ...form, pacienteNombre: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Doctor / Especialista</Label>
                    <Input
                      value={form.doctorTratante}
                      onChange={(e) => setForm({ ...form, doctorTratante: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Laboratorio Dental</Label>
                    <Input
                      value={form.laboratorioNombre}
                      onChange={(e) => setForm({ ...form, laboratorioNombre: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tipo de Trabajo</Label>
                    <Select
                      value={form.tipoTrabajo}
                      onValueChange={(val: any) => setForm({ ...form, tipoTrabajo: val })}
                    >
                      <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corona_zirconia">Corona Zirconia Monolítica</SelectItem>
                        <SelectItem value="carilla_emax">Carilla E-Max (Disilicato)</SelectItem>
                        <SelectItem value="implante_hibrida">Prótesis sobre Implante</SelectItem>
                        <SelectItem value="removible_metal">Removible Cromo-Cobalto</SelectItem>
                        <SelectItem value="alineadores_invisibles">Alineadores Invisibles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Color Guía VITA</Label>
                    <Input
                      placeholder="Ej. A1, A2, A3, BL2"
                      value={form.colorGuiaVita}
                      onChange={(e) => setForm({ ...form, colorGuiaVita: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Pieza(s) Dental(es)</Label>
                    <Input
                      placeholder="Ej. 11, 21"
                      value={form.piezaDental}
                      onChange={(e) => setForm({ ...form, piezaDental: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Costo Laboratorio (DOP $)</Label>
                    <Input
                      type="number"
                      value={form.costoLaboratorio}
                      onChange={(e) => setForm({ ...form, costoLaboratorio: Number(e.target.value) })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Instrucciones Técnicas / Oclusión</Label>
                  <Input
                    placeholder="Borde incisal translúcido, ajuste pasivo..."
                    value={form.notasTecnicas}
                    onChange={(e) => setForm({ ...form, notasTecnicas: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl mt-2 bg-amber-600 hover:bg-amber-700 text-white">
                  Registrar Orden de Laboratorio
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabla de Trabajos */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs">Paciente & Especialista</TableHead>
              <TableHead className="text-xs">Tipo de Prótesis & Pieza</TableHead>
              <TableHead className="text-xs">Color VITA</TableHead>
              <TableHead className="text-xs">Laboratorio</TableHead>
              <TableHead className="text-xs">Etapa Actual</TableHead>
              <TableHead className="text-xs text-right">Costo Lab</TableHead>
              <TableHead className="text-xs text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {trabajos.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-semibold text-foreground">{t.pacienteNombre}</div>
                  <div className="text-[10px] text-muted-foreground">{t.doctorTratante}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{tipoTrabajoLabels[t.tipoTrabajo]}</div>
                  <div className="text-[10px] text-muted-foreground">{t.piezaDental}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md text-[10px] bg-secondary font-mono">
                    {t.colorGuiaVita}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px]">
                  {t.laboratorioNombre}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-md text-[10px] ${etapaLabels[t.etapaActual].color}`}>
                    {etapaLabels[t.etapaActual].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  ${t.costoLaboratorio.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {t.etapaActual !== "instalado" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-[11px] h-7 gap-1 border-border/80"
                      onClick={() => avanzarEtapa(t.id)}
                    >
                      Avanzar <ArrowRight className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="rounded-md text-[10px] text-emerald-600 border-emerald-500/30">
                      Instalado
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
