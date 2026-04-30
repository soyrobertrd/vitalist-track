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
import { Plus, Search, Truck, Package, ShoppingCart, CheckCircle, XCircle, Building2 } from "lucide-react";

const ESTADOS_COLOR: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-800",
  enviada: "bg-blue-100 text-blue-800",
  parcial: "bg-yellow-100 text-yellow-800",
  recibida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};

const Compras = () => {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("ordenes");

  // --- Proveedores ---
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [provDialog, setProvDialog] = useState(false);
  const [provForm, setProvForm] = useState({ nombre: "", rnc: "", contacto_nombre: "", email: "", telefono: "", direccion: "", notas: "" });

  const fetchProveedores = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("proveedores").select("*").eq("workspace_id", currentWorkspace.id).order("nombre");
    setProveedores(data || []);
  };

  const handleCreateProveedor = async () => {
    if (!currentWorkspace || !provForm.nombre) { toast.error("Nombre requerido"); return; }
    const { error } = await supabase.from("proveedores").insert({ workspace_id: currentWorkspace.id, ...provForm });
    if (error) toast.error(error.message);
    else { toast.success("Proveedor creado"); setProvDialog(false); setProvForm({ nombre: "", rnc: "", contacto_nombre: "", email: "", telefono: "", direccion: "", notas: "" }); fetchProveedores(); }
  };

  // --- Órdenes de Compra ---
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [ordenDialog, setOrdenDialog] = useState(false);
  const [ordenForm, setOrdenForm] = useState({ proveedor_id: "", prioridad: "normal", fecha_estimada_entrega: "", notas: "" });
  const [items, setItems] = useState<{ descripcion: string; cantidad_solicitada: number; precio_unitario: number; unidad: string }[]>([]);
  const [searchOC, setSearchOC] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  // Detail dialog
  const [detalleOrden, setDetalleOrden] = useState<any>(null);
  const [detalleItems, setDetalleItems] = useState<any[]>([]);

  const fetchOrdenes = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("ordenes_compra").select("*, proveedores(nombre)").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(200);
    setOrdenes(data || []);
  };

  const handleCreateOrden = async () => {
    if (!currentWorkspace || items.length === 0) { toast.error("Agregue al menos un ítem"); return; }
    const total = items.reduce((s, i) => s + i.cantidad_solicitada * i.precio_unitario, 0);
    const { data, error } = await supabase.from("ordenes_compra").insert({
      workspace_id: currentWorkspace.id,
      proveedor_id: ordenForm.proveedor_id || null,
      prioridad: ordenForm.prioridad,
      fecha_estimada_entrega: ordenForm.fecha_estimada_entrega || null,
      notas: ordenForm.notas || null,
      total_estimado: total,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    // Insert items
    const itemsInsert = items.map(i => ({ orden_id: data.id, descripcion: i.descripcion, cantidad_solicitada: i.cantidad_solicitada, precio_unitario: i.precio_unitario, unidad: i.unidad }));
    const { error: e2 } = await supabase.from("items_orden_compra").insert(itemsInsert);
    if (e2) toast.error(e2.message);
    else { toast.success("Orden de compra creada"); setOrdenDialog(false); setItems([]); setOrdenForm({ proveedor_id: "", prioridad: "normal", fecha_estimada_entrega: "", notas: "" }); fetchOrdenes(); }
  };

  const updateEstadoOrden = async (id: string, estado: string) => {
    const updates: any = { estado };
    if (estado === "recibida") updates.fecha_recepcion = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("ordenes_compra").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Estado actualizado"); fetchOrdenes(); }
  };

  const openDetalle = async (orden: any) => {
    setDetalleOrden(orden);
    const { data } = await supabase.from("items_orden_compra").select("*").eq("orden_id", orden.id);
    setDetalleItems(data || []);
  };

  useEffect(() => { fetchProveedores(); fetchOrdenes(); }, [currentWorkspace]);

  const addItem = () => setItems([...items, { descripcion: "", cantidad_solicitada: 1, precio_unitario: 0, unidad: "unidad" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) => setItems(items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const filteredOrdenes = ordenes.filter(o => {
    if (filterEstado !== "todos" && o.estado !== filterEstado) return false;
    if (searchOC) {
      const s = searchOC.toLowerCase();
      return (o.numero_orden || "").toLowerCase().includes(s) || (o.proveedores?.nombre || "").toLowerCase().includes(s);
    }
    return true;
  });

  const stats = {
    total: ordenes.length,
    borradores: ordenes.filter(o => o.estado === "borrador").length,
    enviadas: ordenes.filter(o => o.estado === "enviada").length,
    recibidas: ordenes.filter(o => o.estado === "recibida").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compras / Procurement</h1>
        <p className="text-muted-foreground">Proveedores y órdenes de compra</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes de Compra</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
        </TabsList>

        {/* ÓRDENES DE COMPRA */}
        <TabsContent value="ordenes" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total OC</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Package className="h-8 w-8 text-gray-500" /><div><p className="text-2xl font-bold">{stats.borradores}</p><p className="text-xs text-muted-foreground">Borradores</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><Truck className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{stats.enviadas}</p><p className="text-xs text-muted-foreground">Enviadas</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{stats.recibidas}</p><p className="text-xs text-muted-foreground">Recibidas</p></div></CardContent></Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar orden o proveedor..." value={searchOC} onChange={e => setSearchOC(e.target.value)} />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="recibida">Recibida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={ordenDialog} onOpenChange={setOrdenDialog}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nueva OC</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nueva Orden de Compra</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Proveedor</Label>
                      <Select value={ordenForm.proveedor_id} onValueChange={v => setOrdenForm(f => ({ ...f, proveedor_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>{proveedores.filter(p => p.activo).map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prioridad</Label>
                      <Select value={ordenForm.prioridad} onValueChange={v => setOrdenForm(f => ({ ...f, prioridad: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Fecha Estimada Entrega</Label>
                    <Input type="date" value={ordenForm.fecha_estimada_entrega} onChange={e => setOrdenForm(f => ({ ...f, fecha_estimada_entrega: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <Textarea value={ordenForm.notas} onChange={e => setOrdenForm(f => ({ ...f, notas: e.target.value }))} />
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Ítems</Label>
                      <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Agregar</Button>
                    </div>
                    {items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          {i === 0 && <Label className="text-xs">Descripción</Label>}
                          <Input value={item.descripcion} onChange={e => updateItem(i, "descripcion", e.target.value)} placeholder="Producto/Insumo" />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Cant.</Label>}
                          <Input type="number" min={1} value={item.cantidad_solicitada} onChange={e => updateItem(i, "cantidad_solicitada", Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Precio</Label>}
                          <Input type="number" min={0} step={0.01} value={item.precio_unitario} onChange={e => updateItem(i, "precio_unitario", Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs">Subtotal</Label>}
                          <p className="text-sm font-medium py-2">${(item.cantidad_solicitada * item.precio_unitario).toFixed(2)}</p>
                        </div>
                        <div className="col-span-1">
                          <Button size="icon" variant="ghost" onClick={() => removeItem(i)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                    {items.length > 0 && (
                      <p className="text-right font-semibold">Total: ${items.reduce((s, i) => s + i.cantidad_solicitada * i.precio_unitario, 0).toFixed(2)}</p>
                    )}
                  </div>

                  <Button onClick={handleCreateOrden} className="w-full">Crear Orden de Compra</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Total Est.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrdenes.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay órdenes</TableCell></TableRow>
                  ) : filteredOrdenes.map(o => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => openDetalle(o)}>
                      <TableCell className="font-mono text-xs">{o.numero_orden}</TableCell>
                      <TableCell>{o.proveedores?.nombre || "—"}</TableCell>
                      <TableCell><Badge className={ESTADOS_COLOR[o.estado]}>{o.estado}</Badge></TableCell>
                      <TableCell><Badge variant={o.prioridad === "urgente" ? "destructive" : "outline"}>{o.prioridad}</Badge></TableCell>
                      <TableCell>${Number(o.total_estimado || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{new Date(o.fecha_emision + "T12:00:00").toLocaleDateString()}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {o.estado === "borrador" && <Button size="sm" variant="outline" onClick={() => updateEstadoOrden(o.id, "enviada")}>Enviar</Button>}
                          {o.estado === "enviada" && <Button size="sm" variant="outline" onClick={() => updateEstadoOrden(o.id, "recibida")}>Recibir</Button>}
                          {["borrador", "enviada"].includes(o.estado) && <Button size="sm" variant="ghost" onClick={() => updateEstadoOrden(o.id, "cancelada")}><XCircle className="h-4 w-4" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROVEEDORES */}
        <TabsContent value="proveedores" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={provDialog} onOpenChange={setProvDialog}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo Proveedor</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo Proveedor</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nombre *</Label><Input value={provForm.nombre} onChange={e => setProvForm(f => ({ ...f, nombre: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>RNC</Label><Input value={provForm.rnc} onChange={e => setProvForm(f => ({ ...f, rnc: e.target.value }))} /></div>
                    <div><Label>Contacto</Label><Input value={provForm.contacto_nombre} onChange={e => setProvForm(f => ({ ...f, contacto_nombre: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Email</Label><Input type="email" value={provForm.email} onChange={e => setProvForm(f => ({ ...f, email: e.target.value }))} /></div>
                    <div><Label>Teléfono</Label><Input value={provForm.telefono} onChange={e => setProvForm(f => ({ ...f, telefono: e.target.value }))} /></div>
                  </div>
                  <div><Label>Dirección</Label><Input value={provForm.direccion} onChange={e => setProvForm(f => ({ ...f, direccion: e.target.value }))} /></div>
                  <div><Label>Notas</Label><Textarea value={provForm.notas} onChange={e => setProvForm(f => ({ ...f, notas: e.target.value }))} /></div>
                  <Button onClick={handleCreateProveedor} className="w-full">Guardar Proveedor</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RNC</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedores.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay proveedores</TableCell></TableRow>
                  ) : proveedores.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>{p.rnc || "—"}</TableCell>
                      <TableCell>{p.contacto_nombre || "—"}</TableCell>
                      <TableCell>{p.email ? <a href={`mailto:${p.email}`} className="text-primary underline">{p.email}</a> : "—"}</TableCell>
                      <TableCell>{p.telefono ? <a href={`tel:${p.telefono}`} className="text-primary underline">{p.telefono}</a> : "—"}</TableCell>
                      <TableCell><Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalle Orden */}
      <Dialog open={!!detalleOrden} onOpenChange={v => !v && setDetalleOrden(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Orden {detalleOrden?.numero_orden}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Badge className={ESTADOS_COLOR[detalleOrden?.estado]}>{detalleOrden?.estado}</Badge>
              <Badge variant="outline">{detalleOrden?.prioridad}</Badge>
            </div>
            <p className="text-sm"><strong>Proveedor:</strong> {detalleOrden?.proveedores?.nombre || "—"}</p>
            {detalleOrden?.notas && <p className="text-sm text-muted-foreground">{detalleOrden.notas}</p>}
            <Table>
              <TableHeader><TableRow><TableHead>Ítem</TableHead><TableHead>Cant.</TableHead><TableHead>Precio</TableHead><TableHead>Subtotal</TableHead></TableRow></TableHeader>
              <TableBody>
                {detalleItems.map(it => (
                  <TableRow key={it.id}>
                    <TableCell>{it.descripcion}</TableCell>
                    <TableCell>{it.cantidad_solicitada}</TableCell>
                    <TableCell>${Number(it.precio_unitario).toFixed(2)}</TableCell>
                    <TableCell>${Number(it.subtotal).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-right font-semibold">Total: ${Number(detalleOrden?.total_estimado || 0).toFixed(2)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compras;
