import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Activity,
  Download,
  Upload,
  Server,
  FileJson,
  Plus,
  RefreshCw,
  CheckCircle2,
  Layers,
  Sparkles,
  Network
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export default function Interoperabilidad() {
  const { currentWorkspace } = useWorkspace();
  const [resources, setResources] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openEndpoint, setOpenEndpoint] = useState(false);
  const [openMessage, setOpenMessage] = useState(false);

  const [endpointForm, setEndpointForm] = useState({ nombre: "", tipo: "laboratorio", url: "", protocolo: "https" });
  const [msgForm, setMsgForm] = useState({ message_type: "ORU", trigger_event: "R01", direccion: "inbound", raw_message: "" });

  const load = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const [r1, r2, r3, r4] = await Promise.all([
      db.from("fhir_resources").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(50),
      db.from("hl7_messages").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(50),
      db.from("hl7_endpoints").select("*").eq("workspace_id", currentWorkspace.id),
      db.from("fhir_export_jobs").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setResources(r1.data || []);
    setMessages(r2.data || []);
    setEndpoints(r3.data || []);
    setExportJobs(r4.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [currentWorkspace?.id]);

  const crearEndpoint = async () => {
    if (!currentWorkspace) return;
    const { error } = await db.from("hl7_endpoints").insert({ ...endpointForm, workspace_id: currentWorkspace.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Endpoint de integración HL7/FHIR configurado");
    setOpenEndpoint(false);
    setEndpointForm({ nombre: "", tipo: "laboratorio", url: "", protocolo: "https" });
    load();
  };

  const guardarMensaje = async () => {
    if (!currentWorkspace) return;
    let parsed: any = null;
    try {
      const segments = msgForm.raw_message.split(/\r?\n/).filter(Boolean).map((l) => l.split("|"));
      parsed = { segments };
    } catch {}
    const { error } = await db.from("hl7_messages").insert({
      workspace_id: currentWorkspace.id,
      message_type: msgForm.message_type,
      trigger_event: msgForm.trigger_event,
      direccion: msgForm.direccion,
      raw_message: msgForm.raw_message,
      parsed_json: parsed,
      estado: "procesado",
      processed_at: new Date().toISOString(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Mensaje HL7 v2 ${msgForm.message_type}^${msgForm.trigger_event} procesado`);
    setOpenMessage(false);
    setMsgForm({ message_type: "ORU", trigger_event: "R01", direccion: "inbound", raw_message: "" });
    load();
  };

  const exportarFHIR = async (resource_type: string) => {
    if (!currentWorkspace) return;
    const { error } = await db.from("fhir_export_jobs").insert({
      workspace_id: currentWorkspace.id,
      resource_types: [resource_type],
      estado: "pendiente",
    });
    if (error) {
      toast.error(error.message);
      return;
    }

    if (resource_type === "Patient") {
      const { data: pacs } = await db.from("pacientes").select("*").limit(100);
      let count = 0;
      for (const p of pacs || []) {
        const fhir = {
          resourceType: "Patient",
          id: p.id,
          name: [{ family: p.apellido, given: [p.nombre] }],
          gender: p.sexo === "M" ? "male" : p.sexo === "F" ? "female" : "unknown",
          birthDate: p.fecha_nacimiento,
          telecom: [{ system: "phone", value: p.contacto_px }],
        };
        await db.from("fhir_resources").insert({
          workspace_id: currentWorkspace.id,
          resource_type: "Patient",
          fhir_id: p.id,
          payload: fhir,
          version_id: 1,
        });
        count++;
      }
      toast.success(`${count} recursos FHIR Patient generados`);
    } else {
      toast.success(`Exportación FHIR para ${resource_type} iniciada`);
    }
    load();
  };

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Interoperabilidad Clínica & HL7 / FHIR"
        description="Integración de mensajes HL7 v2.5 (ADT/ORM/ORU), recursos HL7 FHIR R4 y endpoints hospitalarios"
        icon={Network}
        badgeText="HL7 v2 & FHIR R4"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/80 gap-1.5"
              onClick={() => setOpenMessage(true)}
            >
              <Upload className="h-4 w-4" /> Inyectar Mensaje HL7
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              onClick={() => setOpenEndpoint(true)}
            >
              <Plus className="h-4 w-4" /> Configurar Endpoint
            </Button>
          </div>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ClinicalKpiCard
          label="Recursos FHIR R4"
          value={resources.length}
          subtitle="Modelados en JSON interoperable"
          icon={FileJson}
          color="indigo"
        />
        <ClinicalKpiCard
          label="Mensajes HL7 v2"
          value={messages.length}
          subtitle="Inbound / Outbound procesados"
          icon={Activity}
          color="teal"
        />
        <ClinicalKpiCard
          label="Endpoints Activos"
          value={endpoints.filter((e) => e.activo).length || endpoints.length}
          subtitle="Conexiones PACS, LIS y HIS"
          icon={Server}
          color="emerald"
        />
        <ClinicalKpiCard
          label="Jobs de Exportación"
          value={exportJobs.length}
          subtitle="Procesos por lotes completados"
          icon={Download}
          color="amber"
        />
      </div>

      <Tabs defaultValue="fhir" className="space-y-4">
        <TabsList className="bg-card border border-border/80 p-1 rounded-xl">
          <TabsTrigger value="fhir" className="rounded-lg gap-2 text-xs sm:text-sm">
            <FileJson className="h-4 w-4" />
            Recursos FHIR R4 ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="hl7" className="rounded-lg gap-2 text-xs sm:text-sm">
            <Activity className="h-4 w-4" />
            Mensajes HL7 v2 ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="rounded-lg gap-2 text-xs sm:text-sm">
            <Server className="h-4 w-4" />
            Endpoints de Integración ({endpoints.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab FHIR R4 */}
        <TabsContent value="fhir" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between p-3.5 bg-card rounded-2xl border border-border/80">
            <div>
              <p className="text-sm font-bold text-foreground">Generador de Recursos FHIR R4</p>
              <p className="text-xs text-muted-foreground">Estandarización de entidades clínicas para interoperar con redes de salud</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => exportarFHIR("Patient")}>
                <Download className="h-3.5 w-3.5" /> Exportar Pacientes
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => exportarFHIR("Observation")}>
                <Download className="h-3.5 w-3.5" /> Exportar Signos & Analíticas
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => exportarFHIR("Condition")}>
                <Download className="h-3.5 w-3.5" /> Exportar Diagnósticos CIE-10
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Catálogo de Entidades FHIR Almacenadas</CardTitle>
              <CardDescription className="text-xs">Estructuras JSON conformes con el estándar HL7 FHIR Release 4</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {resources.map((r) => (
                  <div key={r.id} className="p-3 bg-muted/20 border border-border/60 rounded-xl text-xs flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="font-mono uppercase font-bold text-[10px] border-indigo-500/40 text-indigo-700 dark:text-indigo-300">
                        {r.resource_type}
                      </Badge>
                      <span className="font-mono text-muted-foreground">ID: {r.fhir_id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">v{r.version_id}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
                {resources.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay recursos FHIR generados. Utilice los botones superiores para exportar entidades.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab HL7 v2 */}
        <TabsContent value="hl7" className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Bitácora de Mensajes HL7 v2</CardTitle>
                <CardDescription className="text-xs">Tráfico de mensajes pipe-delimited entre subsistemas clínicos</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setOpenMessage(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Cargar Mensaje
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((m) => (
                  <div key={m.id} className="p-3 bg-muted/20 border border-border/60 rounded-xl text-xs space-y-1.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <Badge variant="default" className="font-mono text-[10px] bg-indigo-600 text-white">
                          {m.message_type}^{m.trigger_event}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {m.direccion}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {m.estado}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(m.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <pre className="text-[11px] font-mono text-muted-foreground bg-muted/50 p-2 rounded-lg truncate overflow-hidden">
                      {m.raw_message}
                    </pre>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sin mensajes HL7 registrados. Inyecte un mensaje pipe-delimited de prueba.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Endpoints */}
        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endpoints.map((e) => (
              <Card key={e.id} className="rounded-2xl border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-foreground">{e.nombre}</CardTitle>
                    <Badge variant={e.activo ? "default" : "secondary"} className="text-[10px]">
                      {e.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    <Badge variant="outline" className="text-[10px] mr-1 uppercase">{e.tipo}</Badge> Protocolo {e.protocolo?.toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs pt-1">
                  <div className="font-mono text-muted-foreground bg-muted/40 p-2 rounded-lg truncate">
                    {e.url || "Sin URL asignada"}
                  </div>
                </CardContent>
              </Card>
            ))}
            {endpoints.length === 0 && (
              <Card className="col-span-full rounded-2xl border-border/80">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Sin endpoints externos configurados. Añada conexiones hacia LIS, PACS o HIS.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nuevo Endpoint */}
      <Dialog open={openEndpoint} onOpenChange={setOpenEndpoint}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-600" /> Configurar Endpoint Externo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro de canal MLLP / HTTPS para intercambio de datos de salud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold">Nombre del Sistema *</Label>
              <Input
                className="rounded-xl mt-1"
                value={endpointForm.nombre}
                onChange={(e) => setEndpointForm({ ...endpointForm, nombre: e.target.value })}
                placeholder="Ej: LIS Hospitalario Roche / Abbott"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Tipo de Sistema</Label>
              <Select value={endpointForm.tipo} onValueChange={(v) => setEndpointForm({ ...endpointForm, tipo: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="laboratorio">Laboratorio Clínico (LIS)</SelectItem>
                  <SelectItem value="pacs">PACS / Diagnóstico por Imágenes</SelectItem>
                  <SelectItem value="his">HIS Central / ERP Médico</SelectItem>
                  <SelectItem value="farmacia">Dispensación de Farmacia</SelectItem>
                  <SelectItem value="otro">Otro Subsistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">URL / Host y Puerto</Label>
              <Input
                className="rounded-xl mt-1 font-mono text-xs"
                value={endpointForm.url}
                onChange={(e) => setEndpointForm({ ...endpointForm, url: e.target.value })}
                placeholder="https://lis.hospital.rd/fhir o mllp://10.0.1.20:2575"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Protocolo de Red</Label>
              <Select value={endpointForm.protocolo} onValueChange={(v) => setEndpointForm({ ...endpointForm, protocolo: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="https">HTTPS REST (FHIR R4)</SelectItem>
                  <SelectItem value="mllp">MLLP (Minimal Lower Layer Protocol - HL7 v2)</SelectItem>
                  <SelectItem value="http">HTTP Estándar</SelectItem>
                  <SelectItem value="sftp">SFTP Seguro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={crearEndpoint} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5">
              Guardar y Habilitar Canal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Mensaje HL7 v2 */}
      <Dialog open={openMessage} onOpenChange={setOpenMessage}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-600" /> Carga Manual de Mensaje HL7 v2
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simulación e inyección de tramas pipe-delimited en el broker de mensajes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-semibold">Tipo (MSH-9.1)</Label>
                <Input
                  className="rounded-xl mt-1 font-mono text-xs"
                  value={msgForm.message_type}
                  onChange={(e) => setMsgForm({ ...msgForm, message_type: e.target.value })}
                  placeholder="ORU / ADT / ORM"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Evento (MSH-9.2)</Label>
                <Input
                  className="rounded-xl mt-1 font-mono text-xs"
                  value={msgForm.trigger_event}
                  onChange={(e) => setMsgForm({ ...msgForm, trigger_event: e.target.value })}
                  placeholder="R01 / A01 / O01"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Dirección</Label>
                <Select value={msgForm.direccion} onValueChange={(v) => setMsgForm({ ...msgForm, direccion: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Entrante (Inbound)</SelectItem>
                    <SelectItem value="outbound">Saliente (Outbound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Trama HL7 Pipe-Delimited (|)</Label>
              <Textarea
                rows={8}
                value={msgForm.raw_message}
                onChange={(e) => setMsgForm({ ...msgForm, raw_message: e.target.value })}
                placeholder="MSH|^~\&|LAB_CLINICO|HOSP_UNIVERSITARIO|VITALIST|CENTRAL|202610292200||ORU^R01|MSG001|P|2.5\nPID|1||101002239||RAMIREZ^JUAN||19820514|M\nOBR|1||ORD001|POTASIO_SERICO\nOBX|1|NM|K+||5.8|mEq/L|3.5-5.0|H|||F"
                className="font-mono text-xs rounded-xl"
              />
            </div>
            <Button onClick={guardarMensaje} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5">
              Procesar Trama HL7
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
