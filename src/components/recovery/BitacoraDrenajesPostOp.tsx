import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Droplet, AlertTriangle, ShieldAlert, Plus, CheckCircle2, Camera, Clock, Activity, FileText } from "lucide-react";
import { toast } from "sonner";

export interface RegistroDrenaje {
  id: string;
  pacienteNombre: string;
  tipoCirugia: string;
  drenajeTipo: "Jackson-Pratt" | "Hemovac" | "Blake" | "Penrose";
  ubicacion: string;
  volumenMl: number;
  aspecto: "serohematico" | "hematico_fresco" | "seroso" | "turbio_purulento";
  horaToma: string;
  responsableEnfermeria: string;
  estadoFaja: "correcta_3_tablas" | "ajustada" | "suelta_requiere_cambio";
  alertaCirujano: boolean;
  notas?: string;
}

const REGISTROS_INICIALES: RegistroDrenaje[] = [
  {
    id: "dr-1",
    pacienteNombre: "Yomaira Santos (Día 2 Post-Op)",
    tipoCirugia: "Lipoescultura HD 360 + Abdominoplastia",
    drenajeTipo: "Jackson-Pratt",
    ubicacion: "Fosa Ilíaca Derecha (Abdomen)",
    volumenMl: 65,
    aspecto: "serohematico",
    horaToma: "07:30 AM",
    responsableEnfermeria: "Lic. Carmen Ventura (Enfermera)",
    estadoFaja: "correcta_3_tablas",
    alertaCirujano: false,
    notas: "Vacío al 100% restablecido con éxito. Sin coágulos obstructivos.",
  },
  {
    id: "dr-2",
    pacienteNombre: "Jessica Miller (Día 1 Post-Op)",
    tipoCirugia: "BBL + Reducción Mamaria",
    drenajeTipo: "Jackson-Pratt",
    ubicacion: "Zona Sacra / Glútea",
    volumenMl: 125,
    aspecto: "hematico_fresco",
    horaToma: "08:15 AM",
    responsableEnfermeria: "Lic. Carmen Ventura",
    estadoFaja: "ajustada",
    alertaCirujano: true,
    notas: "Gasto elevado >100ml con sangre roja fresca. Se notificó vía WhatsApp al cirujano Dr. Méndez.",
  },
  {
    id: "dr-3",
    pacienteNombre: "Giselle De León (Día 5 Post-Op)",
    tipoCirugia: "Abdominoplastia con plicatura",
    drenajeTipo: "Hemovac",
    ubicacion: "Suprapúbica",
    volumenMl: 25,
    aspecto: "seroso",
    horaToma: "08:45 AM",
    responsableEnfermeria: "Lic. Pamela Reyes",
    estadoFaja: "correcta_3_tablas",
    alertaCirujano: false,
    notas: "Drenaje decreciente. Apta para evaluación de retiro en consulta de mañana.",
  },
];

const aspectoColorMap: Record<string, string> = {
  serohematico: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  hematico_fresco: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-semibold",
  seroso: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  turbio_purulento: "bg-purple-500/15 text-purple-600 border-purple-500/40 font-bold",
};

export default function BitacoraDrenajesPostOp() {
  const [registros, setRegistros] = useState<RegistroDrenaje[]>(REGISTROS_INICIALES);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    pacienteNombre: "",
    tipoCirugia: "Lipoescultura + BBL",
    drenajeTipo: "Jackson-Pratt" as RegistroDrenaje["drenajeTipo"],
    ubicacion: "Abdomen Inferior",
    volumenMl: 40,
    aspecto: "serohematico" as RegistroDrenaje["aspecto"],
    responsableEnfermeria: "Enfermera de Guardia",
    estadoFaja: "correcta_3_tablas" as RegistroDrenaje["estadoFaja"],
    notas: "",
  });

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pacienteNombre.trim()) {
      toast.error("El nombre de la paciente es obligatorio");
      return;
    }

    const esAlerta = form.volumenMl >= 100 || form.aspecto === "hematico_fresco" || form.aspecto === "turbio_purulento";

    const nuevo: RegistroDrenaje = {
      id: `dr-${Date.now()}`,
      pacienteNombre: form.pacienteNombre,
      tipoCirugia: form.tipoCirugia,
      drenajeTipo: form.drenajeTipo,
      ubicacion: form.ubicacion,
      volumenMl: Number(form.volumenMl),
      aspecto: form.aspecto,
      horaToma: new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),
      responsableEnfermeria: form.responsableEnfermeria,
      estadoFaja: form.estadoFaja,
      alertaCirujano: esAlerta,
      notas: form.notas,
    };

    setRegistros([nuevo, ...registros]);
    if (esAlerta) {
      toast.warning("Registro guardado con ALERTA CLÍNICA: volumen o aspecto crítico");
    } else {
      toast.success("Gasto de drenaje registrado correctamente");
    }
    setOpenModal(false);
    setForm({
      pacienteNombre: "",
      tipoCirugia: "Lipoescultura + BBL",
      drenajeTipo: "Jackson-Pratt",
      ubicacion: "Abdomen Inferior",
      volumenMl: 40,
      aspecto: "serohematico",
      responsableEnfermeria: "Enfermera de Guardia",
      estadoFaja: "correcta_3_tablas",
      notas: "",
    });
  };

  const totalVolumenTurno = registros.reduce((acc, r) => acc + r.volumenMl, 0);
  const alertasActivas = registros.filter((r) => r.alertaCirujano).length;

  return (
    <div className="space-y-6">
      {/* Header y KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-none col-span-1 md:col-span-2">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Droplet className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Bitácora de Drenajes Postquirúrgicos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Monitoreo de Jackson-Pratt, Hemovac y curaciones en tiempo real
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Válido para rondas de enfermera a domicilio o en suite de Recovery Home.
            </p>
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-1.5 shadow-none">
                  <Plus className="h-4 w-4" /> Registrar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Droplet className="h-5 w-5 text-rose-500" />
                    Nuevo Registro de Drenaje & Herida
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGuardar} className="space-y-3.5 pt-2 text-xs">
                  <div>
                    <Label className="text-xs">Paciente & Día Post-Op</Label>
                    <Input
                      placeholder="Ej. Yomaira Santos (Día 2 Post-Op)"
                      value={form.pacienteNombre}
                      onChange={(e) => setForm({ ...form, pacienteNombre: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Procedimiento Realizado</Label>
                      <Input
                        value={form.tipoCirugia}
                        onChange={(e) => setForm({ ...form, tipoCirugia: e.target.value })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de Drenaje</Label>
                      <Select
                        value={form.drenajeTipo}
                        onValueChange={(val: any) => setForm({ ...form, drenajeTipo: val })}
                      >
                        <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Jackson-Pratt">Jackson-Pratt (Pera de succión)</SelectItem>
                          <SelectItem value="Hemovac">Hemovac (Acordeón rígido)</SelectItem>
                          <SelectItem value="Blake">Blake acanalado</SelectItem>
                          <SelectItem value="Penrose">Penrose por capilaridad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Ubicación Anatómica</Label>
                      <Input
                        placeholder="Ej. Flanco izq, Abdomen, Glúteo"
                        value={form.ubicacion}
                        onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Gasto Medido (Mililitros - ml)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="800"
                        value={form.volumenMl}
                        onChange={(e) => setForm({ ...form, volumenMl: Number(e.target.value) })}
                        className="rounded-xl mt-1 h-8 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Aspecto del Contenido</Label>
                      <Select
                        value={form.aspecto}
                        onValueChange={(val: any) => setForm({ ...form, aspecto: val })}
                      >
                        <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="serohematico">Serohemático (Rosado/Ámbar - Normal)</SelectItem>
                          <SelectItem value="hematico_fresco">Hemático Fresco (Rojo vivo - Alerta)</SelectItem>
                          <SelectItem value="seroso">Seroso (Amarillento claro)</SelectItem>
                          <SelectItem value="turbio_purulento">Turbio / Purulento (Alerta Infección)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Estado de Faja & Tablas</Label>
                      <Select
                        value={form.estadoFaja}
                        onValueChange={(val: any) => setForm({ ...form, estadoFaja: val })}
                      >
                        <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="correcta_3_tablas">Correcta con 3 tablas / foami</SelectItem>
                          <SelectItem value="ajustada">Ajustada adecuadamente</SelectItem>
                          <SelectItem value="suelta_requiere_cambio">Floja (requiere ajuste/etapa 2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Observaciones de Curación / Notas Clínicas</Label>
                    <Input
                      placeholder="Vacío restablecido, apósitos limpios y secos..."
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl mt-2 bg-rose-600 hover:bg-rose-700 text-white">
                    Guardar y Verificar Seguridad
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{totalVolumenTurno} ml</p>
              <p className="text-xs text-muted-foreground mt-1">Gasto total acumulado</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${alertasActivas > 0 ? "bg-rose-500/20 text-rose-600 animate-pulse" : "bg-emerald-500/10 text-emerald-600"}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none text-rose-600 dark:text-rose-400">
                {alertasActivas}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Alertas críticas cirujano</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Registros */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <div className="p-4 border-b border-border/70 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Historial de Rondas y Vaciados de Drenaje
          </h3>
          <span className="text-xs text-muted-foreground">{registros.length} registros en curso</span>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs">Paciente / Cirugía</TableHead>
              <TableHead className="text-xs">Drenaje & Ubicación</TableHead>
              <TableHead className="text-xs">Gasto (ml)</TableHead>
              <TableHead className="text-xs">Aspecto Líquido</TableHead>
              <TableHead className="text-xs">Faja / Curación</TableHead>
              <TableHead className="text-xs">Hora & Responsable</TableHead>
              <TableHead className="text-xs">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {registros.map((r) => (
              <TableRow key={r.id} className={r.alertaCirujano ? "bg-rose-500/5 hover:bg-rose-500/10" : ""}>
                <TableCell className="font-medium">
                  <div className="font-semibold text-foreground">{r.pacienteNombre}</div>
                  <div className="text-[11px] text-muted-foreground">{r.tipoCirugia}</div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{r.drenajeTipo}</span>
                  <div className="text-[10px] text-muted-foreground">{r.ubicacion}</div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-sm tabular-nums">{r.volumenMl} ml</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`rounded-md text-[10px] capitalize ${aspectoColorMap[r.aspecto]}`}>
                    {r.aspecto.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] capitalize text-muted-foreground">
                    {r.estadoFaja.replace(/_/g, " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{r.horaToma}</div>
                  <div className="text-[10px] text-muted-foreground">{r.responsableEnfermeria}</div>
                </TableCell>
                <TableCell>
                  {r.alertaCirujano ? (
                    <Badge variant="destructive" className="rounded-md text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> Notificado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-md text-[10px] text-emerald-600 border-emerald-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Estable
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
