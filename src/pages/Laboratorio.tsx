import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, FlaskConical, ClipboardList, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";

const estadoBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pendiente: { variant: "outline", label: "Pendiente" },
  en_proceso: { variant: "secondary", label: "En Proceso" },
  parcial: { variant: "default", label: "Parcial" },
  completada: { variant: "default", label: "Completada" },
  cancelada: { variant: "destructive", label: "Cancelada" },
};

const prioridadBadge: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
  rutina: { variant: "secondary", label: "Rutina" },
  urgente: { variant: "default", label: "Urgente" },
  stat: { variant: "destructive", label: "STAT" },
};

export default function Laboratorio() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // Form state
  const [newOrder, setNewOrder] = useState({
    paciente_id: "",
    medico_solicitante_id: "",
    prioridad: "rutina",
    diagnostico_presuntivo: "",
    indicaciones: "",
    notas: "",
  });
  const [newTests, setNewTests] = useState<{ nombre_prueba: string; categoria: string; rango_referencia_texto: string }[]>([
    { nombre_prueba: "", categoria: "", rango_referencia_texto: "" },
  ]);

  // Queries
  const { data: ordenes = [], isLoading } = useQuery({
    queryKey: ["ordenes_laboratorio", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("ordenes_laboratorio")
        .select("*, pacientes(nombre, apellido, cedula), personal_salud!ordenes_laboratorio_medico_solicitante_id_fkey(nombre, apellido)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_lab", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido, cedula")
        .eq("workspace_id", workspaceId)
        .eq("anonimizado", false)
        .order("nombre")
        .limit(500);
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: medicos = [] } = useQuery({
    queryKey: ["medicos_lab", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await supabase
        .from("personal_salud")
        .select("id, nombre, apellido")
        .eq("workspace_id", workspaceId)
        .order("nombre")
        .limit(200);
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: pruebas = [] } = useQuery({
    queryKey: ["pruebas_laboratorio", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from("pruebas_laboratorio")
        .select("*")
        .eq("orden_id", selectedOrder.id)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const { data: paneles = [] } = useQuery({
    queryKey: ["paneles_laboratorio", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await supabase
        .from("paneles_laboratorio")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Mutations
  const createOrder = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !newOrder.paciente_id) throw new Error("Datos incompletos");
      const { data: orden, error } = await supabase
        .from("ordenes_laboratorio")
        .insert({
          workspace_id: workspaceId,
          paciente_id: newOrder.paciente_id,
          medico_solicitante_id: newOrder.medico_solicitante_id || null,
          prioridad: newOrder.prioridad as any,
          diagnostico_presuntivo: newOrder.diagnostico_presuntivo || null,
          indicaciones: newOrder.indicaciones || null,
          notas: newOrder.notas || null,
        })
        .select()
        .single();
      if (error) throw error;

      const validTests = newTests.filter((t) => t.nombre_prueba.trim());
      if (validTests.length > 0) {
        const { error: testErr } = await supabase.from("pruebas_laboratorio").insert(
          validTests.map((t) => ({
            orden_id: orden.id,
            nombre_prueba: t.nombre_prueba,
            categoria: t.categoria || null,
            rango_referencia_texto: t.rango_referencia_texto || null,
          }))
        );
        if (testErr) throw testErr;
      }
      return orden;
    },
    onSuccess: () => {
      toast.success("Orden de laboratorio creada");
      queryClient.invalidateQueries({ queryKey: ["ordenes_laboratorio"] });
      setShowNewOrder(false);
      setNewOrder({ paciente_id: "", medico_solicitante_id: "", prioridad: "rutina", diagnostico_presuntivo: "", indicaciones: "", notas: "" });
      setNewTests([{ nombre_prueba: "", categoria: "", rango_referencia_texto: "" }]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const updates: any = { estado };
      if (estado === "en_proceso") updates.fecha_recepcion_muestra = new Date().toISOString();
      if (estado === "completada") updates.fecha_resultado = new Date().toISOString();
      const { error } = await supabase.from("ordenes_laboratorio").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["ordenes_laboratorio"] });
    },
  });

  const saveTestResult = useMutation({
    mutationFn: async ({ id, resultado, anormal, critico }: { id: string; resultado: string; anormal: boolean; critico: boolean }) => {
      const { error } = await supabase
        .from("pruebas_laboratorio")
        .update({ resultado, anormal, critico, estado: "completada" as any, fecha_resultado: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resultado guardado");
      queryClient.invalidateQueries({ queryKey: ["pruebas_laboratorio"] });
    },
  });

  const addPanelTests = (panel: any) => {
    const included = panel.pruebas_incluidas as any[] || [];
    const tests = included.map((p: any) => ({
      nombre_prueba: typeof p === "string" ? p : p.nombre || "",
      categoria: typeof p === "string" ? "" : p.categoria || "",
      rango_referencia_texto: typeof p === "string" ? "" : p.rango || "",
    }));
    setNewTests((prev) => [...prev.filter((t) => t.nombre_prueba), ...tests]);
  };

  const filtered = ordenes.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const pac = o.pacientes;
    return (
      o.numero_orden?.toLowerCase().includes(s) ||
      pac?.nombre?.toLowerCase().includes(s) ||
      pac?.apellido?.toLowerCase().includes(s) ||
      pac?.cedula?.toLowerCase().includes(s)
    );
  });

  // Stats
  const pendientes = ordenes.filter((o: any) => o.estado === "pendiente").length;
  const enProceso = ordenes.filter((o: any) => o.estado === "en_proceso").length;
  const completadas = ordenes.filter((o: any) => o.estado === "completada").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-primary" /> Laboratorio
          </h1>
          <p className="text-muted-foreground text-sm">Gestión de órdenes y resultados de laboratorio</p>
        </div>
        <Button onClick={() => setShowNewOrder(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Orden
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <div className="text-2xl font-bold">{pendientes}</div>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FlaskConical className="h-5 w-5 mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold">{enProceso}</div>
          <p className="text-xs text-muted-foreground">En Proceso</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
          <div className="text-2xl font-bold">{completadas}</div>
          <p className="text-xs text-muted-foreground">Completadas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <div className="text-2xl font-bold">{ordenes.length}</div>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="ordenes">
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="paneles">Paneles / Perfiles</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por orden, paciente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay órdenes</TableCell></TableRow>
                  ) : (
                    filtered.map((o: any) => {
                      const est = estadoBadge[o.estado] || estadoBadge.pendiente;
                      const pri = prioridadBadge[o.prioridad] || prioridadBadge.rutina;
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-sm">{o.numero_orden}</TableCell>
                          <TableCell>{o.pacientes?.nombre} {o.pacientes?.apellido}</TableCell>
                          <TableCell>{o.personal_salud?.nombre} {o.personal_salud?.apellido || ""}</TableCell>
                          <TableCell><Badge variant={pri.variant}>{pri.label}</Badge></TableCell>
                          <TableCell><Badge variant={est.variant}>{est.label}</Badge></TableCell>
                          <TableCell className="text-sm">{new Date(o.fecha_solicitud).toLocaleDateString()}</TableCell>
                          <TableCell className="space-x-1">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(o); setShowResults(true); }}>
                              <ClipboardList className="h-3 w-3 mr-1" /> Resultados
                            </Button>
                            {o.estado === "pendiente" && (
                              <Button size="sm" variant="secondary" onClick={() => updateOrderStatus.mutate({ id: o.id, estado: "en_proceso" })}>
                                Recibir Muestra
                              </Button>
                            )}
                            {o.estado === "en_proceso" && (
                              <Button size="sm" onClick={() => updateOrderStatus.mutate({ id: o.id, estado: "completada" })}>
                                Completar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paneles">
          <PanelesTab workspaceId={workspaceId} paneles={paneles} queryClient={queryClient} />
        </TabsContent>
      </Tabs>

      {/* New Order Dialog */}
      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Orden de Laboratorio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paciente *</Label>
                <Select value={newOrder.paciente_id} onValueChange={(v) => setNewOrder((p) => ({ ...p, paciente_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido} {p.cedula ? `(${p.cedula})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Médico Solicitante</Label>
                <Select value={newOrder.medico_solicitante_id} onValueChange={(v) => setNewOrder((p) => ({ ...p, medico_solicitante_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar médico" /></SelectTrigger>
                  <SelectContent>
                    {medicos.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre} {m.apellido}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridad</Label>
                <Select value={newOrder.prioridad} onValueChange={(v) => setNewOrder((p) => ({ ...p, prioridad: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rutina">Rutina</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Diagnóstico Presuntivo</Label>
                <Input value={newOrder.diagnostico_presuntivo} onChange={(e) => setNewOrder((p) => ({ ...p, diagnostico_presuntivo: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Indicaciones</Label>
              <Textarea value={newOrder.indicaciones} onChange={(e) => setNewOrder((p) => ({ ...p, indicaciones: e.target.value }))} rows={2} />
            </div>

            {/* Panel quick-add */}
            {paneles.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Agregar desde panel</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {paneles.map((panel: any) => (
                    <Button key={panel.id} size="sm" variant="outline" onClick={() => addPanelTests(panel)}>
                      + {panel.nombre}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Tests */}
            <div>
              <Label>Pruebas Solicitadas</Label>
              {newTests.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="Nombre prueba" value={t.nombre_prueba} onChange={(e) => {
                    const copy = [...newTests];
                    copy[i].nombre_prueba = e.target.value;
                    setNewTests(copy);
                  }} />
                  <Input placeholder="Categoría" value={t.categoria} onChange={(e) => {
                    const copy = [...newTests];
                    copy[i].categoria = e.target.value;
                    setNewTests(copy);
                  }} />
                  <Input placeholder="Rango ref." value={t.rango_referencia_texto} onChange={(e) => {
                    const copy = [...newTests];
                    copy[i].rango_referencia_texto = e.target.value;
                    setNewTests(copy);
                  }} />
                </div>
              ))}
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setNewTests((p) => [...p, { nombre_prueba: "", categoria: "", rango_referencia_texto: "" }])}>
                + Agregar prueba
              </Button>
            </div>

            <Button className="w-full" onClick={() => createOrder.mutate()} disabled={createOrder.isPending || !newOrder.paciente_id}>
              {createOrder.isPending ? "Creando..." : "Crear Orden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={(v) => { setShowResults(v); if (!v) setSelectedOrder(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Resultados — {selectedOrder?.numero_orden}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Paciente: <strong>{selectedOrder.pacientes?.nombre} {selectedOrder.pacientes?.apellido}</strong>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prueba</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Ref.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pruebas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No hay pruebas registradas</TableCell></TableRow>
                  ) : (
                    pruebas.map((p: any) => (
                      <ResultRow key={p.id} prueba={p} onSave={saveTestResult.mutate} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultRow({ prueba, onSave }: { prueba: any; onSave: (d: any) => void }) {
  const [resultado, setResultado] = useState(prueba.resultado || "");
  const [anormal, setAnormal] = useState(prueba.anormal || false);
  const [critico, setCritico] = useState(prueba.critico || false);
  const saved = prueba.estado === "completada";

  return (
    <TableRow className={critico ? "bg-destructive/10" : anormal ? "bg-yellow-500/10" : ""}>
      <TableCell className="font-medium">{prueba.nombre_prueba}</TableCell>
      <TableCell className="text-sm">{prueba.categoria || "—"}</TableCell>
      <TableCell>
        <Input value={resultado} onChange={(e) => setResultado(e.target.value)} className="h-8 w-32" disabled={saved} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{prueba.rango_referencia_texto || "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {saved ? (
            <Badge variant="default">Completada</Badge>
          ) : (
            <>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={anormal} onChange={(e) => setAnormal(e.target.checked)} /> Anormal
              </label>
              <label className="flex items-center gap-1 text-xs text-destructive">
                <input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} /> Crítico
              </label>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        {!saved && resultado && (
          <Button size="sm" onClick={() => onSave({ id: prueba.id, resultado, anormal, critico })}>
            Guardar
          </Button>
        )}
        {critico && <AlertTriangle className="h-4 w-4 text-destructive inline ml-1" />}
      </TableCell>
    </TableRow>
  );
}

function PanelesTab({ workspaceId, paneles, queryClient }: { workspaceId: string | null; paneles: any[]; queryClient: any }) {
  const [showNew, setShowNew] = useState(false);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pruebasTexto, setPruebasTexto] = useState("");

  const createPanel = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !nombre) throw new Error("Nombre requerido");
      const pruebas = pruebasTexto.split("\n").filter(Boolean).map((l) => {
        const parts = l.split("|").map((s) => s.trim());
        return { nombre: parts[0], categoria: parts[1] || "", rango: parts[2] || "" };
      });
      const { error } = await supabase.from("paneles_laboratorio").insert({
        workspace_id: workspaceId,
        nombre,
        codigo: codigo || null,
        descripcion: descripcion || null,
        pruebas_incluidas: pruebas,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Panel creado");
      queryClient.invalidateQueries({ queryKey: ["paneles_laboratorio"] });
      setShowNew(false);
      setNombre(""); setCodigo(""); setDescripcion(""); setPruebasTexto("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Paneles predefinidos para agilizar la creación de órdenes</p>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Panel</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paneles.map((p: any) => {
          const tests = (p.pruebas_incluidas as any[]) || [];
          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.nombre}</CardTitle>
                {p.codigo && <span className="text-xs text-muted-foreground font-mono">{p.codigo}</span>}
              </CardHeader>
              <CardContent>
                {p.descripcion && <p className="text-sm text-muted-foreground mb-2">{p.descripcion}</p>}
                <div className="flex flex-wrap gap-1">
                  {tests.slice(0, 8).map((t: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {typeof t === "string" ? t : t.nombre}
                    </Badge>
                  ))}
                  {tests.length > 8 && <Badge variant="secondary" className="text-xs">+{tests.length - 8}</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {paneles.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No hay paneles creados</p>}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Panel de Laboratorio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
            <div><Label>Código</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: CBC, BMP" /></div>
            <div><Label>Descripción</Label><Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} /></div>
            <div>
              <Label>Pruebas (una por línea, formato: nombre | categoría | rango ref.)</Label>
              <Textarea value={pruebasTexto} onChange={(e) => setPruebasTexto(e.target.value)} rows={5} placeholder={"Hemoglobina | Hematología | 12-16 g/dL\nGlucosa | Química | 70-100 mg/dL"} />
            </div>
            <Button className="w-full" onClick={() => createPanel.mutate()} disabled={createPanel.isPending || !nombre}>
              {createPanel.isPending ? "Creando..." : "Crear Panel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
