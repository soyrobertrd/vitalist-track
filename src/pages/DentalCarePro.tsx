import { Link } from "react-router-dom";
import { useState } from "react";
import { useTabParam } from "@/hooks/useTabParam";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
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
import { SmilePlus, ClipboardList, FlaskConical, Users, CalendarDays, DollarSign, Calculator, Armchair, Percent, Smile, Bell, Plus, Sparkles, ArrowRight, Stethoscope, Shield } from "lucide-react";
import ConsentimientoDental from "@/components/dental/ConsentimientoDental";
import TrazabilidadLaboratorioDental from "@/components/dental/TrazabilidadLaboratorioDental";
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
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

const estadoPlanColor: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  presentado: "bg-primary/10 text-primary border-primary/20",
  aprobado: "bg-success/15 text-success border-success/30",
  en_progreso: "bg-warning/15 text-warning border-warning/30",
  completado: "bg-primary/15 text-primary border-primary/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
};

const estadoOrdenColor: Record<string, string> = {
  solicitada: "bg-primary/10 text-primary border-primary/20",
  en_proceso: "bg-warning/15 text-warning border-warning/30",
  lista: "bg-success/15 text-success border-success/30",
  entregada: "bg-muted text-muted-foreground",
  devuelta: "bg-destructive/15 text-destructive border-destructive/30",
};

const estadoPresupColor: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  presentado: "bg-primary/10 text-primary border-primary/20",
  aprobado: "bg-success/15 text-success border-success/30",
  rechazado: "bg-destructive/15 text-destructive border-destructive/30",
  en_progreso: "bg-warning/15 text-warning border-warning/30",
  completado: "bg-primary/15 text-primary border-primary/30",
};

/**
 * Guarda de ruta: se resuelve ANTES de montar el componente real para no
 * llamar hooks de forma condicional (rules-of-hooks).
 */
export default function DentalCarePro() {
  return <DentalCareProContent />;
}

function DentalCareProContent() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [tab, setTab] = useTabParam("resumen");
  const isResumen = !tab || tab === "resumen";

  const { data: planes = [] } = useQuery({
    queryKey: ["planes_tratamiento_dental", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await db.from("planes_tratamiento_dental" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: controles = [] } = useQuery({
    queryKey: ["controles_ortodoncia", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await db.from("controles_ortodoncia" as any).select("*").eq("workspace_id", wsId!).order("fecha", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_laboratorio_dental", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await db.from("ordenes_laboratorio_dental" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: sillones = [], refetch: refetchSillones } = useQuery({
    queryKey: ["sillones_dentales", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await db.from("sillones_dentales" as any).select("*").eq("workspace_id", wsId!).order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: comisiones = [], refetch: refetchComisiones } = useQuery({
    queryKey: ["comisiones_profesional", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (db.from("comisiones_profesional") as any).select("*, personal_salud(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: presupuestosSonrisa = [], refetch: refetchPresupuestos } = useQuery({
    queryKey: ["presupuestos_sonrisa", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (db.from("presupuestos_sonrisa") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: recordatorios = [], refetch: refetchRecordatorios } = useQuery({
    queryKey: ["recordatorios_fidelizacion_dental", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (db.from("recordatorios_fidelizacion") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("proxima_fecha").limit(200);
      return (data || []) as any[];
    },
  });

  const [openSillon, setOpenSillon] = useState(false);
  const [sillonForm, setSillonForm] = useState({ nombre: "", ubicacion: "" });

  const crearSillon = async () => {
    if (!wsId || !sillonForm.nombre) return;
    const { error } = await db.from("sillones_dentales" as any).insert({ workspace_id: wsId, ...sillonForm });
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
      const { data } = await (db.from("pacientes") as any).select("id, nombre, apellido").eq("workspace_id", wsId!).eq("status_px", "activo").order("nombre").limit(500);
      return (data || []) as any[];
    },
  });

  const crearPresupuesto = async () => {
    if (!wsId || !presupForm.monto_total) return;
    const { error } = await db.from("presupuestos_sonrisa" as any).insert({
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ClinicalPageHeader title="DentalCare Pro" subtitle="Gestión integral dental — General, Ortodoncia, Implantología, Endodoncia, Odontopediatría" icon={SmilePlus} />
        <div className="flex items-center gap-2.5">
          <Button variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-2 shadow-none" asChild>
            <Link to="/odontograma">
              <Sparkles className="h-4 w-4" /> Odontograma Digital
            </Link>
          </Button>
          <Button className="rounded-xl gap-2 shadow-none" onClick={() => setOpenPresup(true)}>
            <Plus className="h-4 w-4" /> Nuevo Presupuesto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="rounded-2xl border-border/80 shadow-none hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{planesActivos}</p>
              <p className="text-xs text-muted-foreground mt-1">Planes activos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Smile className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{controles.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Controles orto</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{ordenesPendientes}</p>
              <p className="text-xs text-muted-foreground mt-1">Lab pendiente</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Armchair className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{sillonActivos}</p>
              <p className="text-xs text-muted-foreground mt-1">Sillones</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none hover:border-rose-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none text-rose-600 dark:text-rose-400">{fmt(cuotasPendientes)}</p>
              <p className="text-xs text-muted-foreground mt-1">Cuotas pend.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none hover:border-blue-500/40 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{recordPendientes}</p>
              <p className="text-xs text-muted-foreground mt-1">Recordatorios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab || "resumen"} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full flex justify-start gap-1 overflow-x-auto p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="resumen" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Resumen</TabsTrigger>
          <TabsTrigger value="planes" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Tratamientos</TabsTrigger>
          <TabsTrigger value="ortodoncia" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Ortodoncia</TabsTrigger>
          <TabsTrigger value="laboratorio" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Laboratorio CAD/CAM</TabsTrigger>
          <TabsTrigger value="consentimiento" className="rounded-xl px-3.5 py-1.5 text-xs font-medium"><Shield className="h-3.5 w-3.5 mr-1" />Consentimiento</TabsTrigger>
          <TabsTrigger value="sillones" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Sillones</TabsTrigger>
          <TabsTrigger value="presupuestos" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Presup. Sonrisa</TabsTrigger>
          <TabsTrigger value="comisiones" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Comisiones</TabsTrigger>
          <TabsTrigger value="recordatorios" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Fidelización</TabsTrigger>
          <TabsTrigger value="pacientes" className="rounded-xl px-3.5 py-1.5 text-xs font-medium"><Users className="h-3.5 w-3.5 mr-1" />Pacientes</TabsTrigger>
          <TabsTrigger value="citas" className="rounded-xl px-3.5 py-1.5 text-xs font-medium"><CalendarDays className="h-3.5 w-3.5 mr-1" />Citas</TabsTrigger>
          <TabsTrigger value="personal" className="rounded-xl px-3.5 py-1.5 text-xs font-medium"><Users className="h-3.5 w-3.5 mr-1" />Doctores</TabsTrigger>
          <TabsTrigger value="facturacion" className="rounded-xl px-3.5 py-1.5 text-xs font-medium"><DollarSign className="h-3.5 w-3.5 mr-1" />Facturación</TabsTrigger>
          <TabsTrigger value="nomina" className="rounded-xl px-3.5 py-1.5 text-xs font-medium"><Calculator className="h-3.5 w-3.5 mr-1" />Nómina</TabsTrigger>
          <TabsTrigger value="sucursales" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Sucursales</TabsTrigger>
          <TabsTrigger value="leads" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">CRM Leads</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Marketing</TabsTrigger>
          <TabsTrigger value="pagos_online" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Pagos Online</TabsTrigger>
          <TabsTrigger value="portal" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Portal</TabsTrigger>
          <TabsTrigger value="bi" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">BI</TabsTrigger>
          <TabsTrigger value="telemedicina" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Telemedicina</TabsTrigger>
          <TabsTrigger value="recetas" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Recetas</TabsTrigger>
          <TabsTrigger value="ecf" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">e-CF / DGII</TabsTrigger>
          <TabsTrigger value="integraciones" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Integraciones</TabsTrigger>
          <TabsTrigger value="inventario_v" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Inventario</TabsTrigger>
          <TabsTrigger value="kpis" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">KPIs</TabsTrigger>
          <TabsTrigger value="onboarding" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Setup</TabsTrigger>
          <TabsTrigger value="pwa" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">PWA</TabsTrigger>
          <TabsTrigger value="roles_permisos" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Roles</TabsTrigger>
          <TabsTrigger value="agenda_ia" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Agenda IA</TabsTrigger>
          <TabsTrigger value="comunicaciones" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Comunicaciones</TabsTrigger>
          <TabsTrigger value="finanzas_avz" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Finanzas</TabsTrigger>
          <TabsTrigger value="documentos_v" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Documentos</TabsTrigger>
          <TabsTrigger value="workflows" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Workflows</TabsTrigger>
          <TabsTrigger value="idioma_acc" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">i18n / A11y</TabsTrigger>
          <TabsTrigger value="marketplace" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Marketplace</TabsTrigger>
          <TabsTrigger value="telemed_avz" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Telemedicina Avz</TabsTrigger>
          <TabsTrigger value="ia_predictiva" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">IA Predictiva</TabsTrigger>
          <TabsTrigger value="iot" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">IoT</TabsTrigger>
          <TabsTrigger value="camas" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Camas</TabsTrigger>
          <TabsTrigger value="regulatorio" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">Regulatorio</TabsTrigger>
          <TabsTrigger value="crm_fideliz" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">CRM / Fidelización</TabsTrigger>
          <TabsTrigger value="api_gateway" className="rounded-xl px-3.5 py-1.5 text-xs font-medium">API Gateway</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border/80 shadow-none md:col-span-2">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Odontograma Digital Interactivo
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Inspecciona la dentición permanente o temporal, registra caries, obturaciones, coronas y endodoncias por superficie dental.
                    </p>
                  </div>
                  <Button className="rounded-xl gap-2 shrink-0 shadow-none" asChild>
                    <Link to="/odontograma">
                      Abrir Odontograma <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-border/70">
                  <button onClick={() => setTab("planes")} className="p-3 text-left rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors">
                    <p className="text-xs font-medium text-foreground">Tratamientos</p>
                    <p className="text-[11px] text-muted-foreground">{planesActivos} planes activos</p>
                  </button>
                  <button onClick={() => setTab("ortodoncia")} className="p-3 text-left rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors">
                    <p className="text-xs font-medium text-foreground">Ortodoncia</p>
                    <p className="text-[11px] text-muted-foreground">{controles.length} controles</p>
                  </button>
                  <button onClick={() => setTab("laboratorio")} className="p-3 text-left rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors">
                    <p className="text-xs font-medium text-foreground">Laboratorio</p>
                    <p className="text-[11px] text-muted-foreground">{ordenesPendientes} órdenes</p>
                  </button>
                  <button onClick={() => setTab("presupuestos")} className="p-3 text-left rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors">
                    <p className="text-xs font-medium text-foreground">Cotizaciones</p>
                    <p className="text-[11px] text-muted-foreground">{presupuestosSonrisa.length} registradas</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Armchair className="h-4 w-4 text-primary" /> Sillones Dentales
                    </h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg px-2" onClick={() => setTab("sillones")}>
                      Ver todos
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {sillones.slice(0, 3).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${s.activo ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                          <span className="text-xs font-medium">{s.nombre}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] rounded-full px-2 py-0.5 ${s.activo ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-muted-foreground"}`}>
                          {s.activo ? "Operativo" : "Inactivo"}
                        </Badge>
                      </div>
                    ))}
                    {!sillones.length && (
                      <p className="text-xs text-muted-foreground text-center py-4">Sin sillones configurados</p>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3 rounded-xl border-dashed border-border text-xs" onClick={() => setOpenSillon(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar sillón
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planes" className="space-y-3">
          {planes.length === 0 ? (
            <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="py-8 text-center text-muted-foreground">No hay planes de tratamiento</CardContent></Card>
          ) : planes.map((p: any) => (
            <Card key={p.id} className="rounded-2xl border-border/80 shadow-none hover:border-primary/40 transition-colors">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{p.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    Presupuesto: {fmt(p.presupuesto_total || 0)} · {p.numero_cuotas} cuotas
                  </p>
                  {p.notas && <p className="text-xs text-muted-foreground mt-0.5">{p.notas}</p>}
                </div>
                <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs ${estadoPlanColor[p.estado] || ""}`}>{p.estado?.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ortodoncia" className="space-y-3">
          {controles.length === 0 ? (
            <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="py-8 text-center text-muted-foreground">No hay controles de ortodoncia</CardContent></Card>
          ) : controles.map((c: any) => (
            <Card key={c.id} className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-colors">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{format(new Date(c.fecha + "T12:00:00"), "dd/MM/yyyy", { locale: es })}</p>
                  <p className="text-sm text-muted-foreground">
                    Progreso: <span className="font-semibold text-foreground">{c.progreso_porcentaje}%</span> {c.cambio_ligas ? "· Cambio ligas ✓" : ""} {c.tipo_arco ? `· ${c.tipo_arco}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  {c.pago_mensual && <p className="text-sm font-semibold tabular-nums">{fmt(c.pago_mensual)}</p>}
                  <Badge variant={c.pagado ? "default" : "secondary"} className="rounded-full text-xs">{c.pagado ? "Pagado" : "Pendiente"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="laboratorio" className="space-y-6">
          <TrazabilidadLaboratorioDental />
          {ordenes.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Historial de Órdenes Anteriores</h3>
              {ordenes.map((o: any) => (
                <Card key={o.id} className="rounded-2xl border-border/80 shadow-none hover:border-amber-500/40 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{o.numero} — {o.tipo}</p>
                      <p className="text-sm text-muted-foreground">{o.diente ? `Diente: ${o.diente}` : ""} · {o.material || ""} · {o.laboratorio || ""}</p>
                    </div>
                    <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs ${estadoOrdenColor[o.estado] || ""}`}>{o.estado?.replace(/_/g, " ")}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consentimiento" className="space-y-4">
          <ConsentimientoDental />
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
              <Card key={s.id} className="rounded-2xl border-border/80 shadow-none hover:border-emerald-500/40 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Armchair className="h-4 w-4" />
                      </div>
                      <p className="font-medium text-foreground">{s.nombre}</p>
                    </div>
                    <Badge variant={s.activo ? "default" : "secondary"} className="rounded-full text-xs">{s.activo ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  {s.ubicacion && <p className="text-sm text-muted-foreground mt-2">{s.ubicacion}</p>}
                  {s.equipamiento?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{s.equipamiento.join(", ")}</p>}
                </CardContent>
              </Card>
            ))}
            {!sillones.length && <Card className="col-span-3 rounded-2xl border-border/80 shadow-none"><CardContent className="py-8 text-center text-muted-foreground">Sin sillones registrados</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="presupuestos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPresup} onOpenChange={setOpenPresup}>
              <DialogTrigger asChild><Button size="sm" className="rounded-xl shadow-none"><Plus className="h-4 w-4 mr-1" /> Nuevo presupuesto</Button></DialogTrigger>
              <DialogContent className="rounded-2xl">
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
                  <Button onClick={crearPresupuesto} className="rounded-xl">Crear presupuesto</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
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
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Doctor</TableHead><TableHead>Tipo procedimiento</TableHead><TableHead className="text-right">Porcentaje</TableHead><TableHead className="text-right">Monto fijo</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {comisiones.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.personal_salud ? `${c.personal_salud.nombre} ${c.personal_salud.apellido || ""}` : "—"}</TableCell>
                    <TableCell>{c.tipo_procedimiento || "General"}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.porcentaje}%</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(c.monto_fijo || 0)}</TableCell>
                    <TableCell><Badge variant={c.activo ? "default" : "secondary"} className="rounded-full text-xs">{c.activo ? "Activo" : "Inactivo"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!comisiones.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin comisiones configuradas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="recordatorios" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold tabular-nums text-foreground">{recordatorios.filter((r: any) => r.tipo === "limpieza_semestral").length}</p><p className="text-xs text-muted-foreground mt-0.5">Limpiezas 6m</p></CardContent></Card>
            <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold tabular-nums text-foreground">{recordatorios.filter((r: any) => r.tipo === "reactivacion").length}</p><p className="text-xs text-muted-foreground mt-0.5">Reactivaciones</p></CardContent></Card>
            <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold tabular-nums text-foreground">{recordatorios.filter((r: any) => r.tipo === "control_ortodoncia").length}</p><p className="text-xs text-muted-foreground mt-0.5">Controles orto</p></CardContent></Card>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Paciente</TableHead><TableHead>Tipo</TableHead><TableHead>Próxima fecha</TableHead><TableHead>Canal</TableHead><TableHead>Estado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recordatorios.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">{r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido || ""}` : "—"}</TableCell>
                    <TableCell className="capitalize">{r.tipo?.replace(/_/g, " ")}</TableCell>
                    <TableCell className="tabular-nums">{r.proxima_fecha}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-full text-xs">{r.canal}</Badge></TableCell>
                    <TableCell><Badge variant={r.estado === "pendiente" ? "secondary" : "default"} className="rounded-full text-xs">{r.estado}</Badge></TableCell>
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
