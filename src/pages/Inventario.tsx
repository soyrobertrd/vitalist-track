import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, AlertTriangle, CalendarClock, ArrowUpDown, Pill, Boxes } from "lucide-react";
import {
  useInventarioItems,
  useItemsBajoStock,
  useLotesProximosVencer,
  useCrearItem,
  useRegistrarMovimiento,
  type InventarioCategoria,
  type MovimientoTipo,
} from "@/hooks/useInventario";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS: { value: InventarioCategoria; label: string }[] = [
  { value: "muestra_medica", label: "Muestra médica" },
  { value: "medicamento", label: "Medicamento" },
  { value: "insumo", label: "Insumo" },
  { value: "material", label: "Material" },
  { value: "equipo", label: "Equipo" },
  { value: "otro", label: "Otro" },
];

export default function Inventario() {
  const { isAdmin } = useUserRole();
  const [categoriaFilter, setCategoriaFilter] = useState<InventarioCategoria | "todas">("todas");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [movimientoOpen, setMovimientoOpen] = useState<string | null>(null);

  const { data: items = [], isLoading } = useInventarioItems(
    categoriaFilter === "todas" ? undefined : { categoria: categoriaFilter }
  );
  const { data: bajoStock = [] } = useItemsBajoStock();
  const { data: vencimientos = [] } = useLotesProximosVencer(60);
  const crearItem = useCrearItem();
  const registrarMov = useRegistrarMovimiento();

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        search ? i.nombre.toLowerCase().includes(search.toLowerCase()) : true
      ),
    [items, search]
  );

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoria: "muestra_medica" as InventarioCategoria,
    unidad_medida: "unidad",
    stock_minimo: 0,
    requiere_lotes: false,
  });

  const handleCrear = async () => {
    if (!form.nombre.trim()) return;
    await crearItem.mutateAsync(form);
    setCreateOpen(false);
    setForm({
      nombre: "",
      descripcion: "",
      categoria: "muestra_medica",
      unidad_medida: "unidad",
      stock_minimo: 0,
      requiere_lotes: false,
    });
  };

  const [movForm, setMovForm] = useState<{ tipo: MovimientoTipo; cantidad: number; motivo: string }>({
    tipo: "entrada",
    cantidad: 1,
    motivo: "",
  });

  const handleMovimiento = async () => {
    if (!movimientoOpen || movForm.cantidad <= 0) return;
    await registrarMov.mutateAsync({
      item_id: movimientoOpen,
      tipo: movForm.tipo,
      cantidad: movForm.cantidad,
      motivo: movForm.motivo || undefined,
    });
    setMovimientoOpen(null);
    setMovForm({ tipo: "entrada", cantidad: 1, motivo: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="h-7 w-7 text-primary" />
            Inventario
          </h1>
          <p className="text-muted-foreground text-sm">
            Stock de muestras médicas, insumos y materiales con control de lotes y vencimientos.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo item de inventario</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={form.categoria}
                      onValueChange={(v) => setForm({ ...form, categoria: v as InventarioCategoria })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidad</Label>
                    <Input value={form.unidad_medida} onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Stock mínimo (alerta)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm">Controla lotes y vencimientos</Label>
                    <p className="text-xs text-muted-foreground">Activa para medicamentos regulados.</p>
                  </div>
                  <Switch
                    checked={form.requiere_lotes}
                    onCheckedChange={(v) => setForm({ ...form, requiere_lotes: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCrear} disabled={crearItem.isPending}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Items activos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" /> {items.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={bajoStock.length > 0 ? "border-warning/40" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Bajo stock</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" /> {bajoStock.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={vencimientos.length > 0 ? "border-destructive/40" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Próximos a vencer (60d)</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-destructive" /> {vencimientos.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas {bajoStock.length + vencimientos.length > 0 && (
              <Badge variant="destructive" className="ml-2">{bajoStock.length + vencimientos.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-xs"
            />
            <Select value={categoriaFilter} onValueChange={(v) => setCategoriaFilter(v as any)}>
              <SelectTrigger className="md:max-w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Mín.</TableHead>
                    <TableHead>Lotes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Cargando…</TableCell></TableRow>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin items. Crea el primero.</TableCell></TableRow>
                  )}
                  {filtered.map((item) => {
                    const isLow = item.stock_actual <= item.stock_minimo && item.stock_minimo > 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          {item.nombre}
                          <span className="text-xs text-muted-foreground">({item.unidad_medida})</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {CATEGORIAS.find((c) => c.value === item.categoria)?.label ?? item.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className={"text-right font-mono " + (isLow ? "text-destructive font-bold" : "")}>
                          {item.stock_actual}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{item.stock_minimo}</TableCell>
                        <TableCell>
                          {item.requiere_lotes ? <Badge variant="outline">Con lotes</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setMovimientoOpen(item.id)}>
                            <ArrowUpDown className="h-3 w-3 mr-1" /> Movimiento
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4">
          {bajoStock.length > 0 && (
            <Card className="border-warning/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" /> Bajo stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bajoStock.map((i) => (
                  <div key={i.id} className="flex justify-between border-b pb-2 last:border-0">
                    <span>{i.nombre}</span>
                    <span className="font-mono text-destructive">
                      {i.stock_actual} / {i.stock_minimo} {i.unidad_medida}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {vencimientos.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <CalendarClock className="h-5 w-5" /> Próximos a vencer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vencimientos.map((l: any) => (
                  <div key={l.id} className="flex justify-between border-b pb-2 last:border-0 text-sm">
                    <span>
                      {l.inventario_items?.nombre} · Lote <strong>{l.numero_lote}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Vence {format(new Date(l.fecha_vencimiento + "T12:00:00"), "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {bajoStock.length === 0 && vencimientos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Sin alertas activas. ✓</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Movimiento dialog */}
      <Dialog open={!!movimientoOpen} onOpenChange={(o) => !o && setMovimientoOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={movForm.tipo} onValueChange={(v) => setMovForm({ ...movForm, tipo: v as MovimientoTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste (+/-)</SelectItem>
                  <SelectItem value="merma">Merma / pérdida</SelectItem>
                  <SelectItem value="devolucion">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={movForm.cantidad}
                onChange={(e) => setMovForm({ ...movForm, cantidad: Number(e.target.value) || 0 })}
              />
              {movForm.tipo === "ajuste" && (
                <p className="text-xs text-muted-foreground mt-1">Usa números negativos para restar.</p>
              )}
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovimientoOpen(null)}>Cancelar</Button>
            <Button onClick={handleMovimiento} disabled={registrarMov.isPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
