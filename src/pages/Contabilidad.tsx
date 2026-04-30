import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, BookOpen, XCircle, CheckCircle, FileText } from "lucide-react";

const TIPOS_CUENTA = [
  { value: "activo", label: "Activo" },
  { value: "pasivo", label: "Pasivo" },
  { value: "capital", label: "Capital" },
  { value: "ingreso", label: "Ingreso" },
  { value: "gasto", label: "Gasto" },
  { value: "costo", label: "Costo" },
];

const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-800",
  aprobado: "bg-green-100 text-green-800",
  anulado: "bg-red-100 text-red-800",
};

const Contabilidad = () => {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("asientos");

  // Cuentas
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cuentaDialog, setCuentaDialog] = useState(false);
  const [cuentaForm, setCuentaForm] = useState({ codigo: "", nombre: "", tipo: "activo", naturaleza: "deudora", cuenta_padre_id: "", nivel: 1 });

  // Asientos
  const [asientos, setAsientos] = useState<any[]>([]);
  const [asientoDialog, setAsientoDialog] = useState(false);
  const [asientoForm, setAsientoForm] = useState({ fecha: new Date().toISOString().split("T")[0], descripcion: "", referencia: "", notas: "" });
  const [lineas, setLineas] = useState<{ cuenta_id: string; descripcion: string; debe: number; haber: number }[]>([]);
  const [searchAsiento, setSearchAsiento] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  // Detalle
  const [detalleAsiento, setDetalleAsiento] = useState<any>(null);
  const [detalleLineas, setDetalleLineas] = useState<any[]>([]);

  const fetchCuentas = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("cuentas_contables").select("*").eq("workspace_id", currentWorkspace.id).order("codigo");
    setCuentas(data || []);
  };

  const fetchAsientos = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("asientos_contables").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(200);
    setAsientos(data || []);
  };

  useEffect(() => { fetchCuentas(); fetchAsientos(); }, [currentWorkspace]);

  const handleCreateCuenta = async () => {
    if (!currentWorkspace || !cuentaForm.codigo || !cuentaForm.nombre) { toast.error("Código y nombre requeridos"); return; }
    const { error } = await supabase.from("cuentas_contables").insert({
      workspace_id: currentWorkspace.id,
      codigo: cuentaForm.codigo,
      nombre: cuentaForm.nombre,
      tipo: cuentaForm.tipo as any,
      naturaleza: cuentaForm.naturaleza as any,
      cuenta_padre_id: cuentaForm.cuenta_padre_id || null,
      nivel: cuentaForm.nivel,
    });
    if (error) toast.error(error.message);
    else { toast.success("Cuenta creada"); setCuentaDialog(false); setCuentaForm({ codigo: "", nombre: "", tipo: "activo", naturaleza: "deudora", cuenta_padre_id: "", nivel: 1 }); fetchCuentas(); }
  };

  const handleCreateAsiento = async () => {
    if (!currentWorkspace || !asientoForm.descripcion || lineas.length === 0) { toast.error("Descripción y líneas requeridas"); return; }
    const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
    const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
    if (Math.abs(totalDebe - totalHaber) > 0.01) { toast.error(`Asiento descuadrado: Debe ${totalDebe.toFixed(2)} ≠ Haber ${totalHaber.toFixed(2)}`); return; }

    const { data, error } = await supabase.from("asientos_contables").insert({
      workspace_id: currentWorkspace.id,
      fecha: asientoForm.fecha,
      descripcion: asientoForm.descripcion,
      referencia: asientoForm.referencia || null,
      notas: asientoForm.notas || null,
      total_debe: totalDebe,
      total_haber: totalHaber,
    }).select().single();
    if (error) { toast.error(error.message); return; }

    const lineasInsert = lineas.map(l => ({ asiento_id: data.id, cuenta_id: l.cuenta_id, descripcion: l.descripcion || null, debe: l.debe, haber: l.haber }));
    const { error: e2 } = await supabase.from("lineas_asiento").insert(lineasInsert);
    if (e2) toast.error(e2.message);
    else { toast.success("Asiento creado"); setAsientoDialog(false); setLineas([]); setAsientoForm({ fecha: new Date().toISOString().split("T")[0], descripcion: "", referencia: "", notas: "" }); fetchAsientos(); }
  };

  const updateEstadoAsiento = async (id: string, estado: "borrador" | "aprobado" | "anulado") => {
    const { error } = await supabase.from("asientos_contables").update({ estado }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Estado actualizado"); fetchAsientos(); if (detalleAsiento?.id === id) setDetalleAsiento({ ...detalleAsiento, estado }); }
  };

  const openDetalle = async (asiento: any) => {
    setDetalleAsiento(asiento);
    const { data } = await supabase.from("lineas_asiento").select("*, cuentas_contables(codigo, nombre)").eq("asiento_id", asiento.id);
    setDetalleLineas(data || []);
  };

  const addLinea = () => setLineas([...lineas, { cuenta_id: "", descripcion: "", debe: 0, haber: 0 }]);
  const removeLinea = (i: number) => setLineas(lineas.filter((_, idx) => idx !== i));
  const updateLinea = (i: number, field: string, val: any) => setLineas(lineas.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
  const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
  const cuadrado = Math.abs(totalDebe - totalHaber) < 0.01;

  const filteredAsientos = asientos.filter(a => {
    if (filterEstado !== "todos" && a.estado !== filterEstado) return false;
    if (searchAsiento) {
      const s = searchAsiento.toLowerCase();
      return (a.numero || "").toLowerCase().includes(s) || (a.descripcion || "").toLowerCase().includes(s);
    }
    return true;
  });

  const cuentasActivas = cuentas.filter(c => c.activa && c.acepta_movimientos);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contabilidad</h1>
        <p className="text-muted-foreground">Catálogo de cuentas y libro diario</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="asientos">Libro Diario</TabsTrigger>
          <TabsTrigger value="cuentas">Catálogo de Cuentas</TabsTrigger>
        </TabsList>

        {/* ASIENTOS */}
        <TabsContent value="asientos" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar asiento..." value={searchAsiento} onChange={e => setSearchAsiento(e.target.value)} />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={asientoDialog} onOpenChange={setAsientoDialog}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo Asiento</Button></DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nuevo Asiento Contable</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Fecha</Label><Input type="date" value={asientoForm.fecha} onChange={e => setAsientoForm(f => ({ ...f, fecha: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Descripción *</Label><Input value={asientoForm.descripcion} onChange={e => setAsientoForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Referencia</Label><Input value={asientoForm.referencia} onChange={e => setAsientoForm(f => ({ ...f, referencia: e.target.value }))} placeholder="Ej: FAC-2026-00001" /></div>
                    <div><Label>Notas</Label><Input value={asientoForm.notas} onChange={e => setAsientoForm(f => ({ ...f, notas: e.target.value }))} /></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Líneas</Label>
                      <Button size="sm" variant="outline" onClick={addLinea}><Plus className="h-3 w-3 mr-1" />Agregar</Button>
                    </div>
                    {lineas.map((l, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          {i === 0 && <Label className="text-xs">Cuenta</Label>}
                          <Select value={l.cuenta_id} onValueChange={v => updateLinea(i, "cuenta_id", v)}>
                            <SelectTrigger><SelectValue placeholder="Cuenta..." /></SelectTrigger>
                            <SelectContent>{cuentasActivas.map(c => <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nombre}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          {i === 0 && <Label className="text-xs">Descripción</Label>}
                          <Input value={l.descripcion} onChange={e => updateLinea(i, "descripcion", e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Debe</Label>}
                          <Input type="number" min={0} step={0.01} value={l.debe} onChange={e => updateLinea(i, "debe", Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Haber</Label>}
                          <Input type="number" min={0} step={0.01} value={l.haber} onChange={e => updateLinea(i, "haber", Number(e.target.value))} />
                        </div>
                        <div className="col-span-1">
                          <Button size="icon" variant="ghost" onClick={() => removeLinea(i)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                    {lineas.length > 0 && (
                      <div className="flex justify-end gap-6 text-sm font-semibold">
                        <span>Debe: ${totalDebe.toFixed(2)}</span>
                        <span>Haber: ${totalHaber.toFixed(2)}</span>
                        <Badge variant={cuadrado ? "default" : "destructive"}>{cuadrado ? "✓ Cuadrado" : "✗ Descuadrado"}</Badge>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleCreateAsiento} className="w-full" disabled={!cuadrado || lineas.length === 0}>Crear Asiento</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Debe</TableHead>
                    <TableHead>Haber</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAsientos.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay asientos</TableCell></TableRow>
                  ) : filteredAsientos.map(a => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => openDetalle(a)}>
                      <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                      <TableCell className="text-xs">{new Date(a.fecha + "T12:00:00").toLocaleDateString()}</TableCell>
                      <TableCell>{a.descripcion}</TableCell>
                      <TableCell>${Number(a.total_debe).toFixed(2)}</TableCell>
                      <TableCell>${Number(a.total_haber).toFixed(2)}</TableCell>
                      <TableCell><Badge className={ESTADO_COLOR[a.estado]}>{a.estado}</Badge></TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {a.estado === "borrador" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateEstadoAsiento(a.id, "aprobado")}><CheckCircle className="h-3 w-3 mr-1" />Aprobar</Button>
                              <Button size="sm" variant="ghost" onClick={() => updateEstadoAsiento(a.id, "anulado")}><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUENTAS */}
        <TabsContent value="cuentas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={cuentaDialog} onOpenChange={setCuentaDialog}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nueva Cuenta</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva Cuenta Contable</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Código *</Label><Input value={cuentaForm.codigo} onChange={e => setCuentaForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ej: 1.1.01" /></div>
                    <div><Label>Nombre *</Label><Input value={cuentaForm.nombre} onChange={e => setCuentaForm(f => ({ ...f, nombre: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={cuentaForm.tipo} onValueChange={v => setCuentaForm(f => ({ ...f, tipo: v, naturaleza: ["activo", "gasto", "costo"].includes(v) ? "deudora" : "acreedora" }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIPOS_CUENTA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Naturaleza</Label>
                      <Select value={cuentaForm.naturaleza} onValueChange={v => setCuentaForm(f => ({ ...f, naturaleza: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deudora">Deudora</SelectItem>
                          <SelectItem value="acreedora">Acreedora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cuenta Padre</Label>
                      <Select value={cuentaForm.cuenta_padre_id} onValueChange={v => setCuentaForm(f => ({ ...f, cuenta_padre_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ninguna</SelectItem>
                          {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Nivel</Label><Input type="number" min={1} max={6} value={cuentaForm.nivel} onChange={e => setCuentaForm(f => ({ ...f, nivel: Number(e.target.value) }))} /></div>
                  </div>
                  <Button onClick={handleCreateCuenta} className="w-full">Guardar Cuenta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Naturaleza</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay cuentas</TableCell></TableRow>
                  ) : cuentas.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.codigo}</TableCell>
                      <TableCell style={{ paddingLeft: `${(c.nivel - 1) * 20 + 16}px` }} className="font-medium">{c.nombre}</TableCell>
                      <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                      <TableCell className="text-xs">{c.naturaleza}</TableCell>
                      <TableCell>{c.nivel}</TableCell>
                      <TableCell><Badge variant={c.activa ? "default" : "secondary"}>{c.activa ? "Activa" : "Inactiva"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalle Asiento */}
      <Dialog open={!!detalleAsiento} onOpenChange={v => !v && setDetalleAsiento(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Asiento {detalleAsiento?.numero}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <Badge className={ESTADO_COLOR[detalleAsiento?.estado]}>{detalleAsiento?.estado}</Badge>
              <span className="text-sm text-muted-foreground">{detalleAsiento?.fecha && new Date(detalleAsiento.fecha + "T12:00:00").toLocaleDateString()}</span>
            </div>
            <p className="font-medium">{detalleAsiento?.descripcion}</p>
            {detalleAsiento?.referencia && <p className="text-sm text-muted-foreground">Ref: {detalleAsiento.referencia}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalleLineas.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.cuentas_contables?.codigo} — {l.cuentas_contables?.nombre}</TableCell>
                    <TableCell className="text-sm">{l.descripcion || "—"}</TableCell>
                    <TableCell className="text-right">{Number(l.debe) > 0 ? `$${Number(l.debe).toFixed(2)}` : ""}</TableCell>
                    <TableCell className="text-right">{Number(l.haber) > 0 ? `$${Number(l.haber).toFixed(2)}` : ""}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={2} className="text-right">Totales</TableCell>
                  <TableCell className="text-right">${Number(detalleAsiento?.total_debe || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(detalleAsiento?.total_haber || 0).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {detalleAsiento?.estado === "borrador" && (
              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={() => updateEstadoAsiento(detalleAsiento.id, "aprobado")}><CheckCircle className="h-3 w-3 mr-1" />Aprobar</Button>
                <Button size="sm" variant="destructive" onClick={() => updateEstadoAsiento(detalleAsiento.id, "anulado")}><XCircle className="h-3 w-3 mr-1" />Anular</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contabilidad;
