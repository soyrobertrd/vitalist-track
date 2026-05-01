import { useState } from "react";
import { useTabParam } from "@/hooks/useTabParam";
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
import { SmilePlus, ClipboardList, FlaskConical, Users, CalendarDays, DollarSign, Calculator, Armchair, Percent, Smile, Bell, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import VerticalCamasTab from "@/components/vertical/VerticalCamasTab";
import VerticalReportesRegulatoriosTab from "@/components/vertical/VerticalReportesRegulatoriosTab";
import VerticalCRMFidelizacionTab from "@/components/vertical/VerticalCRMFidelizacionTab";
import VerticalAPIGatewayTab from "@/components/vertical/VerticalAPIGatewayTab";

const estadoPlanColor: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  presentado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  en_progreso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completado: "bg-primary/10 text-primary",
  cancelado: "bg-destructive/10 text-destructive",
};

const estadoOrdenColor: Record<string, string> = {
  solicitada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_proceso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  lista: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  entregada: "bg-muted text-muted-foreground",
  devuelta: "bg-destructive/10 text-destructive",
};

const estadoPresupColor: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  presentado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rechazado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  en_progreso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completado: "bg-primary/10 text-primary",
};

export default function DentalCarePro() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [tab, setTab] = useTabParam("planes");

  const { data: planes = [] } = useQuery({
    queryKey: ["planes_tratamiento_dental", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("planes_tratamiento_dental" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: controles = [] } = useQuery({
    queryKey: ["controles_ortodoncia", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("controles_ortodoncia" as any).select("*").eq("workspace_id", wsId!).order("fecha", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_laboratorio_dental", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("ordenes_laboratorio_dental" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: sillones = [], refetch: refetchSillones } = useQuery({
    queryKey: ["sillones_dentales", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("sillones_dentales" as any).select("*").eq("workspace_id", wsId!).order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: comisiones = [], refetch: refetchComisiones } = useQuery({
    queryKey: ["comisiones_profesional", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("comisiones_profesional") as any).select("*, personal_salud(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: presupuestosSonrisa = [], refetch: refetchPresupuestos } = useQuery({
    queryKey: ["presupuestos_sonrisa", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("presupuestos_sonrisa") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: recordatorios = [], refetch: refetchRecordatorios } = useQuery({
    queryKey: ["recordatorios_fidelizacion_dental", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("recordatorios_fidelizacion") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("proxima_fecha").limit(200);
      return (data || []) as any[];
    },
  });

  const [openSillon, setOpenSillon] = useState(false);
  const [sillonForm, setSillonForm] = useState({ nombre: "", ubicacion: "" });

  const crearSillon = async () => {
    if (!wsId || !sillonForm.nombre) return;
    const { error } = await supabase.from("sillones_dentales" as any).insert({ workspace_id: wsId, ...sillonForm });
    if (error) { toast.error(error.message); return; }
    toast.success("Sillón agregado");
    setOpenSillon(false);
    setSillonForm({ nombre: "", ubicacion: "" });
    refetchSillones();
  };

  const [openPresup, setOpenPresup] = useState(false);
  const [presupForm, setPresupForm] = useState({ paciente_id: "", monto_total: 0, notas: "" });

  const { data: pacientesCombo = [] } = useQuery({
    queryKey: ["pacientes_dental_combo", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("pacientes") as any).select("id, nombre, apellido").eq("workspace_id", wsId!).eq("activo", true).order("nombre").limit(500);
      return (data || []) as any[];
    },
  });

  const crearPresupuesto = async () => {
    if (!wsId || !presupForm.monto_total) return;
    const { error } = await supabase.from("presupuestos_sonrisa" as any).insert({
      workspace_id: wsId,
      paciente_id: presupForm.paciente_id || null,
      monto_total: presupForm.monto_total,
      notas: presupForm.notas || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Presupuesto creado");
    setOpenPresup(false);
    setPresupForm({ paciente_id: "", monto_total: 0, notas: "" });
    refetchPresupuestos();
  };

  const planesActivos = planes.filter((p: any) => ["aprobado", "en_progreso"].includes(p.estado)).length;
  const ordenesPendientes = ordenes.filter((o: any) => !["entregada", "devuelta"].includes(o.estado)).length;
  const sillonActivos = sillones.filter((s: any) => s.activo).length;
  const presupAprobados = presupuestosSonrisa.filter((p: any) => p.estado === "aprobado" || p.estado === "en_progreso").length;
  const recordPendientes = recordatorios.filter((r: any) => r.estado === "pendiente").length;
  const cuotasPendientes = controles.filter((c: any) => !c.pagado).reduce((s: number, c: any) => s + (c.pago_mensual || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SmilePlus className="h-6 w-6" /> DentalCare Pro
        </h1>
        <p className="text-muted-foreground">Gestión integral dental — General, Ortodoncia, Implantología, Endodoncia, Odontopediatría</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <ClipboardList className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{planesActivos}</p>
          <p className="text-xs text-muted-foreground">Planes activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{controles.length}</p>
          <p className="text-xs text-muted-foreground">Controles ortodoncia</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FlaskConical className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{ordenesPendientes}</p>
          <p className="text-xs text-muted-foreground">Lab pendiente</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Armchair className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{sillonActivos}</p>
          <p className="text-xs text-muted-foreground">Sillones</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{fmt(cuotasPendientes)}</p>
          <p className="text-xs text-muted-foreground">Cuotas pendientes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Bell className="h-5 w-5 mx-auto mb-1 text-orange-500" />
          <p className="text-2xl font-bold">{recordPendientes}</p>
          <p className="text-xs text-muted-foreground">Recordatorios</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="planes">Tratamientos</TabsTrigger>
          <TabsTrigger value="ortodoncia">Ortodoncia</TabsTrigger>
          <TabsTrigger value="laboratorio">Laboratorio</TabsTrigger>
          <TabsTrigger value="sillones">Sillones</TabsTrigger>
          <TabsTrigger value="presupuestos">Presup. Sonrisa</TabsTrigger>
          <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
          <TabsTrigger value="recordatorios">Fidelización</TabsTrigger>
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
          <TabsTrigger value="camas">Camas</TabsTrigger>
          <TabsTrigger value="regulatorio">Regulatorio</TabsTrigger>
          <TabsTrigger value="crm_fideliz">CRM / Fidelización</TabsTrigger>
          <TabsTrigger value="api_gateway">API Gateway</TabsTrigger>
        </TabsList>

        <TabsContent value="planes" className="space-y-3">
          {planes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay planes de tratamiento</CardContent></Card>
          ) : planes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    Presupuesto: {fmt(p.presupuesto_total || 0)} · {p.numero_cuotas} cuotas
                  </p>
                  {p.notas && <p className="text-xs text-muted-foreground">{p.notas}</p>}
                </div>
                <Badge className={estadoPlanColor[p.estado] || ""}>{p.estado?.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ortodoncia" className="space-y-3">
          {controles.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay controles de ortodoncia</CardContent></Card>
          ) : controles.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{format(new Date(c.fecha + "T12:00:00"), "dd/MM/yyyy", { locale: es })}</p>
                  <p className="text-sm text-muted-foreground">
                    Progreso: {c.progreso_porcentaje}% {c.cambio_ligas ? "· Cambio ligas ✓" : ""} {c.tipo_arco ? `· ${c.tipo_arco}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  {c.pago_mensual && <p className="text-sm font-medium">{fmt(c.pago_mensual)}</p>}
                  <Badge variant={c.pagado ? "default" : "secondary"}>{c.pagado ? "Pagado" : "Pendiente"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="laboratorio" className="space-y-3">
          {ordenes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay órdenes de laboratorio</CardContent></Card>
          ) : ordenes.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.numero} — {o.tipo}</p>
                  <p className="text-sm text-muted-foreground">{o.diente ? `Diente: ${o.diente}` : ""} · {o.material || ""} · {o.laboratorio || ""}</p>
                </div>
                <Badge className={estadoOrdenColor[o.estado] || ""}>{o.estado?.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sillones" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openSillon} onOpenChange={setOpenSillon}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo sillón</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Agregar sillón dental</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre (ej: Sillón 1)</Label><Input value={sillonForm.nombre} onChange={e => setSillonForm({ ...sillonForm, nombre: e.target.value })} /></div>
                  <div><Label>Ubicación</Label><Input value={sillonForm.ubicacion} onChange={e => setSillonForm({ ...sillonForm, ubicacion: e.target.value })} /></div>
                  <Button onClick={crearSillon}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sillones.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Armchair className="h-5 w-5 text-primary" />
                      <p className="font-medium">{s.nombre}</p>
                    </div>
                    <Badge variant={s.activo ? "default" : "secondary"}>{s.activo ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  {s.ubicacion && <p className="text-sm text-muted-foreground mt-1">{s.ubicacion}</p>}
                  {s.equipamiento?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{s.equipamiento.join(", ")}</p>}
                </CardContent>
              </Card>
            ))}
            {!sillones.length && <Card className="col-span-3"><CardContent className="py-8 text-center text-muted-foreground">Sin sillones registrados</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="presupuestos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPresup} onOpenChange={setOpenPresup}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo presupuesto</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cotización sonrisa</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Paciente</Label>
                    <Select value={presupForm.paciente_id} onValueChange={v => setPresupForm({ ...presupForm, paciente_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{pacientesCombo.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido || ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Monto total</Label><Input type="number" value={presupForm.monto_total} onChange={e => setPresupForm({ ...presupForm, monto_total: +e.target.value })} /></div>
                  <div><Label>Notas</Label><Input value={presupForm.notas} onChange={e => setPresupForm({ ...presupForm, notas: e.target.value })} /></div>
                  <Button onClick={crearPresupuesto}>Crear presupuesto</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Número</TableHead><TableHead>Paciente</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead><TableHead>Firma</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {presupuestosSonrisa.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.numero}</TableCell>
                    <TableCell>{p.pacientes ? `${p.pacientes.nombre} ${p.pacientes.apellido || ""}` : "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(p.monto_total)}</TableCell>
                    <TableCell><Badge className={estadoPresupColor[p.estado] || ""}>{p.estado}</Badge></TableCell>
                    <TableCell>{p.firma_digital_url ? "✅ Firmado" : "—"}</TableCell>
                  </TableRow>
                ))}
                {!presupuestosSonrisa.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin presupuestos</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="comisiones" className="mt-4 space-y-4">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Doctor</TableHead><TableHead>Tipo procedimiento</TableHead><TableHead className="text-right">Porcentaje</TableHead><TableHead className="text-right">Monto fijo</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {comisiones.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.personal_salud ? `${c.personal_salud.nombre} ${c.personal_salud.apellido || ""}` : "—"}</TableCell>
                    <TableCell>{c.tipo_procedimiento || "General"}</TableCell>
                    <TableCell className="text-right">{c.porcentaje}%</TableCell>
                    <TableCell className="text-right">{fmt(c.monto_fijo || 0)}</TableCell>
                    <TableCell><Badge variant={c.activo ? "default" : "secondary"}>{c.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!comisiones.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin comisiones configuradas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="recordatorios" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordatorios.filter((r: any) => r.tipo === "limpieza_semestral").length}</p><p className="text-xs text-muted-foreground">Limpiezas 6m</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordatorios.filter((r: any) => r.tipo === "reactivacion").length}</p><p className="text-xs text-muted-foreground">Reactivaciones</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordatorios.filter((r: any) => r.tipo === "control_ortodoncia").length}</p><p className="text-xs text-muted-foreground">Controles orto</p></CardContent></Card>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Paciente</TableHead><TableHead>Tipo</TableHead><TableHead>Próxima fecha</TableHead><TableHead>Canal</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recordatorios.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido || ""}` : "—"}</TableCell>
                    <TableCell>{r.tipo?.replace(/_/g, " ")}</TableCell>
                    <TableCell>{r.proxima_fecha}</TableCell>
                    <TableCell><Badge variant="outline">{r.canal}</Badge></TableCell>
                    <TableCell><Badge variant={r.estado === "pendiente" ? "secondary" : "default"}>{r.estado}</Badge></TableCell>
                  </TableRow>
                ))}
                {!recordatorios.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin recordatorios</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pacientes" className="mt-4"><VerticalPacientesTab /></TabsContent>
        <TabsContent value="citas" className="mt-4"><VerticalCitasTab citaLabel="Citas Dentales" /></TabsContent>
        <TabsContent value="personal" className="mt-4"><VerticalPersonalTab profesionalLabel="Doctores" especialidades={["Odontología general", "Ortodoncia", "Endodoncia", "Periodoncia", "Cirugía oral", "Prostodoncia", "Odontopediatría", "Implantología"]} /></TabsContent>
        <TabsContent value="facturacion" className="mt-4"><VerticalFacturacionTab /></TabsContent>
        <TabsContent value="nomina" className="mt-4"><VerticalNominaTab /></TabsContent>
        <TabsContent value="sucursales" className="mt-4"><VerticalSucursalesTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="leads" className="mt-4"><VerticalLeadsCRMTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="marketing" className="mt-4"><VerticalMarketingTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="pagos_online" className="mt-4"><VerticalPagosTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="portal" className="mt-4"><VerticalPortalTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="bi" className="mt-4"><VerticalBITab verticalTipo="dental" /></TabsContent>
        <TabsContent value="telemedicina" className="mt-4"><VerticalTelemedicinaTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="recetas" className="mt-4"><VerticalRecetasTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="ecf" className="mt-4"><VerticalFacturacionElectronicaTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="integraciones" className="mt-4"><VerticalIntegracionesTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="inventario_v" className="mt-4"><VerticalInventarioTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="kpis" className="mt-4"><VerticalReportesKPITab verticalTipo="dental" /></TabsContent>
        <TabsContent value="onboarding" className="mt-4"><VerticalOnboardingTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="pwa" className="mt-4"><VerticalPWATab /></TabsContent>
        <TabsContent value="roles_permisos" className="mt-4"><VerticalRolesPermisosTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="agenda_ia" className="mt-4"><VerticalAgendaIATab verticalTipo="dental" /></TabsContent>
        <TabsContent value="comunicaciones" className="mt-4"><VerticalComunicacionesTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="finanzas_avz" className="mt-4"><VerticalFinanzasAvanzadasTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="documentos_v" className="mt-4"><VerticalDocumentosTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="workflows" className="mt-4"><VerticalWorkflowsTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="idioma_acc" className="mt-4"><VerticalIdiomaAccesibilidadTab /></TabsContent>
        <TabsContent value="marketplace" className="mt-4"><VerticalMarketplaceTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="telemed_avz" className="mt-4"><VerticalTelemedicinaAvanzadaTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="ia_predictiva" className="mt-4"><VerticalIAPredictivaTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="iot" className="mt-4"><VerticalIoTTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="camas" className="mt-4"><VerticalCamasTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="regulatorio" className="mt-4"><VerticalReportesRegulatoriosTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="crm_fideliz" className="mt-4"><VerticalCRMFidelizacionTab verticalTipo="dental" /></TabsContent>
        <TabsContent value="api_gateway" className="mt-4"><VerticalAPIGatewayTab verticalTipo="dental" /></TabsContent>
      </Tabs>
    </div>
  );
}
