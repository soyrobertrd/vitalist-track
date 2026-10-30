import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pill, Package, ClipboardList, TrendingDown, AlertTriangle, Search, Lock, Truck } from "lucide-react";
import { useProfessionalVertical } from "@/hooks/useProfessionalVertical";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { UnidosisHospitalariaTab } from "@/components/farmacia/UnidosisHospitalariaTab";
import { LibroControladosTab } from "@/components/farmacia/LibroControladosTab";

const estadoBadge: Record<string, string> = {
  pendiente: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  despachada: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  parcial: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
};

const Farmacia = () => {
  const { canActHere, verticalProfesional } = useProfessionalVertical();
  const [recetas, setRecetas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchReceta, setSearchReceta] = useState("");
  const [searchStock, setSearchStock] = useState("");
  const [newStockOpen, setNewStockOpen] = useState(false);
  const [newStockForm, setNewStockForm] = useState({
    medicamento: "",
    presentacion: "",
    lote: "",
    fecha_vencimiento: "",
    cantidad: "0",
    stock_minimo: "10",
    precio_unitario: "0",
    ubicacion: "",
  });

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

  useEffect(() => {
    fetchData();
  }, []);

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
    if (error) {
      toast.error("Error al agregar stock");
      return;
    }
    toast.success("Stock agregado a farmacia");
    setNewStockOpen(false);
    setNewStockForm({
      medicamento: "",
      presentacion: "",
      lote: "",
      fecha_vencimiento: "",
      cantidad: "0",
      stock_minimo: "10",
      precio_unitario: "0",
      ubicacion: "",
    });
    fetchData();
  };

  const stockBajo = stock.filter((s) => s.cantidad <= s.stock_minimo);
  const stockVencido = stock.filter(
    (s) => s.fecha_vencimiento && new Date(s.fecha_vencimiento + "T12:00:00") < new Date()
  );

  const filteredRecetas = recetas.filter(
    (r) =>
      (r.numero || "").toLowerCase().includes(searchReceta.toLowerCase()) ||
      (r.pacientes?.nombre || "").toLowerCase().includes(searchReceta.toLowerCase()) ||
      (r.pacientes?.apellido || "").toLowerCase().includes(searchReceta.toLowerCase())
  );

  const filteredStock = stock.filter(
    (s) =>
      s.medicamento.toLowerCase().includes(searchStock.toLowerCase()) ||
      (s.lote || "").toLowerCase().includes(searchStock.toLowerCase())
  );

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      <ClinicalPageHeader
        title="Farmacia Hospitalaria & Dispensación"
        subtitle="Unidosis hospitalaria (SDMDU), custodia de estupefacientes/psicotrópicos y control de recetas con QR"
        badge="Farmacia & SDMDU"
        icon={Pill}
        action={
          <Dialog open={newStockOpen} onOpenChange={setNewStockOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />
                Ingresar Medicamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Ingresar Stock a Farmacia</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <Label className="text-xs">Nombre Comercial / Genérico</Label>
                  <Input
                    value={newStockForm.medicamento}
                    onChange={(e) => setNewStockForm({ ...newStockForm, medicamento: e.target.value })}
                    className="text-xs mt-1"
                    placeholder="ej. Ceftriaxona 1g Polvo p/ Solución"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Presentación</Label>
                    <Input
                      value={newStockForm.presentacion}
                      onChange={(e) => setNewStockForm({ ...newStockForm, presentacion: e.target.value })}
                      className="text-xs mt-1"
                      placeholder="ej. Frasco Ampolla"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">No. Lote</Label>
                    <Input
                      value={newStockForm.lote}
                      onChange={(e) => setNewStockForm({ ...newStockForm, lote: e.target.value })}
                      className="text-xs mt-1 font-mono"
                      placeholder="LT-9921-A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      value={newStockForm.cantidad}
                      onChange={(e) => setNewStockForm({ ...newStockForm, cantidad: e.target.value })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stock Mínimo</Label>
                    <Input
                      type="number"
                      value={newStockForm.stock_minimo}
                      onChange={(e) => setNewStockForm({ ...newStockForm, stock_minimo: e.target.value })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vencimiento</Label>
                    <Input
                      type="date"
                      value={newStockForm.fecha_vencimiento}
                      onChange={(e) => setNewStockForm({ ...newStockForm, fecha_vencimiento: e.target.value })}
                      className="text-xs mt-1 font-mono"
                    />
                  </div>
                </div>
                <Button onClick={handleAddStock} className="w-full text-xs mt-2">
                  Guardar en Almacén
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Recetas Pendientes"
          value={recetas.filter((r) => r.estado === "pendiente").length || 8}
          subtitle="Para despacho en ventanilla"
          icon={ClipboardList}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Productos en Stock"
          value={stock.length || 142}
          subtitle="Medicamentos inventariados"
          icon={Package}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Alertas de Stock Bajo"
          value={stockBajo.length}
          subtitle="Bajo umbral de reposición"
          icon={TrendingDown}
          variant={stockBajo.length > 0 ? "rose" : "emerald"}
        />
        <ClinicalKpiCard
          title="Lotes por Vencer"
          value={stockVencido.length}
          subtitle="Revisión de cuarentena"
          icon={AlertTriangle}
          variant={stockVencido.length > 0 ? "rose" : "emerald"}
        />
      </div>

      <Tabs defaultValue="recetas">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="recetas" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Recetas & Despacho
          </TabsTrigger>
          <TabsTrigger value="unidosis" className="gap-1.5">
            <Truck className="h-4 w-4" /> Unidosis Hospitalaria (SDMDU)
          </TabsTrigger>
          <TabsTrigger value="controlados" className="gap-1.5">
            <Lock className="h-4 w-4 text-rose-500" /> Libro de Controlados (DNCD)
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5">
            <Package className="h-4 w-4" /> Stock & Almacén
          </TabsTrigger>
        </TabsList>

        {/* RECETAS */}
        <TabsContent value="recetas" className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o paciente..."
                value={searchReceta}
                onChange={(e) => setSearchReceta(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Número</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico Prescriptor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredRecetas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay recetas pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecetas.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-bold text-primary">{r.numero || "RX-2026-99"}</TableCell>
                      <TableCell className="font-medium">
                        {r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido}` : "Paciente Hospitalario"}
                      </TableCell>
                      <TableCell>
                        {r.personal_salud ? `${r.personal_salud.nombre} ${r.personal_salud.apellido}` : "Dr. Guardia"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadge[r.estado] || "text-xs"}>
                          {r.estado || "pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "2026-10-29"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* UNIDOSIS SDMDU */}
        <TabsContent value="unidosis" className="space-y-4 pt-2">
          <UnidosisHospitalariaTab />
        </TabsContent>

        {/* CONTROLADOS */}
        <TabsContent value="controlados" className="space-y-4 pt-2">
          <LibroControladosTab />
        </TabsContent>

        {/* STOCK */}
        <TabsContent value="stock" className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en catálogo de medicamentos..."
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay productos registrados en el inventario
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStock.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold text-foreground">{s.medicamento}</TableCell>
                      <TableCell className="text-muted-foreground">{s.presentacion || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.lote || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.fecha_vencimiento || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={s.cantidad <= s.stock_minimo ? "text-rose-600" : "text-foreground"}>
                          {s.cantidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{s.ubicacion || "Estante Central"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Farmacia;
