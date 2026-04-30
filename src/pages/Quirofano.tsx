import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Scissors, Calendar as CalendarIcon, Clock, Users, CheckSquare, DollarSign, AlertTriangle } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { ProfesionalCombobox } from "@/components/ProfesionalCombobox";

const CHECKLIST_PREOP = [
  "Identificación del paciente verificada",
  "Consentimiento informado firmado",
  "Sitio quirúrgico marcado",
  "Ayuno verificado (8h mínimo)",
  "Alergias documentadas",
  "Exámenes prequirúrgicos revisados",
  "Hemograma y coagulación OK",
  "Vía aérea evaluada",
  "Profilaxis antibiótica administrada",
  "Acceso venoso establecido",
];

const CHECKLIST_INTRAOP = [
  "Timeout realizado (pausa quirúrgica)",
  "Equipo completo presente",
  "Instrumental contado antes de incisión",
  "Profilaxis tromboembólica",
  "Monitorización completa activa",
  "Instrumental contado antes de cierre",
  "Muestras etiquetadas correctamente",
  "Recuento de gasas completo",
];

export default function Quirofano() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [cirugias, setCirugias] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salaDialogOpen, setSalaDialogOpen] = useState(false);
  const [detailCirugia, setDetailCirugia] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    paciente_id: "", profesional_id: "", sala_id: "", tipo_cirugia: "",
    diagnostico_preop: "", fecha_programada: format(new Date(), "yyyy-MM-dd"),
    hora_inicio: "08:00", duracion_estimada_min: 60,
    prioridad: "electiva" as string, anestesiologo: "", tipo_anestesia: "",
    instrumentista: "", costo_estimado: 0, notas_operatorias: "",
  });
  const [salaForm, setSalaForm] = useState({ nombre: "", capacidad: 1, notas: "" });

  useEffect(() => { if (currentWorkspace?.id) fetchData(); }, [currentWorkspace?.id, activeSucursalId]);

  const fetchData = async () => {
    setLoading(true);
    const wsId = currentWorkspace!.id;
    const [cRes, sRes] = await Promise.all([
      (() => {
        let q = supabase.from("cirugias").select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido), salas_operacion(nombre)")
          .eq("workspace_id", wsId).order("fecha_programada", { ascending: false });
        if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
        return q;
      })(),
      supabase.from("salas_operacion").select("*").eq("workspace_id", wsId).eq("activa", true),
    ]);
    setCirugias(cRes.data || []);
    setSalas(sRes.data || []);
    setLoading(false);
  };

  const crearCirugia = async () => {
    if (!form.paciente_id || !form.tipo_cirugia || !form.fecha_programada) {
      toast.error("Paciente, tipo y fecha son requeridos");
      return;
    }
    const { error } = await supabase.from("cirugias").insert({
      workspace_id: currentWorkspace!.id,
      sucursal_id: activeSucursalId || null,
      ...form,
      costo_estimado: form.costo_estimado || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Cirugía programada");
    setDialogOpen(false);
    setForm({ paciente_id: "", profesional_id: "", sala_id: "", tipo_cirugia: "", diagnostico_preop: "", fecha_programada: format(new Date(), "yyyy-MM-dd"), hora_inicio: "08:00", duracion_estimada_min: 60, prioridad: "electiva", anestesiologo: "", tipo_anestesia: "", instrumentista: "", costo_estimado: 0, notas_operatorias: "" });
    fetchData();
  };

  const crearSala = async () => {
    if (!salaForm.nombre) { toast.error("Nombre requerido"); return; }
    const { error } = await supabase.from("salas_operacion").insert({
      workspace_id: currentWorkspace!.id,
      sucursal_id: activeSucursalId || null,
      ...salaForm,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Sala creada");
    setSalaDialogOpen(false);
    setSalaForm({ nombre: "", capacidad: 1, notas: "" });
    fetchData();
  };

  const actualizarEstado = async (id: string, estado: string) => {
    const updates: any = { estado };
    if (estado === "en_curso") updates.hora_inicio = format(new Date(), "HH:mm");
    if (estado === "completada") updates.hora_fin = format(new Date(), "HH:mm");
    const { error } = await supabase.from("cirugias").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Estado: ${estado}`);
    fetchData();
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      programada: "bg-primary/20 text-primary",
      en_curso: "bg-warning/20 text-warning",
      completada: "bg-success/20 text-success",
      cancelada: "bg-destructive/20 text-destructive",
      suspendida: "bg-muted text-muted-foreground",
    };
    return map[estado] || "";
  };

  const prioridadBadge = (p: string) => {
    if (p === "emergencia") return "bg-destructive text-destructive-foreground";
    if (p === "urgente") return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  const hoy = format(new Date(), "yyyy-MM-dd");
  const cirugiasHoy = cirugias.filter(c => c.fecha_programada === hoy);
  const cirugiasProximas = cirugias.filter(c => c.fecha_programada > hoy && c.estado === "programada");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Scissors className="h-8 w-8" /> Quirófano</h1>
          <p className="text-muted-foreground">Agenda quirúrgica, salas y checklists de seguridad</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={salaDialogOpen} onOpenChange={setSalaDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Sala</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva sala de operación</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre</Label><Input value={salaForm.nombre} onChange={e => setSalaForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Sala A" /></div>
                <div><Label>Capacidad</Label><Input type="number" value={salaForm.capacidad} onChange={e => setSalaForm(p => ({ ...p, capacidad: parseInt(e.target.value) || 1 }))} /></div>
                <div><Label>Notas</Label><Textarea value={salaForm.notas} onChange={e => setSalaForm(p => ({ ...p, notas: e.target.value }))} /></div>
                <Button onClick={crearSala} className="w-full">Crear sala</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Programar cirugía</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Programar cirugía</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Paciente *</Label>
                  <PacienteCombobox value={form.paciente_id} onSelect={v => setForm(p => ({ ...p, paciente_id: v }))} />
                </div>
                <div>
                  <Label>Cirujano principal</Label>
                  <ProfesionalCombobox value={form.profesional_id} onSelect={v => setForm(p => ({ ...p, profesional_id: v }))} />
                </div>
                <div>
                  <Label>Sala</Label>
                  <Select value={form.sala_id} onValueChange={v => setForm(p => ({ ...p, sala_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar sala" /></SelectTrigger>
                    <SelectContent>
                      {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de cirugía *</Label>
                  <Input value={form.tipo_cirugia} onChange={e => setForm(p => ({ ...p, tipo_cirugia: e.target.value }))} placeholder="Apendicectomía" />
                </div>
                <div>
                  <Label>Diagnóstico preoperatorio</Label>
                  <Input value={form.diagnostico_preop} onChange={e => setForm(p => ({ ...p, diagnostico_preop: e.target.value }))} />
                </div>
                <div>
                  <Label>Fecha *</Label>
                  <Input type="date" value={form.fecha_programada} onChange={e => setForm(p => ({ ...p, fecha_programada: e.target.value }))} />
                </div>
                <div>
                  <Label>Hora inicio</Label>
                  <Input type="time" value={form.hora_inicio} onChange={e => setForm(p => ({ ...p, hora_inicio: e.target.value }))} />
                </div>
                <div>
                  <Label>Duración estimada (min)</Label>
                  <Input type="number" value={form.duracion_estimada_min} onChange={e => setForm(p => ({ ...p, duracion_estimada_min: parseInt(e.target.value) || 60 }))} />
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select value={form.prioridad} onValueChange={v => setForm(p => ({ ...p, prioridad: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electiva">Electiva</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Anestesiólogo</Label>
                  <Input value={form.anestesiologo} onChange={e => setForm(p => ({ ...p, anestesiologo: e.target.value }))} />
                </div>
                <div>
                  <Label>Tipo anestesia</Label>
                  <Select value={form.tipo_anestesia} onValueChange={v => setForm(p => ({ ...p, tipo_anestesia: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="sedacion">Sedación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Costo estimado ($)</Label>
                  <Input type="number" value={form.costo_estimado} onChange={e => setForm(p => ({ ...p, costo_estimado: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Notas operatorias</Label>
                  <Textarea value={form.notas_operatorias} onChange={e => setForm(p => ({ ...p, notas_operatorias: e.target.value }))} />
                </div>
              </div>
              <Button onClick={crearCirugia} className="w-full mt-4">Programar cirugía</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Cirugías hoy</p><p className="text-2xl font-bold">{cirugiasHoy.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Próximas programadas</p><p className="text-2xl font-bold">{cirugiasProximas.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Salas activas</p><p className="text-2xl font-bold">{salas.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">En curso ahora</p><p className="text-2xl font-bold text-warning">{cirugias.filter(c => c.estado === "en_curso").length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="agenda">
        <TabsList>
          <TabsTrigger value="agenda">Agenda quirúrgica</TabsTrigger>
          <TabsTrigger value="salas">Salas</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Cirugía</TableHead>
                      <TableHead>Cirujano</TableHead>
                      <TableHead>Sala</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cirugias.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(c.fecha_programada + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{c.hora_inicio || "-"}</TableCell>
                        <TableCell>{c.pacientes ? `${c.pacientes.nombre} ${c.pacientes.apellido}` : "-"}</TableCell>
                        <TableCell className="font-medium">{c.tipo_cirugia}</TableCell>
                        <TableCell>{c.personal_salud ? `${c.personal_salud.nombre} ${c.personal_salud.apellido}` : "-"}</TableCell>
                        <TableCell>{c.salas_operacion?.nombre || "-"}</TableCell>
                        <TableCell><Badge className={prioridadBadge(c.prioridad)}>{c.prioridad}</Badge></TableCell>
                        <TableCell><Badge className={estadoBadge(c.estado)}>{c.estado}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {c.estado === "programada" && (
                              <Button size="sm" variant="outline" onClick={() => actualizarEstado(c.id, "en_curso")}>Iniciar</Button>
                            )}
                            {c.estado === "en_curso" && (
                              <Button size="sm" variant="outline" onClick={() => actualizarEstado(c.id, "completada")}>Completar</Button>
                            )}
                            {c.estado === "programada" && (
                              <Button size="sm" variant="ghost" onClick={() => actualizarEstado(c.id, "cancelada")}>Cancelar</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {cirugias.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No hay cirugías registradas</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salas">
          <div className="grid gap-4 md:grid-cols-3">
            {salas.map(s => {
              const enUso = cirugias.find(c => c.sala_id === s.id && c.estado === "en_curso");
              return (
                <Card key={s.id} className={enUso ? "border-warning" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {s.nombre}
                      <Badge className={enUso ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}>
                        {enUso ? "En uso" : "Disponible"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Capacidad: {s.capacidad}</p>
                    {enUso && (
                      <p className="text-sm mt-2 font-medium">{enUso.tipo_cirugia} — {enUso.pacientes?.nombre} {enUso.pacientes?.apellido}</p>
                    )}
                    {s.notas && <p className="text-xs text-muted-foreground mt-1">{s.notas}</p>}
                  </CardContent>
                </Card>
              );
            })}
            {salas.length === 0 && (
              <Card className="md:col-span-3"><CardContent className="pt-6 text-center text-muted-foreground">No hay salas registradas. Crea una para empezar.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checklists">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" /> Checklist Preoperatorio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CHECKLIST_PREOP.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Checkbox id={`preop-${i}`} />
                      <label htmlFor={`preop-${i}`} className="text-sm cursor-pointer">{item}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" /> Checklist Intraoperatorio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CHECKLIST_INTRAOP.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Checkbox id={`intraop-${i}`} />
                      <label htmlFor={`intraop-${i}`} className="text-sm cursor-pointer">{item}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
