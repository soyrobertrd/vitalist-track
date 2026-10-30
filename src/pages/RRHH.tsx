import { useState, useEffect } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Building, Briefcase, FolderOpen, CalendarDays, Check, X, Users } from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";

const TIPO_PERMISO_LABELS: Record<string, string> = {
  vacaciones: "Vacaciones",
  licencia_medica: "Licencia médica",
  permiso_personal: "Permiso personal",
  maternidad: "Maternidad",
  paternidad: "Paternidad",
  duelo: "Duelo",
  sin_goce: "Sin goce de sueldo",
};

const ESTADO_COLORS: Record<string, string> = {
  solicitado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rechazado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelado: "bg-muted text-muted-foreground",
};

export default function RRHH() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [permisos, setPermisos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);

  const [openDept, setOpenDept] = useState(false);
  const [openPuesto, setOpenPuesto] = useState(false);
  const [openExpediente, setOpenExpediente] = useState(false);
  const [openPermiso, setOpenPermiso] = useState(false);

  const [deptForm, setDeptForm] = useState({ nombre: "", descripcion: "" });
  const [puestoForm, setPuestoForm] = useState({ nombre: "", departamento_id: "", nivel: "", salario_min: 0, salario_max: 0 });
  const [expForm, setExpForm] = useState({ empleado_id: "", puesto_id: "", tipo_contrato: "indefinido", fecha_inicio_contrato: "", notas: "" });
  const [permForm, setPermForm] = useState({ empleado_id: "", tipo: "vacaciones", fecha_inicio: "", fecha_fin: "", dias: 1, notas: "" });

  const fetch = async () => {
    if (!wsId) return;
    const [d, p, e, v, emp] = await Promise.all([
      db.from("departamentos_rrhh").select("*").eq("workspace_id", wsId).order("nombre"),
      db.from("puestos_rrhh").select("*").eq("workspace_id", wsId).order("nombre"),
      db.from("expedientes_empleado").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
      db.from("vacaciones_permisos").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
      db.from("empleados_nomina").select("id, nombre, apellido").eq("workspace_id", wsId).eq("activo", true).order("nombre"),
    ]);
    if (d.data) setDepartamentos(d.data);
    if (p.data) setPuestos(p.data);
    if (e.data) setExpedientes(e.data);
    if (v.data) setPermisos(v.data);
    if (emp.data) setEmpleados(emp.data);
  };

  useEffect(() => { fetch(); }, [wsId]);

  const empName = (id: string) => {
    const e = empleados.find((x: any) => x.id === id);
    return e ? `${e.nombre} ${e.apellido}` : id.slice(0, 8);
  };
  const deptName = (id: string) => departamentos.find((d: any) => d.id === id)?.nombre || "—";
  const puestoName = (id: string) => puestos.find((p: any) => p.id === id)?.nombre || "—";

  const crearDept = async () => {
    if (!wsId || !deptForm.nombre) return;
    const { error } = await db.from("departamentos_rrhh").insert({ ...deptForm, workspace_id: wsId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Departamento creado");
    setOpenDept(false);
    setDeptForm({ nombre: "", descripcion: "" });
    fetch();
  };

  const crearPuesto = async () => {
    if (!wsId || !puestoForm.nombre) return;
    const { error } = await db.from("puestos_rrhh").insert({
      ...puestoForm,
      workspace_id: wsId,
      departamento_id: puestoForm.departamento_id || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Puesto creado");
    setOpenPuesto(false);
    setPuestoForm({ nombre: "", departamento_id: "", nivel: "", salario_min: 0, salario_max: 0 });
    fetch();
  };

  const crearExpediente = async () => {
    if (!wsId || !expForm.empleado_id) return;
    const { error } = await db.from("expedientes_empleado").insert({
      ...expForm,
      workspace_id: wsId,
      puesto_id: expForm.puesto_id || null,
      fecha_inicio_contrato: expForm.fecha_inicio_contrato || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Expediente creado");
    setOpenExpediente(false);
    setExpForm({ empleado_id: "", puesto_id: "", tipo_contrato: "indefinido", fecha_inicio_contrato: "", notas: "" });
    fetch();
  };

  const crearPermiso = async () => {
    if (!wsId || !permForm.empleado_id || !permForm.fecha_inicio || !permForm.fecha_fin) return;
    const { error } = await db.from("vacaciones_permisos").insert({ ...permForm, workspace_id: wsId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitud creada");
    setOpenPermiso(false);
    setPermForm({ empleado_id: "", tipo: "vacaciones", fecha_inicio: "", fecha_fin: "", dias: 1, notas: "" });
    fetch();
  };

  const cambiarEstadoPermiso = async (id: string, estado: string) => {
    await db.from("vacaciones_permisos").update({ estado } as any).eq("id", id);
    toast.success(`Solicitud ${estado}`);
    fetch();
  };

  const solicitudesPendientes = permisos.filter((p: any) => p.estado === "solicitado").length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Talento Humano & Recursos Humanos"
        subtitle="Departamentos, puestos de trabajo, expedientes de personal y solicitudes de vacaciones o permisos"
        icon={Users}
      >
        <Button variant="outline" className="rounded-xl border-border/80 shadow-none gap-2" onClick={() => setOpenDept(true)}>
          <Plus className="h-4 w-4" /> Nuevo Depto
        </Button>
        <Button className="rounded-xl shadow-none gap-2" onClick={() => setOpenPuesto(true)}>
          <Plus className="h-4 w-4" /> Nuevo Puesto
        </Button>
      </ClinicalPageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Departamentos"
          value={departamentos.length}
          icon={Building}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Puestos laborales"
          value={puestos.length}
          icon={Briefcase}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Expedientes de personal"
          value={expedientes.length}
          icon={FolderOpen}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Solicitudes pendientes"
          value={solicitudesPendientes}
          icon={CalendarDays}
          variant="amber"
          alert={solicitudesPendientes > 0}
        />
      </div>

      <Tabs defaultValue="departamentos" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="departamentos" className="rounded-xl px-4 py-1.5 text-xs font-medium"><Building className="h-4 w-4 mr-1.5" /> Departamentos</TabsTrigger>
          <TabsTrigger value="puestos" className="rounded-xl px-4 py-1.5 text-xs font-medium"><Briefcase className="h-4 w-4 mr-1.5" /> Puestos</TabsTrigger>
          <TabsTrigger value="expedientes" className="rounded-xl px-4 py-1.5 text-xs font-medium"><FolderOpen className="h-4 w-4 mr-1.5" /> Expedientes</TabsTrigger>
          <TabsTrigger value="permisos" className="rounded-xl px-4 py-1.5 text-xs font-medium"><CalendarDays className="h-4 w-4 mr-1.5" /> Vacaciones / Permisos</TabsTrigger>
        </TabsList>

        {/* Departamentos */}
        <TabsContent value="departamentos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openDept} onOpenChange={setOpenDept}>
              <DialogTrigger asChild><Button size="sm" className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1" /> Nuevo departamento</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Nuevo departamento</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre</Label><Input value={deptForm.nombre} onChange={(e) => setDeptForm({ ...deptForm, nombre: e.target.value })} /></div>
                  <div><Label>Descripción</Label><Textarea value={deptForm.descripcion} onChange={(e) => setDeptForm({ ...deptForm, descripcion: e.target.value })} /></div>
                  <Button onClick={crearDept} className="rounded-xl">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {departamentos.map((d: any) => (
                  <TableRow key={d.id} className="hover:bg-muted/40">
                    <TableCell className="font-semibold text-foreground">{d.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{d.descripcion || "—"}</TableCell>
                    <TableCell><StatusBadge status={d.activo ? "activo" : "inactivo"} /></TableCell>
                  </TableRow>
                ))}
                {!departamentos.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sin departamentos</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Puestos */}
        <TabsContent value="puestos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPuesto} onOpenChange={setOpenPuesto}>
              <DialogTrigger asChild><Button size="sm" className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1" /> Nuevo puesto</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Nuevo puesto laboral</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre del puesto</Label><Input value={puestoForm.nombre} onChange={(e) => setPuestoForm({ ...puestoForm, nombre: e.target.value })} /></div>
                  <div>
                    <Label>Departamento</Label>
                    <Select value={puestoForm.departamento_id} onValueChange={(v) => setPuestoForm({ ...puestoForm, departamento_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{departamentos.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nivel jerárquico</Label><Input value={puestoForm.nivel} onChange={(e) => setPuestoForm({ ...puestoForm, nivel: e.target.value })} placeholder="Ej: Senior, Asistencial..." /></div>
                    <div><Label>Salario mín.</Label><Input type="number" value={puestoForm.salario_min} onChange={(e) => setPuestoForm({ ...puestoForm, salario_min: +e.target.value })} /></div>
                  </div>
                  <div><Label>Salario máx.</Label><Input type="number" value={puestoForm.salario_max} onChange={(e) => setPuestoForm({ ...puestoForm, salario_max: +e.target.value })} /></div>
                  <Button onClick={crearPuesto} className="rounded-xl">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Departamento</TableHead><TableHead>Nivel</TableHead><TableHead>Rango salarial</TableHead></TableRow></TableHeader>
              <TableBody>
                {puestos.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="font-semibold text-foreground">{p.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{deptName(p.departamento_id)}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-full text-[11px]">{p.nivel || "General"}</Badge></TableCell>
                    <TableCell className="tabular-nums font-medium">{p.salario_min && p.salario_max ? `$${p.salario_min.toLocaleString()} – $${p.salario_max.toLocaleString()}` : "—"}</TableCell>
                  </TableRow>
                ))}
                {!puestos.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin puestos configurados</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Expedientes */}
        <TabsContent value="expedientes" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openExpediente} onOpenChange={setOpenExpediente}>
              <DialogTrigger asChild><Button size="sm" className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1" /> Nuevo expediente</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Nuevo expediente de personal</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Empleado</Label>
                    <Select value={expForm.empleado_id} onValueChange={(v) => setExpForm({ ...expForm, empleado_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{empleados.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Puesto</Label>
                    <Select value={expForm.puesto_id} onValueChange={(v) => setExpForm({ ...expForm, puesto_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{puestos.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo contrato</Label>
                      <Select value={expForm.tipo_contrato} onValueChange={(v) => setExpForm({ ...expForm, tipo_contrato: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indefinido">Indefinido</SelectItem>
                          <SelectItem value="temporal">Temporal</SelectItem>
                          <SelectItem value="pasantia">Pasantía</SelectItem>
                          <SelectItem value="servicios">Servicios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Inicio contrato</Label><Input type="date" value={expForm.fecha_inicio_contrato} onChange={(e) => setExpForm({ ...expForm, fecha_inicio_contrato: e.target.value })} /></div>
                  </div>
                  <div><Label>Notas</Label><Textarea value={expForm.notas} onChange={(e) => setExpForm({ ...expForm, notas: e.target.value })} /></div>
                  <Button onClick={crearExpediente} className="rounded-xl">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead>Puesto</TableHead><TableHead>Contrato</TableHead><TableHead>Inicio</TableHead><TableHead>Evaluación</TableHead></TableRow></TableHeader>
              <TableBody>
                {expedientes.map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-muted/40">
                    <TableCell className="font-semibold text-foreground">{empName(e.empleado_id)}</TableCell>
                    <TableCell>{puestoName(e.puesto_id)}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-full text-[11px] capitalize">{e.tipo_contrato}</Badge></TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">{e.fecha_inicio_contrato || "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="rounded-full text-[11px]">{e.evaluacion_actual ? `${e.evaluacion_actual}/100` : "Pendiente"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!expedientes.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin expedientes registrados</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Vacaciones / Permisos */}
        <TabsContent value="permisos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPermiso} onOpenChange={setOpenPermiso}>
              <DialogTrigger asChild><Button size="sm" className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1" /> Nueva solicitud</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Solicitar permiso / vacaciones</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Empleado</Label>
                    <Select value={permForm.empleado_id} onValueChange={(v) => setPermForm({ ...permForm, empleado_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{empleados.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={permForm.tipo} onValueChange={(v) => setPermForm({ ...permForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPO_PERMISO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Desde</Label><Input type="date" value={permForm.fecha_inicio} onChange={(e) => setPermForm({ ...permForm, fecha_inicio: e.target.value })} /></div>
                    <div><Label>Hasta</Label><Input type="date" value={permForm.fecha_fin} onChange={(e) => setPermForm({ ...permForm, fecha_fin: e.target.value })} /></div>
                    <div><Label>Días</Label><Input type="number" value={permForm.dias} onChange={(e) => setPermForm({ ...permForm, dias: +e.target.value })} /></div>
                  </div>
                  <div><Label>Notas</Label><Textarea value={permForm.notas} onChange={(e) => setPermForm({ ...permForm, notas: e.target.value })} /></div>
                  <Button onClick={crearPermiso} className="rounded-xl">Enviar solicitud</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Empleado</TableHead><TableHead>Tipo</TableHead><TableHead>Desde</TableHead><TableHead>Hasta</TableHead><TableHead>Días</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
              <TableBody>
                {permisos.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                    <TableCell className="font-semibold text-foreground">{empName(p.empleado_id)}</TableCell>
                    <TableCell>{TIPO_PERMISO_LABELS[p.tipo] || p.tipo}</TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">{p.fecha_inicio}</TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">{p.fecha_fin}</TableCell>
                    <TableCell className="tabular-nums font-medium">{p.dias}d</TableCell>
                    <TableCell><StatusBadge status={p.estado} /></TableCell>
                    <TableCell className="text-right">
                      {p.estado === "solicitado" && (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 text-emerald-600" onClick={() => cambiarEstadoPermiso(p.id, "aprobado")} title="Aprobar"><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-rose-500/10 text-rose-600" onClick={() => cambiarEstadoPermiso(p.id, "rechazado")} title="Rechazar"><X className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!permisos.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin solicitudes de permisos</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
