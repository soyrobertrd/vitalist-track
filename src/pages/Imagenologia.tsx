import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePacientes } from "@/hooks/usePacientes";
import { usePersonal } from "@/hooks/usePersonal";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { ProfesionalCombobox } from "@/components/ProfesionalCombobox";
import { Plus, Search, Image, FileText, CheckCircle, Clock, XCircle, Activity } from "lucide-react";

const MODALIDADES = [
  { value: "rx", label: "Rayos X" },
  { value: "ct", label: "Tomografía (CT)" },
  { value: "mri", label: "Resonancia (MRI)" },
  { value: "us", label: "Ultrasonido" },
  { value: "mamografia", label: "Mamografía" },
  { value: "pet", label: "PET/CT" },
  { value: "otro", label: "Otro" },
];

const ESTADOS_COLOR: Record<string, string> = {
  solicitado: "bg-yellow-100 text-yellow-800",
  programado: "bg-blue-100 text-blue-800",
  en_proceso: "bg-orange-100 text-orange-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const Imagenologia = () => {
  const { currentWorkspace } = useWorkspace();
  const { pacientes: listaPacientes } = usePacientes();
  const { personal: listaPersonal } = usePersonal();
  const [estudios, setEstudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterModalidad, setFilterModalidad] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [informeDialog, setInformeDialog] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    paciente_id: "",
    medico_solicitante_id: "",
    modalidad: "rx",
    tipo_estudio: "",
    region_anatomica: "",
    prioridad: "rutina",
    indicacion_clinica: "",
    diagnostico_presuntivo: "",
    contraste: false,
    sala: "",
    fecha_programada: "",
    notas: "",
  });

  // Informe form
  const [informe, setInforme] = useState({ hallazgos: "", conclusion: "", impresion_diagnostica: "" });

  const fetchEstudios = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("estudios_imagen")
      .select("*, pacientes(nombre, apellido), medico:medico_solicitante_id(nombre, apellido), radiologo:radiologo_id(nombre, apellido)")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setEstudios(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEstudios(); }, [currentWorkspace]);

  const handleCreate = async () => {
    if (!currentWorkspace || !form.paciente_id || !form.tipo_estudio) {
      toast.error("Paciente y tipo de estudio son requeridos");
      return;
    }
    const { error } = await supabase.from("estudios_imagen").insert({
      workspace_id: currentWorkspace.id,
      paciente_id: form.paciente_id,
      medico_solicitante_id: form.medico_solicitante_id || null,
      modalidad: form.modalidad,
      tipo_estudio: form.tipo_estudio,
      region_anatomica: form.region_anatomica || null,
      prioridad: form.prioridad as any,
      indicacion_clinica: form.indicacion_clinica || null,
      diagnostico_presuntivo: form.diagnostico_presuntivo || null,
      contraste: form.contraste,
      sala: form.sala || null,
      fecha_programada: form.fecha_programada || null,
      notas: form.notas || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Estudio solicitado");
      setDialogOpen(false);
      setForm({ paciente_id: "", medico_solicitante_id: "", modalidad: "rx", tipo_estudio: "", region_anatomica: "", prioridad: "rutina", indicacion_clinica: "", diagnostico_presuntivo: "", contraste: false, sala: "", fecha_programada: "", notas: "" });
      fetchEstudios();
    }
  };

  const updateEstado = async (id: string, estado: string) => {
    const updates: any = { estado };
    if (estado === "en_proceso") updates.fecha_realizacion = new Date().toISOString();
    const { error } = await supabase.from("estudios_imagen").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Estado actualizado"); fetchEstudios(); }
  };

  const saveInforme = async () => {
    if (!informeDialog) return;
    const { error } = await supabase.from("estudios_imagen").update({
      hallazgos: informe.hallazgos,
      conclusion: informe.conclusion,
      impresion_diagnostica: informe.impresion_diagnostica,
      estado: "completado",
      fecha_informe: new Date().toISOString(),
    }).eq("id", informeDialog.id);
    if (error) toast.error(error.message);
    else { toast.success("Informe guardado"); setInformeDialog(null); fetchEstudios(); }
  };

  const filtered = estudios.filter(e => {
    if (filterEstado !== "todos" && e.estado !== filterEstado) return false;
    if (filterModalidad !== "todos" && e.modalidad !== filterModalidad) return false;
    if (search) {
      const s = search.toLowerCase();
      const nombre = `${e.pacientes?.nombre || ""} ${e.pacientes?.apellido || ""}`.toLowerCase();
      return nombre.includes(s) || (e.numero_orden || "").toLowerCase().includes(s) || (e.tipo_estudio || "").toLowerCase().includes(s);
    }
    return true;
  });

  const stats = {
    total: estudios.length,
    solicitados: estudios.filter(e => e.estado === "solicitado").length,
    en_proceso: estudios.filter(e => e.estado === "en_proceso").length,
    completados: estudios.filter(e => e.estado === "completado").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imagenología</h1>
          <p className="text-muted-foreground">Gestión de estudios de imagen diagnóstica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Solicitar Estudio</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nueva Solicitud de Imagen</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Paciente *</Label>
                <PacienteCombobox value={form.paciente_id} onValueChange={v => setForm(f => ({ ...f, paciente_id: v }))} />
              </div>
              <div>
                <Label>Médico Solicitante</Label>
                <ProfesionalCombobox value={form.medico_solicitante_id} onValueChange={v => setForm(f => ({ ...f, medico_solicitante_id: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modalidad</Label>
                  <Select value={form.modalidad} onValueChange={v => setForm(f => ({ ...f, modalidad: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MODALIDADES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select value={form.prioridad} onValueChange={v => setForm(f => ({ ...f, prioridad: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rutina">Rutina</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="stat">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tipo de Estudio *</Label>
                <Input value={form.tipo_estudio} onChange={e => setForm(f => ({ ...f, tipo_estudio: e.target.value }))} placeholder="Ej: Rx Tórax PA/Lat" />
              </div>
              <div>
                <Label>Región Anatómica</Label>
                <Input value={form.region_anatomica} onChange={e => setForm(f => ({ ...f, region_anatomica: e.target.value }))} placeholder="Ej: Tórax, Abdomen, Cráneo" />
              </div>
              <div>
                <Label>Indicación Clínica</Label>
                <Textarea value={form.indicacion_clinica} onChange={e => setForm(f => ({ ...f, indicacion_clinica: e.target.value }))} />
              </div>
              <div>
                <Label>Diagnóstico Presuntivo</Label>
                <Input value={form.diagnostico_presuntivo} onChange={e => setForm(f => ({ ...f, diagnostico_presuntivo: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sala</Label>
                  <Input value={form.sala} onChange={e => setForm(f => ({ ...f, sala: e.target.value }))} />
                </div>
                <div>
                  <Label>Fecha Programada</Label>
                  <Input type="datetime-local" value={form.fecha_programada} onChange={e => setForm(f => ({ ...f, fecha_programada: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.contraste} onChange={e => setForm(f => ({ ...f, contraste: e.target.checked }))} id="contraste" />
                <Label htmlFor="contraste">Requiere contraste</Label>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} className="w-full">Solicitar Estudio</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Image className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Estudios</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{stats.solicitados}</p><p className="text-xs text-muted-foreground">Solicitados</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Activity className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{stats.en_proceso}</p><p className="text-xs text-muted-foreground">En Proceso</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{stats.completados}</p><p className="text-xs text-muted-foreground">Completados</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por paciente, orden o estudio..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="solicitado">Solicitado</SelectItem>
            <SelectItem value="programado">Programado</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterModalidad} onValueChange={setFilterModalidad}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Modalidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {MODALIDADES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Estudio</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hay estudios</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.numero_orden}</TableCell>
                  <TableCell>{e.pacientes?.nombre} {e.pacientes?.apellido}</TableCell>
                  <TableCell><Badge variant="outline">{MODALIDADES.find(m => m.value === e.modalidad)?.label || e.modalidad}</Badge></TableCell>
                  <TableCell>{e.tipo_estudio}</TableCell>
                  <TableCell>
                    <Badge variant={e.prioridad === "stat" ? "destructive" : e.prioridad === "urgente" ? "secondary" : "outline"}>
                      {e.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge className={ESTADOS_COLOR[e.estado] || ""}>{e.estado}</Badge></TableCell>
                  <TableCell className="text-xs">{e.fecha_programada ? new Date(e.fecha_programada).toLocaleDateString() : new Date(e.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {e.estado === "solicitado" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateEstado(e.id, "en_proceso")}>Iniciar</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateEstado(e.id, "cancelado")}><XCircle className="h-4 w-4" /></Button>
                        </>
                      )}
                      {e.estado === "en_proceso" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setInformeDialog(e);
                          setInforme({ hallazgos: e.hallazgos || "", conclusion: e.conclusion || "", impresion_diagnostica: e.impresion_diagnostica || "" });
                        }}>
                          <FileText className="h-4 w-4 mr-1" />Informar
                        </Button>
                      )}
                      {e.estado === "completado" && e.conclusion && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          setInformeDialog(e);
                          setInforme({ hallazgos: e.hallazgos || "", conclusion: e.conclusion || "", impresion_diagnostica: e.impresion_diagnostica || "" });
                        }}>
                          <FileText className="h-4 w-4 mr-1" />Ver Informe
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Informe Dialog */}
      <Dialog open={!!informeDialog} onOpenChange={v => !v && setInformeDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Informe Radiológico — {informeDialog?.numero_orden}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hallazgos</Label>
              <Textarea rows={4} value={informe.hallazgos} onChange={e => setInforme(f => ({ ...f, hallazgos: e.target.value }))} disabled={informeDialog?.estado === "completado"} />
            </div>
            <div>
              <Label>Conclusión</Label>
              <Textarea rows={3} value={informe.conclusion} onChange={e => setInforme(f => ({ ...f, conclusion: e.target.value }))} disabled={informeDialog?.estado === "completado"} />
            </div>
            <div>
              <Label>Impresión Diagnóstica</Label>
              <Textarea rows={2} value={informe.impresion_diagnostica} onChange={e => setInforme(f => ({ ...f, impresion_diagnostica: e.target.value }))} disabled={informeDialog?.estado === "completado"} />
            </div>
            {informeDialog?.estado !== "completado" && (
              <Button onClick={saveInforme} className="w-full">Guardar Informe y Completar</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Imagenologia;
