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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Camera, CreditCard, Package, Users, CalendarDays, DollarSign, Calculator, Sofa, Crown, Image, Tag, Plus } from "lucide-react";
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
import VerticalRolesPermisosTab from "@/components/vertical/VerticalRolesPermisosTab";
import VerticalAgendaIATab from "@/components/vertical/VerticalAgendaIATab";
import VerticalComunicacionesTab from "@/components/vertical/VerticalComunicacionesTab";
import VerticalFinanzasAvanzadasTab from "@/components/vertical/VerticalFinanzasAvanzadasTab";
import VerticalDocumentosTab from "@/components/vertical/VerticalDocumentosTab";
import VerticalWorkflowsTab from "@/components/vertical/VerticalWorkflowsTab";
import VerticalIdiomaAccesibilidadTab from "@/components/vertical/VerticalIdiomaAccesibilidadTab";
import VerticalMarketplaceTab from "@/components/vertical/VerticalMarketplaceTab";
import VerticalTelemedicinaAvanzadaTab from "@/components/vertical/VerticalTelemedicinaAvanzadaTab";
import VerticalIAPredictivaTab from "@/components/vertical/VerticalIAPredictivaTab";
import VerticalIoTTab from "@/components/vertical/VerticalIoTTab";

const estadoLeadColor: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contactado: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  cita_agendada: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  evaluado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  presupuestado: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  convertido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  perdido: "bg-muted text-muted-foreground",
  reactivar: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const origenIcon: Record<string, string> = {
  instagram: "📸", whatsapp: "💬", meta_ads: "📢", google_ads: "🔍", tiktok: "🎵", web: "🌐", referido: "👥", llamada: "📞", otro: "📌",
};

const cabinaEstadoColor: Record<string, string> = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ocupada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  mantenimiento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  reservada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function AestheticPro() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [tab, setTab] = useState("leads");

  // Existing queries
  const { data: leads = [] } = useQuery({
    queryKey: ["leads_estetica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("leads_estetica" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: evaluaciones = [] } = useQuery({
    queryKey: ["evaluaciones_esteticas", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("evaluaciones_esteticas" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: procedimientos = [] } = useQuery({
    queryKey: ["procedimientos_esteticos", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("procedimientos_esteticos" as any).select("*").eq("workspace_id", wsId!).eq("activo", true).order("nombre"); return (data || []) as any[]; },
  });
  const { data: paquetes = [] } = useQuery({
    queryKey: ["paquetes_esteticos", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("paquetes_esteticos" as any).select("*").eq("workspace_id", wsId!).eq("activo", true).order("nombre"); return (data || []) as any[]; },
  });
  const { data: financiamientos = [] } = useQuery({
    queryKey: ["financiamiento_estetico", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("financiamiento_estetico" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(50); return (data || []) as any[]; },
  });

  // New queries
  const { data: cabinas = [], refetch: refetchCabinas } = useQuery({
    queryKey: ["cabinas_estetica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("cabinas_estetica" as any).select("*").eq("workspace_id", wsId!).order("nombre"); return (data || []) as any[]; },
  });
  const { data: membresias = [], refetch: refetchMembresias } = useQuery({
    queryKey: ["membresias_estetica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await (supabase.from("membresias_estetica") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: fotosEvol = [] } = useQuery({
    queryKey: ["fotos_evolucion", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await (supabase.from("fotos_evolucion") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("fecha_foto", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: promos = [], refetch: refetchPromos } = useQuery({
    queryKey: ["promociones_estetica", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("promociones_estetica" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }); return (data || []) as any[]; },
  });

  // Cabina form
  const [openCabina, setOpenCabina] = useState(false);
  const [cabinaForm, setCabinaForm] = useState({ nombre: "", tipo: "" });
  const crearCabina = async () => {
    if (!wsId || !cabinaForm.nombre) return;
    const { error } = await supabase.from("cabinas_estetica" as any).insert({ workspace_id: wsId, nombre: cabinaForm.nombre, tipo: cabinaForm.tipo || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Cabina creada");
    setOpenCabina(false);
    setCabinaForm({ nombre: "", tipo: "" });
    refetchCabinas();
  };

  // Promo form
  const [openPromo, setOpenPromo] = useState(false);
  const [promoForm, setPromoForm] = useState({ nombre: "", tipo_descuento: "porcentaje", valor_descuento: 0, codigo: "", vigencia_inicio: "", vigencia_fin: "" });
  const crearPromo = async () => {
    if (!wsId || !promoForm.nombre) return;
    const { error } = await supabase.from("promociones_estetica" as any).insert({
      workspace_id: wsId, ...promoForm,
      vigencia_inicio: promoForm.vigencia_inicio || null,
      vigencia_fin: promoForm.vigencia_fin || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Promoción creada");
    setOpenPromo(false);
    setPromoForm({ nombre: "", tipo_descuento: "porcentaje", valor_descuento: 0, codigo: "", vigencia_inicio: "", vigencia_fin: "" });
    refetchPromos();
  };

  // Stats
  const convertidos = leads.filter((l: any) => l.estado === "convertido").length;
  const tasaConversion = leads.length > 0 ? Math.round((convertidos / leads.length) * 100) : 0;
  const balancePendiente = financiamientos.reduce((s: number, f: any) => s + (f.balance_pendiente || 0), 0);
  const leadsIG = leads.filter((l: any) => l.origen === "instagram").length;
  const leadsTT = leads.filter((l: any) => l.origen === "tiktok").length;
  const leadsMeta = leads.filter((l: any) => l.origen === "meta_ads").length;
  const membActivas = membresias.filter((m: any) => m.estado === "activa").length;
  const cabinasDisp = cabinas.filter((c: any) => c.estado === "disponible").length;
  const promosActivas = promos.filter((p: any) => p.activa).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6" /> Aesthetic Pro
        </h1>
        <p className="text-muted-foreground">Cirugía estética, medicina estética, spa médico, depilación láser, centros corporales y faciales</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card><CardContent className="pt-3 text-center"><TrendingUp className="h-4 w-4 mx-auto mb-1 text-blue-500" /><p className="text-xl font-bold">{leads.length}</p><p className="text-[10px] text-muted-foreground">Leads</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><p className="text-xl font-bold text-green-600">{tasaConversion}%</p><p className="text-[10px] text-muted-foreground">Conversión</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Camera className="h-4 w-4 mx-auto mb-1 text-purple-500" /><p className="text-xl font-bold">{evaluaciones.length}</p><p className="text-[10px] text-muted-foreground">Evaluaciones</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Crown className="h-4 w-4 mx-auto mb-1 text-yellow-500" /><p className="text-xl font-bold">{membActivas}</p><p className="text-[10px] text-muted-foreground">Membresías</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Sofa className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{cabinasDisp}/{cabinas.length}</p><p className="text-[10px] text-muted-foreground">Cabinas disp.</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Package className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{paquetes.length}</p><p className="text-[10px] text-muted-foreground">Paquetes</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Tag className="h-4 w-4 mx-auto mb-1 text-pink-500" /><p className="text-xl font-bold">{promosActivas}</p><p className="text-[10px] text-muted-foreground">Promos</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><CreditCard className="h-4 w-4 mx-auto mb-1 text-orange-500" /><p className="text-xl font-bold">{fmt(balancePendiente)}</p><p className="text-[10px] text-muted-foreground">Por cobrar</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="leads">Leads CRM</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
          <TabsTrigger value="procedimientos">Procedimientos</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
          <TabsTrigger value="cabinas">Cabinas</TabsTrigger>
          <TabsTrigger value="membresias">Membresías</TabsTrigger>
          <TabsTrigger value="fotos">Fotos Evolución</TabsTrigger>
          <TabsTrigger value="promos">Promociones</TabsTrigger>
          <TabsTrigger value="financiamiento">Financiamiento</TabsTrigger>
          <TabsTrigger value="pacientes"><Users className="h-3.5 w-3.5 mr-1" />Clientes</TabsTrigger>
          <TabsTrigger value="citas"><CalendarDays className="h-3.5 w-3.5 mr-1" />Citas</TabsTrigger>
          <TabsTrigger value="personal"><Users className="h-3.5 w-3.5 mr-1" />Equipo</TabsTrigger>
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
          <TabsTrigger value="roles_permisos">Roles</TabsTrigger>
          <TabsTrigger value="agenda_ia">Agenda IA</TabsTrigger>
          <TabsTrigger value="comunicaciones">Comunicaciones</TabsTrigger>
          <TabsTrigger value="finanzas_avz">Finanzas</TabsTrigger>
          <TabsTrigger value="documentos_v">Documentos</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="idioma_acc">i18n / A11y</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="telemed_avz">Telemedicina Avz</TabsTrigger>
          <TabsTrigger value="ia_predictiva">IA Predictiva</TabsTrigger>
          <TabsTrigger value="iot">IoT</TabsTrigger>
        </TabsList>

        {/* LEADS CRM */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <Card><CardContent className="pt-3 text-center"><p className="text-lg font-bold">{leadsIG}</p><p className="text-xs text-muted-foreground">📸 Instagram</p></CardContent></Card>
            <Card><CardContent className="pt-3 text-center"><p className="text-lg font-bold">{leadsTT}</p><p className="text-xs text-muted-foreground">🎵 TikTok</p></CardContent></Card>
            <Card><CardContent className="pt-3 text-center"><p className="text-lg font-bold">{leadsMeta}</p><p className="text-xs text-muted-foreground">📢 Meta Ads</p></CardContent></Card>
            <Card><CardContent className="pt-3 text-center"><p className="text-lg font-bold">{leads.filter((l: any) => l.origen === "referido").length}</p><p className="text-xs text-muted-foreground">👥 Referidos</p></CardContent></Card>
          </div>
          {leads.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay leads</CardContent></Card>
          ) : leads.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{origenIcon[l.origen] || "📌"} {l.numero} — {l.nombre}</p>
                  <p className="text-sm text-muted-foreground">{l.procedimiento_interes || ""} {l.telefono ? `· ${l.telefono}` : ""}</p>
                </div>
                <Badge className={estadoLeadColor[l.estado] || ""}>{l.estado?.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* EVALUACIONES */}
        <TabsContent value="evaluaciones" className="space-y-3">
          {evaluaciones.map((e: any) => (
            <Card key={e.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{e.numero}</p>
                <p className="text-sm text-muted-foreground">{e.procedimiento_recomendado || ""} · IMC: {e.imc || "—"} {e.presupuesto ? ` · ${fmt(e.presupuesto)}` : ""}</p>
              </div>
              <Badge variant={e.estado === "aprobada" ? "default" : "secondary"}>{e.estado}</Badge>
            </CardContent></Card>
          ))}
          {!evaluaciones.length && <Card><CardContent className="py-8 text-center text-muted-foreground">Sin evaluaciones</CardContent></Card>}
        </TabsContent>

        {/* PROCEDIMIENTOS */}
        <TabsContent value="procedimientos" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedimientos.map((p: any) => (
            <Card key={p.id}><CardContent className="pt-4">
              <p className="font-medium">{p.nombre}</p>
              <Badge variant="outline" className="mt-1">{p.categoria}</Badge>
              <p className="text-sm text-muted-foreground mt-2">{p.duracion_minutos ? `${p.duracion_minutos} min` : ""} {p.dias_recuperacion ? `· ${p.dias_recuperacion} días recup.` : ""}</p>
              {p.precio_base && <p className="text-lg font-bold mt-1">{fmt(p.precio_base)}</p>}
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* PAQUETES */}
        <TabsContent value="paquetes" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paquetes.map((p: any) => (
            <Card key={p.id}><CardContent className="pt-4">
              <p className="font-bold text-lg">{p.nombre}</p>
              <div className="flex gap-2 mt-2">
                {p.precio_regular && <span className="text-sm line-through text-muted-foreground">{fmt(p.precio_regular)}</span>}
                {p.precio_paquete && <span className="text-lg font-bold text-green-600">{fmt(p.precio_paquete)}</span>}
              </div>
              {p.descripcion && <p className="text-sm text-muted-foreground mt-2">{p.descripcion}</p>}
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* CABINAS */}
        <TabsContent value="cabinas" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCabina} onOpenChange={setOpenCabina}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva cabina</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Agregar cabina</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre</Label><Input value={cabinaForm.nombre} onChange={e => setCabinaForm({ ...cabinaForm, nombre: e.target.value })} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={cabinaForm.tipo} onValueChange={v => setCabinaForm({ ...cabinaForm, tipo: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facial">Facial</SelectItem>
                        <SelectItem value="corporal">Corporal</SelectItem>
                        <SelectItem value="laser">Láser</SelectItem>
                        <SelectItem value="cirugia">Cirugía</SelectItem>
                        <SelectItem value="mixta">Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={crearCabina}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cabinas.map((c: any) => (
              <Card key={c.id}><CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Sofa className="h-5 w-5 text-primary" /><p className="font-medium">{c.nombre}</p></div>
                  <Badge className={cabinaEstadoColor[c.estado] || ""}>{c.estado}</Badge>
                </div>
                {c.tipo && <Badge variant="outline" className="mt-2">{c.tipo}</Badge>}
                {c.equipos?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{c.equipos.join(", ")}</p>}
              </CardContent></Card>
            ))}
            {!cabinas.length && <Card className="col-span-3"><CardContent className="py-8 text-center text-muted-foreground">Sin cabinas</CardContent></Card>}
          </div>
        </TabsContent>

        {/* MEMBRESÍAS */}
        <TabsContent value="membresias" className="mt-4 space-y-4">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Número</TableHead><TableHead>Cliente</TableHead><TableHead>Plan</TableHead><TableHead>Sesiones</TableHead><TableHead>Vigencia</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {membresias.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.numero}</TableCell>
                    <TableCell>{m.pacientes ? `${m.pacientes.nombre} ${m.pacientes.apellido || ""}` : "—"}</TableCell>
                    <TableCell className="font-medium">{m.plan_nombre}</TableCell>
                    <TableCell>{m.sesiones_usadas}/{m.sesiones_incluidas}</TableCell>
                    <TableCell className="text-xs">{m.fecha_inicio} → {m.fecha_fin || "∞"}</TableCell>
                    <TableCell><Badge variant={m.estado === "activa" ? "default" : "secondary"}>{m.estado}</Badge></TableCell>
                  </TableRow>
                ))}
                {!membresias.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin membresías</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* FOTOS EVOLUCIÓN */}
        <TabsContent value="fotos" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fotosEvol.map((f: any) => (
              <Card key={f.id}><CardContent className="pt-3 text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Badge variant="outline" className="mb-1">{f.tipo}</Badge>
                <p className="text-xs font-medium">{f.procedimiento || "Sin procedimiento"}</p>
                <p className="text-[10px] text-muted-foreground">{f.pacientes ? `${f.pacientes.nombre}` : ""} · {f.fecha_foto}</p>
                {f.consentimiento_uso && <Badge variant="default" className="mt-1 text-[10px]">Consentimiento ✓</Badge>}
              </CardContent></Card>
            ))}
            {!fotosEvol.length && <Card className="col-span-4"><CardContent className="py-8 text-center text-muted-foreground">Sin fotos de evolución</CardContent></Card>}
          </div>
        </TabsContent>

        {/* PROMOCIONES */}
        <TabsContent value="promos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPromo} onOpenChange={setOpenPromo}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva promo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva promoción</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre</Label><Input value={promoForm.nombre} onChange={e => setPromoForm({ ...promoForm, nombre: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo descuento</Label>
                      <Select value={promoForm.tipo_descuento} onValueChange={v => setPromoForm({ ...promoForm, tipo_descuento: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="porcentaje">Porcentaje</SelectItem>
                          <SelectItem value="monto_fijo">Monto fijo</SelectItem>
                          <SelectItem value="paquete">Paquete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Valor</Label><Input type="number" value={promoForm.valor_descuento} onChange={e => setPromoForm({ ...promoForm, valor_descuento: +e.target.value })} /></div>
                  </div>
                  <div><Label>Código</Label><Input value={promoForm.codigo} onChange={e => setPromoForm({ ...promoForm, codigo: e.target.value })} placeholder="Ej: VERANO25" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Inicio</Label><Input type="date" value={promoForm.vigencia_inicio} onChange={e => setPromoForm({ ...promoForm, vigencia_inicio: e.target.value })} /></div>
                    <div><Label>Fin</Label><Input type="date" value={promoForm.vigencia_fin} onChange={e => setPromoForm({ ...promoForm, vigencia_fin: e.target.value })} /></div>
                  </div>
                  <Button onClick={crearPromo}>Crear promoción</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nombre</TableHead><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vigencia</TableHead><TableHead>Usos</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {promos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="font-mono text-xs">{p.codigo || "—"}</TableCell>
                    <TableCell>{p.tipo_descuento}</TableCell>
                    <TableCell className="text-right">{p.tipo_descuento === "porcentaje" ? `${p.valor_descuento}%` : fmt(p.valor_descuento)}</TableCell>
                    <TableCell className="text-xs">{p.vigencia_inicio || "—"} → {p.vigencia_fin || "∞"}</TableCell>
                    <TableCell>{p.usos_actuales}{p.usos_maximos ? `/${p.usos_maximos}` : ""}</TableCell>
                    <TableCell><Badge variant={p.activa ? "default" : "secondary"}>{p.activa ? "Activa" : "Inactiva"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!promos.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin promociones</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* FINANCIAMIENTO */}
        <TabsContent value="financiamiento" className="space-y-3">
          {financiamientos.map((f: any) => (
            <Card key={f.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{f.numero} — {f.procedimiento || "Procedimiento"}</p>
                <p className="text-sm text-muted-foreground">Total: {fmt(f.monto_total)} · {f.numero_cuotas} cuotas · Balance: {fmt(f.balance_pendiente || 0)}</p>
              </div>
              <Badge variant={f.estado === "pagado" ? "default" : f.estado === "vencido" ? "destructive" : "secondary"}>{f.estado}</Badge>
            </CardContent></Card>
          ))}
          {!financiamientos.length && <Card><CardContent className="py-8 text-center text-muted-foreground">Sin financiamientos</CardContent></Card>}
        </TabsContent>

        {/* SHARED CLINIC TABS */}
        <TabsContent value="pacientes" className="mt-4"><VerticalPacientesTab pacienteLabel="Clientes" /></TabsContent>
        <TabsContent value="citas" className="mt-4"><VerticalCitasTab citaLabel="Citas Estéticas" /></TabsContent>
        <TabsContent value="personal" className="mt-4"><VerticalPersonalTab profesionalLabel="Enfermeras / Terapeutas" especialidades={["Masaje linfático", "Radiofrecuencia", "Cavitación", "Limpieza facial", "Depilación láser", "Estética corporal", "Estética facial", "Botox/Fillers", "Cirugía estética", "Hilos tensores"]} /></TabsContent>
        <TabsContent value="facturacion" className="mt-4"><VerticalFacturacionTab /></TabsContent>
        <TabsContent value="nomina" className="mt-4"><VerticalNominaTab /></TabsContent>
        <TabsContent value="sucursales" className="mt-4"><VerticalSucursalesTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="leads" className="mt-4"><VerticalLeadsCRMTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="marketing" className="mt-4"><VerticalMarketingTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="pagos_online" className="mt-4"><VerticalPagosTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="portal" className="mt-4"><VerticalPortalTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="bi" className="mt-4"><VerticalBITab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="telemedicina" className="mt-4"><VerticalTelemedicinaTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="recetas" className="mt-4"><VerticalRecetasTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="ecf" className="mt-4"><VerticalFacturacionElectronicaTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="integraciones" className="mt-4"><VerticalIntegracionesTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="inventario_v" className="mt-4"><VerticalInventarioTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="kpis" className="mt-4"><VerticalReportesKPITab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="onboarding" className="mt-4"><VerticalOnboardingTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="pwa" className="mt-4"><VerticalPWATab /></TabsContent>
        <TabsContent value="roles_permisos" className="mt-4"><VerticalRolesPermisosTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="agenda_ia" className="mt-4"><VerticalAgendaIATab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="comunicaciones" className="mt-4"><VerticalComunicacionesTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="finanzas_avz" className="mt-4"><VerticalFinanzasAvanzadasTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="documentos_v" className="mt-4"><VerticalDocumentosTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="workflows" className="mt-4"><VerticalWorkflowsTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="idioma_acc" className="mt-4"><VerticalIdiomaAccesibilidadTab /></TabsContent>
        <TabsContent value="marketplace" className="mt-4"><VerticalMarketplaceTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="telemed_avz" className="mt-4"><VerticalTelemedicinaAvanzadaTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="ia_predictiva" className="mt-4"><VerticalIAPredictivaTab verticalTipo="estetica" /></TabsContent>
        <TabsContent value="iot" className="mt-4"><VerticalIoTTab verticalTipo="estetica" /></TabsContent>
      </Tabs>
    </div>
  );
}
