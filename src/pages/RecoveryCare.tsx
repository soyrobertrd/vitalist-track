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
import { Heart, BedDouble, Activity, Plane, Users, CalendarDays, DollarSign, Calculator, Plus, ShieldAlert } from "lucide-react";
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

const estadoPacColor: Record<string, string> = {
  reservado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ingresado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  en_recuperacion: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  alta: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/10 text-destructive",
};
const estadoHabColor: Record<string, string> = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ocupada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  limpieza: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  mantenimiento: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  reservada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};
const estadoReservaColor: Record<string, string> = {
  reservada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  confirmada: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  check_in: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  en_estadia: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  check_out: "bg-muted text-muted-foreground",
  cancelada: "bg-destructive/10 text-destructive",
  no_show: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function RecoveryCare() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [tab, setTab] = useTabParam("pacientes");

  const { data: pacientesRec = [] } = useQuery({
    queryKey: ["pacientes_recovery", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("pacientes_recovery" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: habitaciones = [] } = useQuery({
    queryKey: ["habitaciones_recovery", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("habitaciones_recovery" as any).select("*").eq("workspace_id", wsId!).order("nombre"); return (data || []) as any[]; },
  });
  const { data: planes = [] } = useQuery({
    queryKey: ["planes_recovery", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("planes_recovery" as any).select("*").eq("workspace_id", wsId!).eq("activo", true).order("nombre"); return (data || []) as any[]; },
  });
  const { data: seguimientos = [] } = useQuery({
    queryKey: ["seguimiento_diario_recovery", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("seguimiento_diario_recovery" as any).select("*").eq("workspace_id", wsId!).order("fecha", { ascending: false }).limit(50); return (data || []) as any[]; },
  });
  const { data: reservas = [] } = useQuery({
    queryKey: ["reservas_recovery", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await (supabase.from("reservas_recovery") as any).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("check_in", { ascending: false }).limit(100); return (data || []) as any[]; },
  });
  const { data: alertas = [] } = useQuery({
    queryKey: ["alertas_emergencia_recovery", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("alertas_emergencia_recovery" as any).select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(50); return (data || []) as any[]; },
  });
  const { data: conciergeServ = [] } = useQuery({
    queryKey: ["servicios_concierge", wsId], enabled: !!wsId,
    queryFn: async () => { const { data } = await supabase.from("servicios_concierge" as any).select("*").eq("workspace_id", wsId!).order("fecha", { ascending: false }).limit(50); return (data || []) as any[]; },
  });

  const activos = pacientesRec.filter((p: any) => p.estado === "en_recuperacion" || p.estado === "ingresado").length;
  const habDisponibles = habitaciones.filter((h: any) => h.estado === "disponible").length;
  const turismoMedico = pacientesRec.filter((p: any) => p.turismo_medico).length;
  const alertasAbiertas = alertas.filter((a: any) => !a.resuelta).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Heart className="h-6 w-6" /> Recovery Care</h1>
        <p className="text-muted-foreground">Post-lipo, BBL, turismo médico, recovery premium, cuidados domiciliarios</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="pt-3 text-center"><Activity className="h-4 w-4 mx-auto mb-1 text-green-500" /><p className="text-xl font-bold">{activos}</p><p className="text-[10px] text-muted-foreground">Activos</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><BedDouble className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{habDisponibles}/{habitaciones.length}</p><p className="text-[10px] text-muted-foreground">Hab. disp.</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><Plane className="h-4 w-4 mx-auto mb-1 text-blue-500" /><p className="text-xl font-bold">{turismoMedico}</p><p className="text-[10px] text-muted-foreground">Turismo méd.</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><p className="text-xl font-bold">{reservas.length}</p><p className="text-[10px] text-muted-foreground">Reservas</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><p className="text-xl font-bold">{conciergeServ.length}</p><p className="text-[10px] text-muted-foreground">Concierge</p></CardContent></Card>
        <Card><CardContent className="pt-3 text-center"><ShieldAlert className="h-4 w-4 mx-auto mb-1 text-destructive" /><p className="text-xl font-bold">{alertasAbiertas}</p><p className="text-[10px] text-muted-foreground">Alertas</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
          <TabsTrigger value="habitaciones">Habitaciones</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="concierge">Concierge</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="gestion_pacientes"><Users className="h-3.5 w-3.5 mr-1" />Registro</TabsTrigger>
          <TabsTrigger value="citas"><CalendarDays className="h-3.5 w-3.5 mr-1" />Citas</TabsTrigger>
          <TabsTrigger value="personal"><Users className="h-3.5 w-3.5 mr-1" />Personal</TabsTrigger>
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

        <TabsContent value="pacientes" className="space-y-3">
          {pacientesRec.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin pacientes</CardContent></Card> : pacientesRec.map((p: any) => (
            <Card key={p.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.numero} — {p.nombre_paciente || "Paciente"}</p>
                <p className="text-sm text-muted-foreground">{p.tipo_cirugia || ""} · {p.medico_tratante || ""} {p.turismo_medico ? "✈️" : ""} {p.pais_origen ? `· ${p.pais_origen}` : ""}</p>
              </div>
              <Badge className={estadoPacColor[p.estado] || ""}>{p.estado?.replace(/_/g, " ")}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="habitaciones" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {habitaciones.map((h: any) => (
            <Card key={h.id}><CardContent className="pt-4">
              <div className="flex items-center justify-between"><p className="font-medium">{h.nombre}</p><Badge className={estadoHabColor[h.estado] || ""}>{h.estado}</Badge></div>
              <p className="text-sm text-muted-foreground mt-1">{h.tipo?.replace(/_/g, " ")} {h.tarifa_diaria ? `· ${fmt(h.tarifa_diaria)}/día` : ""}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="reservas" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow>
              <TableHead>Número</TableHead><TableHead>Paciente</TableHead><TableHead>Paquete</TableHead><TableHead>Check-in</TableHead><TableHead>Check-out</TableHead><TableHead>Noches</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {reservas.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                  <TableCell>{r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido || ""}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.paquete?.replace(/_/g, " ") || "custom"}</Badge></TableCell>
                  <TableCell>{r.check_in}</TableCell>
                  <TableCell>{r.check_out || "—"}</TableCell>
                  <TableCell>{r.noches || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(r.total || 0)}</TableCell>
                  <TableCell><Badge className={estadoReservaColor[r.estado] || ""}>{r.estado?.replace(/_/g, " ")}</Badge></TableCell>
                </TableRow>
              ))}
              {!reservas.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin reservas</TableCell></TableRow>}
            </TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="planes" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planes.map((p: any) => (
            <Card key={p.id}><CardContent className="pt-4">
              <p className="font-bold">{p.nombre}</p>
              <Badge variant="outline" className="mt-1">{p.categoria}</Badge>
              <p className="text-sm text-muted-foreground mt-2">{p.dias} noches · {fmt(p.precio || 0)}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="seguimiento" className="space-y-3">
          {seguimientos.map((s: any) => (
            <Card key={s.id}><CardContent className="py-4">
              <p className="font-medium">{s.fecha}</p>
              <p className="text-sm text-muted-foreground">Dolor: {s.nivel_dolor}/10 · T: {s.temperatura || "—"}°C · PA: {s.presion_arterial || "—"}</p>
              {s.observaciones && <p className="text-xs text-muted-foreground mt-1">{s.observaciones}</p>}
            </CardContent></Card>
          ))}
          {!seguimientos.length && <Card><CardContent className="py-8 text-center text-muted-foreground">Sin seguimientos</CardContent></Card>}
        </TabsContent>

        <TabsContent value="concierge" className="mt-4">
          <Card><Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Fecha</TableHead><TableHead>Hora</TableHead><TableHead>Proveedor</TableHead><TableHead className="text-right">Costo</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>
              {conciergeServ.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.tipo?.replace(/_/g, " ")}</TableCell>
                  <TableCell>{c.fecha}</TableCell>
                  <TableCell>{c.hora || "—"}</TableCell>
                  <TableCell>{c.proveedor || "—"}</TableCell>
                  <TableCell className="text-right">{fmt(c.costo || 0)}</TableCell>
                  <TableCell><Badge variant={c.estado === "completado" ? "default" : "secondary"}>{c.estado}</Badge></TableCell>
                </TableRow>
              ))}
              {!conciergeServ.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin servicios concierge</TableCell></TableRow>}
            </TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="alertas" className="mt-4 space-y-3">
          {alertas.map((a: any) => (
            <Card key={a.id} className={!a.resuelta ? "border-destructive/50" : ""}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.tipo?.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">{a.descripcion || ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.severidad === "critica" ? "destructive" : a.severidad === "alta" ? "destructive" : "secondary"}>{a.severidad}</Badge>
                  <Badge variant={a.resuelta ? "default" : "outline"}>{a.resuelta ? "Resuelta" : "Abierta"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {!alertas.length && <Card><CardContent className="py-8 text-center text-muted-foreground">Sin alertas de emergencia</CardContent></Card>}
        </TabsContent>

        <TabsContent value="gestion_pacientes" className="mt-4"><VerticalPacientesTab /></TabsContent>
        <TabsContent value="citas" className="mt-4"><VerticalCitasTab citaLabel="Citas de Recuperación" /></TabsContent>
        <TabsContent value="personal" className="mt-4"><VerticalPersonalTab profesionalLabel="Personal de Cuidado" especialidades={["Enfermería", "Fisioterapia", "Cuidado postquirúrgico", "Masaje linfático", "Concierge médico", "Chofer", "Traductor"]} /></TabsContent>
        <TabsContent value="facturacion" className="mt-4"><VerticalFacturacionTab /></TabsContent>
        <TabsContent value="nomina" className="mt-4"><VerticalNominaTab /></TabsContent>
        <TabsContent value="sucursales" className="mt-4"><VerticalSucursalesTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="leads" className="mt-4"><VerticalLeadsCRMTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="marketing" className="mt-4"><VerticalMarketingTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="pagos_online" className="mt-4"><VerticalPagosTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="portal" className="mt-4"><VerticalPortalTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="bi" className="mt-4"><VerticalBITab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="telemedicina" className="mt-4"><VerticalTelemedicinaTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="recetas" className="mt-4"><VerticalRecetasTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="ecf" className="mt-4"><VerticalFacturacionElectronicaTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="integraciones" className="mt-4"><VerticalIntegracionesTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="inventario_v" className="mt-4"><VerticalInventarioTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="kpis" className="mt-4"><VerticalReportesKPITab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="onboarding" className="mt-4"><VerticalOnboardingTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="pwa" className="mt-4"><VerticalPWATab /></TabsContent>
        <TabsContent value="roles_permisos" className="mt-4"><VerticalRolesPermisosTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="agenda_ia" className="mt-4"><VerticalAgendaIATab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="comunicaciones" className="mt-4"><VerticalComunicacionesTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="finanzas_avz" className="mt-4"><VerticalFinanzasAvanzadasTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="documentos_v" className="mt-4"><VerticalDocumentosTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="workflows" className="mt-4"><VerticalWorkflowsTab verticalTipo="recovery" /></TabsContent>
        <TabsContent value="idioma_acc" className="mt-4"><VerticalIdiomaAccesibilidadTab /></TabsContent>
        <TabsContent value="marketplace" className="mt-4"><VerticalMarketplaceTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="telemed_avz" className="mt-4"><VerticalTelemedicinaAvanzadaTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="ia_predictiva" className="mt-4"><VerticalIAPredictivaTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="iot" className="mt-4"><VerticalIoTTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="camas" className="mt-4"><VerticalCamasTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="regulatorio" className="mt-4"><VerticalReportesRegulatoriosTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="crm_fideliz" className="mt-4"><VerticalCRMFidelizacionTab verticalTipo="recuperacion" /></TabsContent>
        <TabsContent value="api_gateway" className="mt-4"><VerticalAPIGatewayTab verticalTipo="recuperacion" /></TabsContent>
      </Tabs>
    </div>
  );
}
