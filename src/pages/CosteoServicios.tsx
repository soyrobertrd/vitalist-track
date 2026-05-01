import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Plus, Building } from "lucide-react";
import { toast } from "sonner";

export default function CosteoServicios() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [centros, setCentros] = useState<any[]>([]);
  const [costeo, setCosteo] = useState<any[]>([]);
  const [openCC, setOpenCC] = useState(false);
  const [openCS, setOpenCS] = useState(false);
  const [formCC, setFormCC] = useState({ codigo: "", nombre: "", presupuesto_anual: "" });
  const [formCS, setFormCS] = useState({ codigo_servicio: "", nombre_servicio: "", centro_costo_id: "", costo_directo: "", costo_indirecto: "", precio_venta: "" });

  const cargar = async () => {
    if (!wsId) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      (supabase as any).from("centros_costo").select("*").eq("workspace_id", wsId).eq("activo", true).order("codigo"),
      (supabase as any).from("costeo_servicios").select("*, centros_costo(nombre)").eq("workspace_id", wsId).eq("activo", true).order("nombre_servicio"),
    ]);
    setCentros(a || []);
    setCosteo(b || []);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const guardarCC = async () => {
    if (!wsId) return;
    const { error } = await (supabase as any).from("centros_costo").insert({
      workspace_id: wsId,
      codigo: formCC.codigo,
      nombre: formCC.nombre,
      presupuesto_anual: parseFloat(formCC.presupuesto_anual) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Centro de costo creado");
    setOpenCC(false);
    setFormCC({ codigo: "", nombre: "", presupuesto_anual: "" });
    cargar();
  };

  const guardarCS = async () => {
    if (!wsId) return;
    const directo = parseFloat(formCS.costo_directo) || 0;
    const indirecto = parseFloat(formCS.costo_indirecto) || 0;
    const venta = parseFloat(formCS.precio_venta) || 0;
    const total = directo + indirecto;
    const margen = venta > 0 ? ((venta - total) / venta) * 100 : 0;
    const { error } = await (supabase as any).from("costeo_servicios").insert({
      workspace_id: wsId,
      codigo_servicio: formCS.codigo_servicio,
      nombre_servicio: formCS.nombre_servicio,
      centro_costo_id: formCS.centro_costo_id || null,
      costo_directo: directo,
      costo_indirecto: indirecto,
      precio_venta: venta,
      margen_bruto: margen.toFixed(2),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Costeo creado");
    setOpenCS(false);
    setFormCS({ codigo_servicio: "", nombre_servicio: "", centro_costo_id: "", costo_directo: "", costo_indirecto: "", precio_venta: "" });
    cargar();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="h-7 w-7 text-primary" /> Costeo por Servicio
        </h1>
        <p className="text-sm text-muted-foreground">Estructura de costos directos, indirectos y márgenes</p>
      </div>

      <Tabs defaultValue="costeo">
        <TabsList>
          <TabsTrigger value="costeo">Costeo de servicios ({costeo.length})</TabsTrigger>
          <TabsTrigger value="centros">Centros de costo ({centros.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="costeo" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openCS} onOpenChange={setOpenCS}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo costeo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo costeo de servicio</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Código</Label><Input value={formCS.codigo_servicio} onChange={e => setFormCS({ ...formCS, codigo_servicio: e.target.value })} /></div>
                    <div><Label>Nombre</Label><Input value={formCS.nombre_servicio} onChange={e => setFormCS({ ...formCS, nombre_servicio: e.target.value })} /></div>
                  </div>
                  <div><Label>Centro de costo</Label>
                    <select className="w-full border rounded p-2 bg-background" value={formCS.centro_costo_id} onChange={e => setFormCS({ ...formCS, centro_costo_id: e.target.value })}>
                      <option value="">— Sin asignar —</option>
                      {centros.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Costo directo</Label><Input type="number" value={formCS.costo_directo} onChange={e => setFormCS({ ...formCS, costo_directo: e.target.value })} /></div>
                    <div><Label>Costo indirecto</Label><Input type="number" value={formCS.costo_indirecto} onChange={e => setFormCS({ ...formCS, costo_indirecto: e.target.value })} /></div>
                    <div><Label>Precio venta</Label><Input type="number" value={formCS.precio_venta} onChange={e => setFormCS({ ...formCS, precio_venta: e.target.value })} /></div>
                  </div>
                  <Button onClick={guardarCS}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Servicio</TableHead><TableHead>Centro</TableHead><TableHead className="text-right">Directo</TableHead><TableHead className="text-right">Indirecto</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Margen</TableHead></TableRow></TableHeader>
              <TableBody>
                {costeo.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.codigo_servicio}</TableCell>
                    <TableCell>{c.nombre_servicio}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.centros_costo?.nombre || "—"}</TableCell>
                    <TableCell className="text-right font-mono">${Number(c.costo_directo).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">${Number(c.costo_indirecto).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">${Number(c.costo_total).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">${Number(c.precio_venta).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={Number(c.margen_bruto) > 30 ? "default" : Number(c.margen_bruto) > 10 ? "secondary" : "destructive"}>
                        {Number(c.margen_bruto || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!costeo.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin costeo registrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="centros" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openCC} onOpenChange={setOpenCC}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo centro</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo centro de costo</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Código</Label><Input value={formCC.codigo} onChange={e => setFormCC({ ...formCC, codigo: e.target.value })} /></div>
                  <div><Label>Nombre</Label><Input value={formCC.nombre} onChange={e => setFormCC({ ...formCC, nombre: e.target.value })} /></div>
                  <div><Label>Presupuesto anual</Label><Input type="number" value={formCC.presupuesto_anual} onChange={e => setFormCC({ ...formCC, presupuesto_anual: e.target.value })} /></div>
                  <Button onClick={guardarCC}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {centros.map(c => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2"><Building className="h-4 w-4 text-primary" /><span className="font-semibold">{c.nombre}</span></div>
                  <Badge variant="outline" className="text-xs">{c.codigo}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Presupuesto anual</div>
                <div className="text-xl font-bold">${Number(c.presupuesto_anual || 0).toLocaleString()}</div>
              </Card>
            ))}
            {!centros.length && <div className="col-span-full text-center text-muted-foreground py-8">Sin centros de costo</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
