import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Monitor, Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";

const ESTADO_COLORS: Record<string, string> = {
  esperando: "bg-yellow-500",
  llamado: "bg-blue-500",
  atendiendo: "bg-green-500",
  completado: "bg-muted",
  no_presentado: "bg-destructive",
};

const Turnos = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("cola");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ servicio: "general", prioridad: "normal" as string });

  const { data: turnos } = useQuery({
    queryKey: ["turnos", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase
        .from("turnos_cola")
        .select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)")
        .eq("workspace_id", currentWorkspace.id)
        .gte("hora_llegada", new Date().toISOString().split("T")[0])
        .order("hora_llegada", { ascending: true });
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const createTurno = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error("Sin workspace");
      const { error } = await supabase.from("turnos_cola").insert({
        workspace_id: currentWorkspace.id,
        servicio: form.servicio,
        prioridad: form.prioridad as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnos"] });
      setShowNew(false);
      toast.success("Turno creado");
    },
    onError: () => toast.error("Error al crear turno"),
  });

  const updateEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const updates: any = { estado };
      if (estado === "llamado") updates.hora_llamado = new Date().toISOString();
      if (estado === "atendiendo") updates.hora_atencion = new Date().toISOString();
      if (estado === "completado" || estado === "no_presentado") updates.hora_fin = new Date().toISOString();
      const { error } = await supabase.from("turnos_cola").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnos"] });
      toast.success("Estado actualizado");
    },
  });

  const esperando = (turnos || []).filter(t => t.estado === "esperando").length;
  const atendiendo = (turnos || []).filter(t => t.estado === "atendiendo").length;
  const completados = (turnos || []).filter(t => t.estado === "completado").length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Turnos</h1>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Turno</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="h-6 w-6 mx-auto text-yellow-500" /><p className="text-2xl font-bold">{esperando}</p><p className="text-xs text-muted-foreground">En espera</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="h-6 w-6 mx-auto text-blue-500" /><p className="text-2xl font-bold">{atendiendo}</p><p className="text-xs text-muted-foreground">Atendiendo</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="h-6 w-6 mx-auto text-green-500" /><p className="text-2xl font-bold">{completados}</p><p className="text-xs text-muted-foreground">Completados</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Monitor className="h-6 w-6 mx-auto text-primary" /><p className="text-2xl font-bold">{(turnos || []).length}</p><p className="text-xs text-muted-foreground">Total hoy</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cola">Cola Actual</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="cola">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turno</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(turnos || []).filter(t => !["completado", "no_presentado"].includes(t.estado)).map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-bold">{t.numero}</TableCell>
                      <TableCell>{t.servicio}</TableCell>
                      <TableCell>
                        <Badge variant={t.prioridad === "emergencia" ? "destructive" : t.prioridad === "prioritario" ? "default" : "outline"}>
                          {t.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge className={ESTADO_COLORS[t.estado]}>{t.estado}</Badge></TableCell>
                      <TableCell>{new Date(t.hora_llegada).toLocaleTimeString()}</TableCell>
                      <TableCell className="space-x-1">
                        {t.estado === "esperando" && <Button size="sm" variant="outline" onClick={() => updateEstado.mutate({ id: t.id, estado: "llamado" })}>Llamar</Button>}
                        {t.estado === "llamado" && <Button size="sm" variant="outline" onClick={() => updateEstado.mutate({ id: t.id, estado: "atendiendo" })}>Atender</Button>}
                        {t.estado === "atendiendo" && <Button size="sm" variant="outline" onClick={() => updateEstado.mutate({ id: t.id, estado: "completado" })}>Completar</Button>}
                        {["esperando", "llamado"].includes(t.estado) && <Button size="sm" variant="ghost" onClick={() => updateEstado.mutate({ id: t.id, estado: "no_presentado" })}>No se presentó</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="historial">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turno</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Llegada</TableHead>
                    <TableHead>Fin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(turnos || []).filter(t => ["completado", "no_presentado"].includes(t.estado)).map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono">{t.numero}</TableCell>
                      <TableCell>{t.servicio}</TableCell>
                      <TableCell><Badge variant={t.estado === "completado" ? "default" : "destructive"}>{t.estado}</Badge></TableCell>
                      <TableCell>{new Date(t.hora_llegada).toLocaleTimeString()}</TableCell>
                      <TableCell>{t.hora_fin ? new Date(t.hora_fin).toLocaleTimeString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Turno</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Servicio</Label><Input value={form.servicio} onChange={e => setForm(f => ({ ...f, servicio: e.target.value }))} /></div>
            <div>
              <Label>Prioridad</Label>
              <Select value={form.prioridad} onValueChange={v => setForm(f => ({ ...f, prioridad: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="prioritario">Prioritario</SelectItem>
                  <SelectItem value="emergencia">Emergencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => createTurno.mutate()} disabled={createTurno.isPending}>Crear Turno</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Turnos;
