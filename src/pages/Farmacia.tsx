import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pill, Package, ClipboardList, TrendingDown, AlertTriangle, Search } from "lucide-react";

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  despachada: "bg-green-100 text-green-800",
  parcial: "bg-blue-100 text-blue-800",
  cancelada: "bg-red-100 text-red-800",
};

const Farmacia = () => {
  const [recetas, setRecetas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchReceta, setSearchReceta] = useState("");
  const [searchStock, setSearchStock] = useState("");
  const [newStockOpen, setNewStockOpen] = useState(false);
  const [newStockForm, setNewStockForm] = useState({ medicamento: "", presentacion: "", lote: "", fecha_vencimiento: "", cantidad: "0", stock_minimo: "10", precio_unitario: "0", ubicacion: "" });

  const fetchData = async () => {
    setLoading(true);
    const [r, s, m] = await Promise.all([
      supabase.from("recetas_farmacia").select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)").order("created_at", { ascending: false }).limit(200),
      supabase.from("stock_farmacia").select("*").order("medicamento").limit(500),
      supabase.from("movimientos_stock_farmacia").select("*, stock_farmacia(medicamento)").order("created_at", { ascending: false }).limit(100),
    ]);
    if (r.data) setRecetas(r.data);
    if (s.data) setStock(s.data);
    if (m.data) setMovimientos(m.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStock = async () => {
    const { error } = await supabase.from("stock_farmacia").insert({
      medicamento: newStockForm.medicamento,
      presentacion: newStockForm.presentacion || null,
      lote: newStockForm.lote || null,
      fecha_vencimiento: newStockForm.fecha_vencimiento || null,
      cantidad: parseInt(newStockForm.cantidad) || 0,
      stock_minimo: parseInt(newStockForm.stock_minimo) || 10,
      precio_unitario: parseFloat(newStockForm.precio_unitario) || 0,
      ubicacion: newStockForm.ubicacion || null,
    });
    if (error) { toast.error("Error al agregar stock"); return; }
    toast.success("Stock agregado");
    setNewStockOpen(false);
    setNewStockForm({ medicamento: "", presentacion: "", lote: "", fecha_vencimiento: "", cantidad: "0", stock_minimo: "10", precio_unitario: "0", ubicacion: "" });
    fetchData();
  };

  const stockBajo = stock.filter(s => s.cantidad <= s.stock_minimo);
  const stockVencido = stock.filter(s => s.fecha_vencimiento && new Date(s.fecha_vencimiento + "T12:00:00") < new Date());

  const filteredRecetas = recetas.filter(r =>
    (r.numero || "").toLowerCase().includes(searchReceta.toLowerCase()) ||
    (r.pacientes?.nombre || "").toLowerCase().includes(searchReceta.toLowerCase()) ||
    (r.pacientes?.apellido || "").toLowerCase().includes(searchReceta.toLowerCase())
  );

  const filteredStock = stock.filter(s =>
    s.medicamento.toLowerCase().includes(searchStock.toLowerCase()) ||
    (s.lote || "").toLowerCase().includes(searchStock.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Pill className="h-7 w-7 text-primary" /> Farmacia
          </h1>
          <p className="text-muted-foreground text-sm">Gestión de recetas, despacho y stock de medicamentos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <ClipboardList className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{recetas.filter(r => r.estado === "pendiente").length}</p>
          <p className="text-xs text-muted-foreground">Recetas pendientes</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Package className="h-6 w-6 mx-auto text-green-600 mb-1" />
          <p className="text-2xl font-bold">{stock.length}</p>
          <p className="text-xs text-muted-foreground">Productos en stock</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingDown className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
          <p className="text-2xl font-bold">{stockBajo.length}</p>
          <p className="text-xs text-muted-foreground">Stock bajo</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-red-600 mb-1" />
          <p className="text-2xl font-bold">{stockVencido.length}</p>
          <p className="text-xs text-muted-foreground">Vencidos</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="recetas">
        <TabsList>
          <TabsTrigger value="recetas">Recetas</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>

        {/* Recetas */}
        <TabsContent value="recetas" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar receta..." value={searchReceta} onChange={e => setSearchReceta(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Prescriptor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecetas.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No hay recetas registradas</TableCell></TableRow>
                ) : filteredRecetas.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.numero}</TableCell>
                    <TableCell>{r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido}` : "—"}</TableCell>
                    <TableCell>{r.personal_salud ? `${r.personal_salud.nombre} ${r.personal_salud.apellido}` : "—"}</TableCell>
                    <TableCell><Badge className={estadoBadge[r.estado] || ""}>{r.estado}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(r.fecha_emision).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Stock */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar medicamento..." value={searchStock} onChange={e => setSearchStock(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={newStockOpen} onOpenChange={setNewStockOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Agregar Stock</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Medicamento *</Label><Input value={newStockForm.medicamento} onChange={e => setNewStockForm(p => ({ ...p, medicamento: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Presentación</Label><Input value={newStockForm.presentacion} onChange={e => setNewStockForm(p => ({ ...p, presentacion: e.target.value }))} /></div>
                    <div><Label>Lote</Label><Input value={newStockForm.lote} onChange={e => setNewStockForm(p => ({ ...p, lote: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Vencimiento</Label><Input type="date" value={newStockForm.fecha_vencimiento} onChange={e => setNewStockForm(p => ({ ...p, fecha_vencimiento: e.target.value }))} /></div>
                    <div><Label>Cantidad</Label><Input type="number" value={newStockForm.cantidad} onChange={e => setNewStockForm(p => ({ ...p, cantidad: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Stock mínimo</Label><Input type="number" value={newStockForm.stock_minimo} onChange={e => setNewStockForm(p => ({ ...p, stock_minimo: e.target.value }))} /></div>
                    <div><Label>Precio unitario</Label><Input type="number" step="0.01" value={newStockForm.precio_unitario} onChange={e => setNewStockForm(p => ({ ...p, precio_unitario: e.target.value }))} /></div>
                  </div>
                  <div><Label>Ubicación</Label><Input value={newStockForm.ubicacion} onChange={e => setNewStockForm(p => ({ ...p, ubicacion: e.target.value }))} /></div>
                  <Button onClick={handleAddStock} disabled={!newStockForm.medicamento}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin stock registrado</TableCell></TableRow>
                ) : filteredStock.map(s => {
                  const bajo = s.cantidad <= s.stock_minimo;
                  const vencido = s.fecha_vencimiento && new Date(s.fecha_vencimiento + "T12:00:00") < new Date();
                  return (
                    <TableRow key={s.id} className={vencido ? "bg-red-50 dark:bg-red-950/20" : bajo ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell className="font-medium">{s.medicamento}</TableCell>
                      <TableCell>{s.presentacion || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{s.lote || "—"}</TableCell>
                      <TableCell>
                        <span className={bajo ? "text-yellow-700 font-bold" : ""}>{s.cantidad}</span>
                        {bajo && <AlertTriangle className="inline h-3 w-3 ml-1 text-yellow-600" />}
                      </TableCell>
                      <TableCell className={vencido ? "text-red-600 font-semibold" : ""}>
                        {s.fecha_vencimiento ? new Date(s.fecha_vencimiento + "T12:00:00").toLocaleDateString() : "—"}
                        {vencido && <Badge variant="destructive" className="ml-1 text-xs">Vencido</Badge>}
                      </TableCell>
                      <TableCell>{s.ubicacion || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Movimientos */}
        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin movimientos</TableCell></TableRow>
                ) : movimientos.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{(m.stock_farmacia as any)?.medicamento || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                    <TableCell className={m.tipo === "salida" ? "text-red-600" : "text-green-600"}>{m.tipo === "salida" ? `-${m.cantidad}` : `+${m.cantidad}`}</TableCell>
                    <TableCell className="text-sm">{m.motivo || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Farmacia;
