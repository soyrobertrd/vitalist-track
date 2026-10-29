import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, Droplets, Plus } from "lucide-react";
import { toast } from "sonner";

export interface ReaccionAdversaTransfusional {
  id: string;
  fecha: string;
  paciente: string;
  cama: string;
  unidadLote: string;
  componente: string;
  tipoReaccion: "febril_no_hemolitica" | "alergica_urticaria" | "trali" | "taco" | "hemolitica_aguda" | "septica";
  severidad: "leve" | "moderada" | "severa" | "letal";
  sintomas: string;
  accionesTomadas: string;
  estadoInvestigacion: "en_estudio" | "confirmada" | "descartada";
}

const MOCK_REACCIONES: ReaccionAdversaTransfusional[] = [
  {
    id: "rat-101",
    fecha: "2024-10-28 14:30",
    paciente: "Manuel Santana (58a)",
    cama: "UCI-03",
    unidadLote: "CGR-2024-8841",
    componente: "Concentrado de Glóbulos Rojos",
    tipoReaccion: "febril_no_hemolitica",
    severidad: "moderada",
    sintomas: "Fiebre súbita de 38.8°C + escalofríos a los 25 minutos del inicio de la infusión.",
    accionesTomadas: "Detención inmediata de infusión, cambio de tubuladura, administración de antipirético y envío de bolsa a banco de sangre.",
    estadoInvestigacion: "confirmada",
  },
  {
    id: "rat-102",
    fecha: "2024-10-27 19:15",
    paciente: "Ana Luisa Mejía (34a)",
    cama: "Hab-308",
    unidadLote: "PFC-2024-3112",
    componente: "Plasma Fresco Congelado",
    tipoReaccion: "alergica_urticaria",
    severidad: "leve",
    sintomas: "Prurito intenso y placas eritematosas en tronco.",
    accionesTomadas: "Detención temporal, antihistamínico IV (Difenhidramina 50mg), remisión de síntomas.",
    estadoInvestigacion: "en_estudio",
  },
];

export function HemovigilanciaReaccionesTab() {
  const [reacciones, setReacciones] = useState<ReaccionAdversaTransfusional[]>(MOCK_REACCIONES);
  const [openNuevo, setOpenNuevo] = useState(false);
  const [form, setForm] = useState<Partial<ReaccionAdversaTransfusional>>({
    tipoReaccion: "febril_no_hemolitica",
    severidad: "moderada",
    estadoInvestigacion: "en_estudio",
  });

  const handleGuardar = () => {
    if (!form.paciente || !form.unidadLote) {
      toast.error("Debe ingresar el paciente y el número de lote de la unidad transfundida.");
      return;
    }

    const nueva: ReaccionAdversaTransfusional = {
      id: "rat-" + Date.now(),
      fecha: new Date().toLocaleString(),
      paciente: form.paciente,
      cama: form.cama || "Hospitalización",
      unidadLote: form.unidadLote,
      componente: form.componente || "Concentrado de Glóbulos Rojos",
      tipoReaccion: (form.tipoReaccion as any) || "febril_no_hemolitica",
      severidad: (form.severidad as any) || "moderada",
      sintomas: form.sintomas || "Reacción adversa durante la infusión.",
      accionesTomadas: form.accionesTomadas || "Infusión detenida inmediatamente.",
      estadoInvestigacion: "en_estudio",
    };

    setReacciones([nueva, ...reacciones]);
    toast.success("Incidente de Hemovigilancia registrado y notificado al comité.");
    setOpenNuevo(false);
  };

  return (
    <div className="space-y-6">
      {/* Protocolo de Emergencia en Caso de RAT */}
      <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-300 dark:border-red-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 animate-pulse" />
          <div>
            <span className="font-bold text-red-900 dark:text-red-200 block text-sm">
              Protocolo Inmediato de Sospecha de Reacción Transfusional:
            </span>
            <p className="text-red-800/90 dark:text-red-300">
              1. <strong>DETENER la transfusión</strong> de inmediato · 2. Mantener vía permeable con SSN al 0.9% · 3. Remitir bolsa restante y muestras de sangre para Coombs directo.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setOpenNuevo(true)}
          className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5 flex-shrink-0 self-end md:self-auto"
        >
          <Plus className="h-4 w-4" /> Notificar Reacción (RAT)
        </Button>
      </div>

      {/* Formulario de Notificación si está abierto */}
      {openNuevo && (
        <Card className="rounded-2xl border-red-200 dark:border-red-900 p-4 space-y-3 bg-card shadow-xs text-xs">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-4 w-4 text-red-600" /> Formulario de Hemovigilancia
          </CardTitle>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px]">Paciente</Label>
              <Input
                placeholder="Nombre completo"
                value={form.paciente || ""}
                onChange={e => setForm({ ...form, paciente: e.target.value })}
                className="h-8 text-xs rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px]">Cama / Servicio</Label>
              <Input
                placeholder="Cama 304"
                value={form.cama || ""}
                onChange={e => setForm({ ...form, cama: e.target.value })}
                className="h-8 text-xs rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px]">Lote / Número de Unidad</Label>
              <Input
                placeholder="CGR-2024-XXXX"
                value={form.unidadLote || ""}
                onChange={e => setForm({ ...form, unidadLote: e.target.value })}
                className="h-8 text-xs font-mono rounded-xl mt-1"
              />
            </div>

            <div>
              <Label className="text-[11px]">Tipo de Reacción</Label>
              <Select
                value={form.tipoReaccion}
                onValueChange={(v: any) => setForm({ ...form, tipoReaccion: v })}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="febril_no_hemolitica">Febril No Hemolítica</SelectItem>
                  <SelectItem value="alergica_urticaria">Alérgica / Urticariforme</SelectItem>
                  <SelectItem value="trali">TRALI (Lesión Pulmonar Aguda)</SelectItem>
                  <SelectItem value="taco">TACO (Sobrecarga Circulatoria)</SelectItem>
                  <SelectItem value="hemolitica_aguda">Hemolítica Aguda (Incompatibilidad ABO)</SelectItem>
                  <SelectItem value="septica">Contaminación Bacteriana / Séptica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px]">Severidad</Label>
              <Select
                value={form.severidad}
                onValueChange={(v: any) => setForm({ ...form, severidad: v })}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl mt-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="leve">Leve (Prurito, febrícula)</SelectItem>
                  <SelectItem value="moderada">Moderada (Fiebre {">"}38.5, disnea leve)</SelectItem>
                  <SelectItem value="severa">Severa (Shock, hipotensión, cianosis)</SelectItem>
                  <SelectItem value="letal">Amenaza Vital Inmediata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px]">Componente</Label>
              <Input
                placeholder="CGR / Plasma / Plaquetas"
                value={form.componente || ""}
                onChange={e => setForm({ ...form, componente: e.target.value })}
                className="h-8 text-xs rounded-xl mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Signos y Síntomas Presentados</Label>
              <Textarea
                rows={2}
                placeholder="Fiebre, dolor lumbar, escalofríos, broncoespasmo..."
                value={form.sintomas || ""}
                onChange={e => setForm({ ...form, sintomas: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
            <div>
              <Label className="text-[11px]">Acciones Médicas Tomadas</Label>
              <Textarea
                rows={2}
                placeholder="Suspensión de infusión, medicamentos administrados, muestras enviadas..."
                value={form.accionesTomadas || ""}
                onChange={e => setForm({ ...form, accionesTomadas: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setOpenNuevo(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleGuardar} className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white">
              Guardar Reporte RAT
            </Button>
          </div>
        </Card>
      )}

      {/* Tabla de Eventos de Hemovigilancia */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Droplets className="h-4 w-4 text-red-600" />
            Trazabilidad de Reacciones Transfusionales Notificadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente & Cama</TableHead>
                <TableHead>Lote / Componente</TableHead>
                <TableHead>Tipo Reacción</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Investigación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {reacciones.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-muted-foreground whitespace-nowrap">{r.fecha}</TableCell>
                  <TableCell>
                    <strong className="text-foreground">{r.paciente}</strong>
                    <span className="block text-[11px] text-muted-foreground font-mono">{r.cama}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-red-600">{r.unidadLote}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.componente}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {r.tipoReaccion.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        r.severidad === "severa" || r.severidad === "letal"
                          ? "bg-red-600 text-white text-[10px]"
                          : "bg-amber-600 text-white text-[10px]"
                      }
                    >
                      {r.severidad.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {r.estadoInvestigacion.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
