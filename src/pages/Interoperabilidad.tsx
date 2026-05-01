import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Activity, Download, Upload, Server, FileJson } from "lucide-react";

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
      supabase.from("fhir_resources").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("hl7_messages").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("hl7_endpoints").select("*").eq("workspace_id", currentWorkspace.id),
      supabase.from("fhir_export_jobs").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setResources(r1.data || []);
    setMessages(r2.data || []);
    setEndpoints(r3.data || []);
    setExportJobs(r4.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentWorkspace?.id]);

  const crearEndpoint = async () => {
    if (!currentWorkspace) return;
    const { error } = await supabase.from("hl7_endpoints").insert({ ...endpointForm, workspace_id: currentWorkspace.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Endpoint creado");
    setOpenEndpoint(false);
    setEndpointForm({ nombre: "", tipo: "laboratorio", url: "", protocolo: "https" });
    load();
  };

  const guardarMensaje = async () => {
    if (!currentWorkspace) return;
    let parsed: any = null;
    try {
      const segments = msgForm.raw_message.split(/\r?\n/).filter(Boolean).map(l => l.split("|"));
      parsed = { segments };
    } catch {}
    const { error } = await supabase.from("hl7_messages").insert({
      workspace_id: currentWorkspace.id,
      message_type: msgForm.message_type,
      trigger_event: msgForm.trigger_event,
      direccion: msgForm.direccion,
      raw_message: msgForm.raw_message,
      parsed_json: parsed,
      estado: "procesado",
      processed_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Mensaje HL7 guardado");
    setOpenMessage(false);
    setMsgForm({ message_type: "ORU", trigger_event: "R01", direccion: "inbound", raw_message: "" });
    load();
  };

  const exportarFHIR = async (resource_type: string) => {
    if (!currentWorkspace) return;
    const { data, error } = await supabase.from("fhir_export_jobs").insert({
      workspace_id: currentWorkspace.id,
      resource_types: [resource_type],
      estado: "pendiente",
    }).select().single();
    if (error) { toast.error(error.message); return; }

    if (resource_type === "Patient") {
      const { data: pacs } = await supabase.from("pacientes").select("*").limit(100);
      let count = 0;
      for (const p of pacs || []) {
        const fhir = {
          resourceType: "Patient",
          id: p.id,
          name: [{ family: p.apellido, given: [p.nombre] }],
          gender: p.sexo === "M" ? "male" : p.sexo === "F" ? "female" : "unknown",
          birthDate: p.fecha_nacimiento,
          telecom: [
            ...(p.numero_principal ? [{ system: "phone", value: p.numero_principal, use: "mobile" as const }] : []),
            ...(p.contacto_px ? [{ system: "phone", value: p.contacto_px }] : []),
          ],
          identifier: p.cedula ? [{ system: "urn:dom:jce", value: p.cedula }] : undefined,
        };
        await supabase.from("fhir_resources").insert({
          workspace_id: currentWorkspace.id,
          resource_type: "Patient",
          fhir_id: p.id,
          paciente_id: p.id,
          payload: fhir as any,
        });
        count++;
      }
      await supabase.from("fhir_export_jobs").update({
        estado: "completado",
        total_resources: count,
        exported_resources: count,
        completed_at: new Date().toISOString(),
      }).eq("id", data.id);
      toast.success(`Exportados ${count} pacientes a FHIR`);
    } else {
      toast.info(`Job ${resource_type} encolado`);
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interoperabilidad HL7/FHIR</h1>
        <p className="text-muted-foreground">Intercambio estándar de datos clínicos con sistemas externos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{resources.length}</div><p className="text-xs text-muted-foreground">Recursos FHIR</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{messages.length}</div><p className="text-xs text-muted-foreground">Mensajes HL7</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{endpoints.length}</div><p className="text-xs text-muted-foreground">Endpoints</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{exportJobs.length}</div><p className="text-xs text-muted-foreground">Jobs export</p></CardContent></Card>
      </div>

      <Tabs defaultValue="fhir">
        <TabsList>
          <TabsTrigger value="fhir"><FileJson className="h-4 w-4 mr-1" />FHIR R4</TabsTrigger>
          <TabsTrigger value="hl7"><Activity className="h-4 w-4 mr-1" />HL7 v2</TabsTrigger>
          <TabsTrigger value="endpoints"><Server className="h-4 w-4 mr-1" />Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="fhir" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Exportar a FHIR R4</CardTitle></CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Button onClick={() => exportarFHIR("Patient")}><Download className="h-4 w-4 mr-1" />Patient</Button>
              <Button variant="outline" onClick={() => exportarFHIR("Observation")}>Observation</Button>
              <Button variant="outline" onClick={() => exportarFHIR("Encounter")}>Encounter</Button>
              <Button variant="outline" onClick={() => exportarFHIR("MedicationRequest")}>MedicationRequest</Button>
              <Button variant="outline" onClick={() => exportarFHIR("DiagnosticReport")}>DiagnosticReport</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recursos FHIR ({resources.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {resources.map(r => (
                  <div key={r.id} className="border rounded p-2 text-sm flex items-center justify-between">
                    <div>
                      <Badge variant="outline">{r.resource_type}</Badge>
                      <span className="ml-2 font-mono text-xs">{r.fhir_id}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">v{r.version_id}</span>
                  </div>
                ))}
                {resources.length === 0 && <p className="text-sm text-muted-foreground">Sin recursos. Exporta arriba.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hl7" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openMessage} onOpenChange={setOpenMessage}>
              <DialogTrigger asChild><Button><Upload className="h-4 w-4 mr-1" />Nuevo mensaje HL7</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cargar mensaje HL7 v2</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Tipo</Label><Input value={msgForm.message_type} onChange={e => setMsgForm({...msgForm, message_type: e.target.value})} placeholder="ORU/ADT/ORM" /></div>
                    <div><Label>Evento</Label><Input value={msgForm.trigger_event} onChange={e => setMsgForm({...msgForm, trigger_event: e.target.value})} placeholder="R01/A01" /></div>
                    <div>
                      <Label>Dirección</Label>
                      <Select value={msgForm.direccion} onValueChange={v => setMsgForm({...msgForm, direccion: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound">Entrante</SelectItem>
                          <SelectItem value="outbound">Saliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Mensaje pipe-delimited</Label>
                    <Textarea rows={8} value={msgForm.raw_message} onChange={e => setMsgForm({...msgForm, raw_message: e.target.value})} placeholder="MSH|^~\\&|LAB|HOSP|..." className="font-mono text-xs" />
                  </div>
                  <Button onClick={guardarMensaje} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardHeader><CardTitle>Mensajes ({messages.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {messages.map(m => (
                  <div key={m.id} className="border rounded p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <Badge>{m.message_type}^{m.trigger_event}</Badge>
                        <Badge variant="outline">{m.direccion}</Badge>
                        <Badge variant={m.estado === "procesado" ? "default" : "secondary"}>{m.estado}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <pre className="text-xs mt-1 truncate">{m.raw_message.substring(0, 120)}</pre>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-sm text-muted-foreground">Sin mensajes</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openEndpoint} onOpenChange={setOpenEndpoint}>
              <DialogTrigger asChild><Button>Nuevo endpoint</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Configurar endpoint externo</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nombre</Label><Input value={endpointForm.nombre} onChange={e => setEndpointForm({...endpointForm, nombre: e.target.value})} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={endpointForm.tipo} onValueChange={v => setEndpointForm({...endpointForm, tipo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laboratorio">Laboratorio</SelectItem>
                        <SelectItem value="pacs">PACS</SelectItem>
                        <SelectItem value="his">HIS</SelectItem>
                        <SelectItem value="farmacia">Farmacia</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>URL</Label><Input value={endpointForm.url} onChange={e => setEndpointForm({...endpointForm, url: e.target.value})} /></div>
                  <div>
                    <Label>Protocolo</Label>
                    <Select value={endpointForm.protocolo} onValueChange={v => setEndpointForm({...endpointForm, protocolo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mllp">MLLP</SelectItem>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="sftp">SFTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={crearEndpoint} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {endpoints.map(e => (
              <Card key={e.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{e.nombre}</div>
                    <Badge variant={e.activo ? "default" : "secondary"}>{e.activo ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground"><Badge variant="outline">{e.tipo}</Badge> {e.protocolo}</div>
                  <div className="text-xs mt-1 truncate">{e.url}</div>
                </CardContent>
              </Card>
            ))}
            {endpoints.length === 0 && <p className="text-sm text-muted-foreground">Sin endpoints configurados</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
