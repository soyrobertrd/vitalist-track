import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Package, AlertTriangle, ArrowDownUp } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalInventarioTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [openMov, setOpenMov] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [form, setForm] = useState({ nombre: "", categoria: "general", sku: "", stock_actual: "0", stock_minimo: "5", unidad: "unidad", precio_costo: "0", precio_venta: "0", proveedor: "", lote: "", fecha_vencimiento: "", ubicacion: "" });
  const [movForm, setMovForm] = useState({ tipo: "entrada", cantidad: "1", motivo: "" });

  const { data: items = [], refetch } = useQuery({
    queryKey: ["inventario_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("inventario_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("nombre").limit(500);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await (supabase.from("inventario_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo,
      nombre: form.nombre, categoria: form.categoria || "general",
      sku: form.sku || null, stock_actual: parseFloat(form.stock_actual) || 0,
      stock_minimo: parseFloat(form.stock_minimo) || 5, unidad: form.unidad || "unidad",
      precio_costo: parseFloat(form.precio_costo) || 0, precio_venta: parseFloat(form.precio_venta) || 0,
      proveedor: form.proveedor || null, lote: form.lote || null,
      fecha_vencimiento: form.fecha_vencimiento || null, ubicacion: form.ubicacion || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Producto agregado");
    setOpen(false);
    setForm({ nombre: "", categoria: "general", sku: "", stock_actual: "0", stock_minimo: "5", unidad: "unidad", precio_costo: "0", precio_venta: "0", proveedor: "", lote: "", fecha_vencimiento: "", ubicacion: "" });
    refetch();
  };

  const registrarMov = async () => {
    if (!wsId || !selectedItem || !movForm.cantidad) return;
    const { error } = await (supabase.from("movimientos_inventario_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo, item_id: selectedItem,
      tipo: movForm.tipo, cantidad: parseFloat(movForm.cantidad),
      motivo: movForm.motivo || null, usuario_id: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Movimiento registrado");
    setOpenMov(false);
    setMovForm({ tipo: "entrada", cantidad: "1", motivo: "" });
    refetch();
  };

  const stockBajo = items.filter((i: any) => i.stock_actual <= i.stock_minimo && i.activo);
  const totalValor = items.reduce((s: number, i: any) => s + (i.stock_actual * i.precio_costo), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{items.length}</div><div className="text-xs text-muted-foreground">Productos</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{stockBajo.length}</div><div className="text-xs text-muted-foreground">Stock bajo</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{items.filter((i: any) => i.activo).length}</div><div className="text-xs text-muted-foreground">Activos</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold">${totalValor.toLocaleString()}</div><div className="text-xs text-muted-foreground">Valor inventario</div></Card>
      </div>

      {stockBajo.length > 0 && (
        <Card className="p-3 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="font-medium text-sm">Alertas de stock bajo</span></div>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map((i: any) => (
              <Badge key={i.id} variant="destructive" className="text-xs">{i.nombre}: {i.stock_actual} {i.unidad}</Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Inventario</h3>
        <div className="flex gap-2">
          <Dialog open={openMov} onOpenChange={setOpenMov}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><ArrowDownUp className="h-4 w-4 mr-1" /> Movimiento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar movimiento</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Producto</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{items.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label>
                    <Select value={movForm.tipo} onValueChange={v => setMovForm({ ...movForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="salida">Salida</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                        <SelectItem value="merma">Merma</SelectItem>
                        <SelectItem value="devolucion">Devolución</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Cantidad</Label><Input type="number" value={movForm.cantidad} onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} /></div>
                </div>
                <div><Label>Motivo</Label><Input value={movForm.motivo} onChange={e => setMovForm({ ...movForm, motivo: e.target.value })} /></div>
                <Button onClick={registrarMov}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo producto</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Agregar producto</DialogTitle></DialogHeader>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
                  <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Categoría</Label><Input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div>
                  <div><Label>Unidad</Label><Input value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} /></div>
                  <div><Label>Ubicación</Label><Input value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Stock actual</Label><Input type="number" value={form.stock_actual} onChange={e => setForm({ ...form, stock_actual: e.target.value })} /></div>
                  <div><Label>Stock mínimo</Label><Input type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Precio costo</Label><Input type="number" value={form.precio_costo} onChange={e => setForm({ ...form, precio_costo: e.target.value })} /></div>
                  <div><Label>Precio venta</Label><Input type="number" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Proveedor</Label><Input value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} /></div>
                  <div><Label>Lote</Label><Input value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} /></div>
                </div>
                <div><Label>Fecha vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
                <Button onClick={crear}><Package className="h-4 w-4 mr-1" /> Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Mín</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Venta</TableHead>
              <TableHead>Proveedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i: any) => (
              <TableRow key={i.id} className={i.stock_actual <= i.stock_minimo ? "bg-destructive/5" : ""}>
                <TableCell className="font-medium">{i.nombre}{i.sku ? ` (${i.sku})` : ""}</TableCell>
                <TableCell>{i.categoria}</TableCell>
                <TableCell><span className={i.stock_actual <= i.stock_minimo ? "text-destructive font-bold" : ""}>{i.stock_actual} {i.unidad}</span></TableCell>
                <TableCell>{i.stock_minimo}</TableCell>
                <TableCell>${i.precio_costo}</TableCell>
                <TableCell>${i.precio_venta}</TableCell>
                <TableCell className="text-sm">{i.proveedor || "—"}</TableCell>
              </TableRow>
            ))}
            {!items.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin productos en inventario</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
