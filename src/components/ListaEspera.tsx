import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Clock, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";

const PRIORIDAD_COLORS: Record<string, string> = {
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  urgente: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const ESTADO_COLORS: Record<string, string> = {
  esperando: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  asignada: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelada: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300",
  expirada: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface ItemEspera {
  id: string;
  paciente_id: string;
  profesional_id: string | null;
  especialidad: string | null;
  motivo: string | null;
  prioridad: string;
  estado: string;
  fecha_solicitud: string;
  fecha_asignada: string | null;
  notas: string | null;
  pacientes?: { nombre: string; apellido: string } | null;
  personal_salud?: { nombre: string; apellido: string } | null;
}

export function ListaEspera() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [items, setItems] = useState<ItemEspera[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ItemEspera>>({});
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("esperando");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("lista_espera")
      .select("*, pacientes:paciente_id(nombre, apellido), personal_salud:profesional_id(nombre, apellido)")
      .order("prioridad", { ascending: true })
      .order("fecha_solicitud", { ascending: true });

    if (currentWorkspace) q = q.eq("workspace_id", currentWorkspace.id);
    if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
    if (filtroEstado !== "todos") q = q.eq("estado", filtroEstado as any);

    const { data } = await q;
    setItems((data || []) as unknown as ItemEspera[]);
    setLoading(false);
  }, [currentWorkspace, activeSucursalId, filtroEstado]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    const load = async () => {
      const [p, pr] = await Promise.all([
        supabase.from("pacientes").select("id, nombre, apellido").order("nombre").limit(500),
        supabase.from("personal_salud").select("id, nombre, apellido").order("nombre"),
      ]);
      if (p.data) setPacientes(p.data);
      if (pr.data) setProfesionales(pr.data);
    };
    load();
  }, []);

  const save = async () => {
    if (!editing.paciente_id) { toast.error("Seleccione un paciente"); return; }
    const payload = {
      paciente_id: editing.paciente_id,
      profesional_id: editing.profesional_id || null,
      especialidad: editing.especialidad || null,
      motivo: editing.motivo || null,
      prioridad: (editing.prioridad || "normal") as any,
      estado: (editing.estado || "esperando") as any,
      notas: editing.notas || null,
      workspace_id: currentWorkspace?.id || null,
      sucursal_id: activeSucursalId || null,
    };

    const { error } = editing.id
      ? await supabase.from("lista_espera").update(payload).eq("id", editing.id)
      : await supabase.from("lista_espera").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Guardado");
    setDialogOpen(false);
    fetchItems();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const update: any = { estado };
    if (estado === "asignada") update.fecha_asignada = new Date().toISOString();
    await supabase.from("lista_espera").update(update).eq("id", id);
    toast.success("Estado actualizado");
    fetchItems();
  };

  const countEsperando = items.filter(i => i.estado === "esperando").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lista de Espera
            {countEsperando > 0 && (
              <Badge variant="destructive">{countEsperando}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="esperando">Esperando</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { setEditing({ prioridad: "normal" }); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay pacientes en lista de espera</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Solicitado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.pacientes ? `${(item.pacientes as any).nombre} ${(item.pacientes as any).apellido}` : "—"}
                  </TableCell>
                  <TableCell>{item.especialidad || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORIDAD_COLORS[item.prioridad] || ""}>
                      {item.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ESTADO_COLORS[item.estado] || ""}>
                      {item.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(item.fecha_solicitud).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.estado === "esperando" && (
                        <>
                          <Button size="icon" variant="ghost" title="Asignar" onClick={() => cambiarEstado(item.id, "asignada")}>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Cancelar" onClick={() => cambiarEstado(item.id, "cancelada")}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Agregar a Lista de Espera</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paciente *</Label>
              <Select value={editing.paciente_id || ""} onValueChange={v => setEditing(p => ({ ...p, paciente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Especialidad</Label>
                <Input value={editing.especialidad || ""} onChange={e => setEditing(p => ({ ...p, especialidad: e.target.value }))} placeholder="Ej: Cardiología" />
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={editing.prioridad || "normal"} onValueChange={v => setEditing(p => ({ ...p, prioridad: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Profesional preferido</Label>
              <Select value={editing.profesional_id || ""} onValueChange={v => setEditing(p => ({ ...p, profesional_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Opcional..." /></SelectTrigger>
                <SelectContent>
                  {profesionales.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea value={editing.motivo || ""} onChange={e => setEditing(p => ({ ...p, motivo: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
