import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, Glasses, FileText, Package, AlertTriangle, Users, CalendarDays, DollarSign, Calculator, Gift, ShieldCheck, Bell, Plus } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";
import VerticalPersonalTab from "@/components/vertical/VerticalPersonalTab";
import VerticalCitasTab from "@/components/vertical/VerticalCitasTab";
import VerticalFacturacionTab from "@/components/vertical/VerticalFacturacionTab";
import VerticalNominaTab from "@/components/vertical/VerticalNominaTab";
import VerticalPacientesTab from "@/components/vertical/VerticalPacientesTab";
import VerticalSucursalesTab from "@/components/vertical/VerticalSucursalesTab";
import VerticalLeadsCRMTab from "@/components/vertical/VerticalLeadsCRMTab";
import VerticalMarketingTab from "@/components/vertical/VerticalMarketingTab";
import VerticalBITab from "@/components/vertical/VerticalBITab";
import VerticalPortalTab from "@/components/vertical/VerticalPortalTab";
import VerticalPagosTab from "@/components/vertical/VerticalPagosTab";
import VerticalTelemedicinaTab from "@/components/vertical/VerticalTelemedicinaTab";
import VerticalRecetasTab from "@/components/vertical/VerticalRecetasTab";
import VerticalFacturacionElectronicaTab from "@/components/vertical/VerticalFacturacionElectronicaTab";
import VerticalIntegracionesTab from "@/components/vertical/VerticalIntegracionesTab";
import VerticalInventarioTab from "@/components/vertical/VerticalInventarioTab";
import VerticalReportesKPITab from "@/components/vertical/VerticalReportesKPITab";
import VerticalOnboardingTab from "@/components/vertical/VerticalOnboardingTab";
import VerticalPWATab from "@/components/vertical/VerticalPWATab";

const estadoOrdenColor: Record<string, string> = {
  solicitada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_laboratorio: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  lista: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  entregada: "bg-muted text-muted-foreground",
  devuelta: "bg-destructive/10 text-destructive",
};

export default function VisionCarePro() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [tab, setTab] = useState("recetas");

  const { data: recetas = [] } = useQuery({
    queryKey: ["recetas_oftalmicas", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("recetas_oftalmicas" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: inventario = [] } = useQuery({
    queryKey: ["inventario_optica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("inventario_optica" as any).select("*").eq("workspace_id", wsId!).eq("activo", true).order("tipo"); return (data || []) as any[]; },
  });
  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_trabajo_optica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("ordenes_trabajo_optica" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: combos = [], refetch: refetchCombos } = useQuery({
    queryKey: ["combos_optica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("combos_optica" as any).select("*").eq("workspace_id", wsId!).eq("activo", true).order("nombre"); return (data || []) as any[]; },
  });
  const { data: garantias = [] } = useQuery({
    queryKey: ["garantias_optica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await (supabase.from("garantias_optica") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: recordatorios = [] } = useQuery({
    queryKey: ["recordatorios_fidelizacion_optica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await (supabase.from("recordatorios_fidelizacion") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("proxima_fecha").limit(200); return (data || []) as any[]; },
  });

  // Combo form
  const [openCombo, setOpenCombo] = useState(false);
  const [comboForm, setComboForm] = useState({ nombre: "", precio_regular: 0, precio_combo: 0 });
  const crearCombo = async () => {
    if (!wsId || !comboForm.nombre) return;
    const { error } = await supabase.from("combos_optica" as any).insert({ workspace_id: wsId, ...comboForm });
    if (error) { toast.error(error.message); return; }
    toast.success("Combo creado");
    setOpenCombo(false);
    setComboForm({ nombre: "", precio_regular: 0, precio_combo: 0 });
    refetchCombos();
  };

  const monturas = inventario.filter((i: any) => i.tipo === "montura").length;
  const stockBajo = inventario.filter((i: any) => (i.stock || 0) < (i.stock_minimo || 2)).length;
  const ordenesPendientes = ordenes.filter((o: any) => !["entregada", "devuelta"].includes(o.estado)).length;
  const garantiasVigentes = garantias.filter((g: any) => g.estado === "vigente").length;
  const recordPendientes = recordatorios.filter((r: any) => r.estado === "pendiente").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Eye className="h-6 w-6" /> VisionCare Pro</h1>
        <p className="text-muted-foreground">Ópticas, centros oftalmológicos, cadenas multi-sucursal — recetas, inventario, combos, garantías</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <Card><CardContent className="pt-3 text-center"><FileText className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{recetas.length}</p><p className="text-[10px] text-muted-foreground">Recetas</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Glasses className="h-4 w-4 mx-auto mb-1 text-blue-500" /><p className="text-xl font-bold">{monturas}</p><p className="text-[10px] text-muted-foreground">Monturas</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Package className="h-4 w-4 mx-auto mb-1 text-green-500" /><p className="text-xl font-bold">{inventario.length}</p><p className="text-[10px] text-muted-foreground">Productos</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" /><p className="text-xl font-bold">{stockBajo}</p><p className="text-[10px] text-muted-foreground">Stock bajo</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Gift className="h-4 w-4 mx-auto mb-1 text-purple-500" /><p className="text-xl font-bold">{combos.length}</p><p className="text-[10px] text-muted-foreground">Combos</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><ShieldCheck className="h-4 w-4 mx-auto mb-1 text-cyan-500" /><p className="text-xl font-bold">{garantiasVigentes}</p><p className="text-[10px] text-muted-foreground">Garantías</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Bell className="h-4 w-4 mx-auto mb-1 text-orange-500" /><p className="text-xl font-bold">{recordPendientes}</p><p className="text-[10px] text-muted-foreground">Recordatorios</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="recetas">Recetas</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes Lab</TabsTrigger>
          <TabsTrigger value="combos">Combos</TabsTrigger>
          <TabsTrigger value="garantias">Garantías</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="pacientes"><Users className="h-3.5 w-3.5 mr-1" />Pacientes</TabsTrigger>
          <TabsTrigger value="citas"><CalendarDays className="h-3.5 w-3.5 mr-1" />Citas</TabsTrigger>
          <TabsTrigger value="personal"><Users className="h-3.5 w-3.5 mr-1" />Doctores</TabsTrigger>
          <TabsTrigger value="facturacion"><DollarSign className="h-3.5 w-3.5 mr-1" />Facturación</TabsTrigger>
          <TabsTrigger value="nomina"><Calculator className="h-3.5 w-3.5 mr-1" />Nómina</TabsTrigger>
          <TabsTrigger value="sucursales">Sucursales</TabsTrigger>
          <TabsTrigger value="leads">CRM Leads</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="pagos_online">Pagos Online</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
          <TabsTrigger value="bi">BI</TabsTrigger>
          <TabsTrigger value="telemedicina">Telemedicina</TabsTrigger>
          <TabsTrigger value="recetas">Recetas</TabsTrigger>
          <TabsTrigger value="ecf">e-CF / DGII</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
          <TabsTrigger value="inventario_v">Inventario</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="onboarding">Setup</TabsTrigger>
          <TabsTrigger value="pwa">PWA</TabsTrigger>
        </TabsList>

        <TabsContent value="recetas" className="space-y-3">
          {recetas.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No hay recetas</CardContent></Card> : recetas.map((r: any) => (
            <Card key={r.id}><CardContent className="py-4">
              <p className="font-medium">{r.numero}</p>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div><p className="font-medium text-xs text-muted-foreground">OD (Derecho)</p><p>Esf: {r.od_esfera ?? "—"} Cil: {r.od_cilindro ?? "—"} Eje: {r.od_eje ?? "—"}</p>{r.od_add && <p>ADD: {r.od_add}</p>}</div>
                <div><p className="font-medium text-xs text-muted-foreground">OI (Izquierdo)</p><p>Esf: {r.oi_esfera ?? "—"} Cil: {r.oi_cilindro ?? "—"} Eje: {r.oi_eje ?? "—"}</p>{r.oi_add && <p>ADD: {r.oi_add}</p>}</div>
              </div>
              {r.distancia_pupilar && <p className="text-xs text-muted-foreground mt-1">DP: {r.distancia_pupilar}mm</p>}
              {r.tipo_lente_recomendado && <Badge variant="outline" className="mt-2">{r.tipo_lente_recomendado}</Badge>}
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="inventario" className="space-y-3">
          {inventario.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No hay inventario</CardContent></Card> : inventario.map((i: any) => (
            <Card key={i.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{i.marca || ""} {i.modelo || i.tipo}</p>
                <p className="text-sm text-muted-foreground">{i.tipo?.replace(/_/g, " ")} {i.color ? `· ${i.color}` : ""} {i.material ? `· ${i.material}` : ""}</p>
                <p className="text-xs text-muted-foreground">Stock: {i.stock} · Precio: {fmt(i.precio_venta || 0)}</p>
              </div>
              {(i.stock || 0) < (i.stock_minimo || 2) && <Badge variant="destructive">Stock bajo</Badge>}
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-3">
          {ordenes.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No hay órdenes</CardContent></Card> : ordenes.map((o: any) => (
            <Card key={o.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{o.numero}</p>
                <p className="text-sm text-muted-foreground">{o.tipo_lente || ""} · {o.laboratorio || ""} {o.tratamientos?.length > 0 ? ` · ${(o.tratamientos as string[]).join(", ")}` : ""}</p>
                {o.precio_total && <p className="text-sm font-medium">{fmt(o.precio_total)}</p>}
              </div>
              <Badge className={estadoOrdenColor[o.estado] || ""}>{o.estado?.replace(/_/g, " ")}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="combos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCombo} onOpenChange={setOpenCombo}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo combo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear combo óptico</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre</Label><Input value={comboForm.nombre} onChange={e => setComboForm({ ...comboForm, nombre: e.target.value })} placeholder="Ej: Combo Estudiante" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Precio regular</Label><Input type="number" value={comboForm.precio_regular} onChange={e => setComboForm({ ...comboForm, precio_regular: +e.target.value })} /></div>
                    <div><Label>Precio combo</Label><Input type="number" value={comboForm.precio_combo} onChange={e => setComboForm({ ...comboForm, precio_combo: +e.target.value })} /></div>
                  </div>
                  <Button onClick={crearCombo}>Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.map((c: any) => (
              <Card key={c.id}><CardContent className="pt-4">
                <p className="font-bold">{c.nombre}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.descripcion || ""}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-sm line-through text-muted-foreground">{fmt(c.precio_regular)}</span>
                  <span className="text-lg font-bold text-green-600">{fmt(c.precio_combo)}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {c.incluye_montura && <Badge variant="outline" className="text-xs">Montura</Badge>}
                  {c.incluye_lentes && <Badge variant="outline" className="text-xs">Lentes</Badge>}
                  {c.tratamientos_incluidos?.map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
              </CardContent></Card>
            ))}
            {!combos.length && <Card className="col-span-3"><CardContent className="py-8 text-center text-muted-foreground">Sin combos</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="garantias" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow>
              <TableHead>Paciente</TableHead><TableHead>Tipo</TableHead><TableHead>Duración</TableHead><TableHead>Vencimiento</TableHead><TableHead>Estado</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {garantias.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell>{g.pacientes ? `${g.pacientes.nombre} ${g.pacientes.apellido || ""}` : "—"}</TableCell>
                  <TableCell>{g.tipo}</TableCell>
                  <TableCell>{g.duracion_meses} meses</TableCell>
                  <TableCell>{g.fecha_vencimiento || "—"}</TableCell>
                  <TableCell><Badge variant={g.estado === "vigente" ? "default" : g.estado === "reclamada" ? "destructive" : "secondary"}>{g.estado}</Badge></TableCell>
                </TableRow>
              ))}
              {!garantias.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin garantías</TableCell></TableRow>}
            </TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordatorios.filter((r: any) => r.tipo === "examen_anual").length}</p><p className="text-xs text-muted-foreground">Examen anual</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordatorios.filter((r: any) => r.tipo === "promo").length}</p><p className="text-xs text-muted-foreground">Promos</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordatorios.filter((r: any) => r.tipo === "upgrade").length}</p><p className="text-xs text-muted-foreground">Upgrades</p></CardContent></Card>
          </div>
          <Card><Table>
            <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Tipo</TableHead><TableHead>Próxima fecha</TableHead><TableHead>Canal</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>
              {recordatorios.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido || ""}` : "—"}</TableCell>
                  <TableCell>{r.tipo?.replace(/_/g, " ")}</TableCell>
                  <TableCell>{r.proxima_fecha}</TableCell>
                  <TableCell><Badge variant="outline">{r.canal}</Badge></TableCell>
                  <TableCell><Badge variant={r.estado === "pendiente" ? "secondary" : "default"}>{r.estado}</Badge></TableCell>
                </TableRow>
              ))}
              {!recordatorios.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin recordatorios</TableCell></TableRow>}
            </TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="pacientes" className="mt-4"><VerticalPacientesTab /></TabsContent>
        <TabsContent value="citas" className="mt-4"><VerticalCitasTab citaLabel="Citas Oftalmológicas" /></TabsContent>
        <TabsContent value="personal" className="mt-4"><VerticalPersonalTab profesionalLabel="Doctores" especialidades={["Oftalmología", "Optometría", "Contactología", "Cirugía refractiva", "Glaucoma", "Retina"]} /></TabsContent>
        <TabsContent value="facturacion" className="mt-4"><VerticalFacturacionTab /></TabsContent>
        <TabsContent value="nomina" className="mt-4"><VerticalNominaTab /></TabsContent>
        <TabsContent value="sucursales" className="mt-4"><VerticalSucursalesTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="leads" className="mt-4"><VerticalLeadsCRMTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="marketing" className="mt-4"><VerticalMarketingTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="pagos_online" className="mt-4"><VerticalPagosTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="portal" className="mt-4"><VerticalPortalTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="bi" className="mt-4"><VerticalBITab verticalTipo="vision" /></TabsContent>
        <TabsContent value="telemedicina" className="mt-4"><VerticalTelemedicinaTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="recetas" className="mt-4"><VerticalRecetasTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="ecf" className="mt-4"><VerticalFacturacionElectronicaTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="integraciones" className="mt-4"><VerticalIntegracionesTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="inventario_v" className="mt-4"><VerticalInventarioTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="kpis" className="mt-4"><VerticalReportesKPITab verticalTipo="vision" /></TabsContent>
        <TabsContent value="onboarding" className="mt-4"><VerticalOnboardingTab verticalTipo="vision" /></TabsContent>
        <TabsContent value="pwa" className="mt-4"><VerticalPWATab /></TabsContent>
      </Tabs>
    </div>
  );
}
