import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Users, Megaphone, MessageCircle, TrendingUp } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";

const ESTADO_LEAD_COLORS: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contactado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  calificado: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  propuesta: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ganado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  perdido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ESTADO_CAMPANA_COLORS: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  activa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pausada: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  finalizada: "bg-muted text-muted-foreground",
};

const ORIGEN_LABELS: Record<string, string> = { web: "Web", referido: "Referido", redes: "Redes sociales", publicidad: "Publicidad", otro: "Otro" };
const TIPO_INT_LABELS: Record<string, string> = { llamada: "Llamada", email: "Email", reunion: "Reunión", whatsapp: "WhatsApp", nota: "Nota" };

export default function CRM() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);

  const [leads, setLeads] = useState<any[]>([]);
  const [campanas, setCampanas] = useState<any[]>([]);
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const [openLead, setOpenLead] = useState(false);
  const [openCampana, setOpenCampana] = useState(false);
  const [openInt, setOpenInt] = useState(false);

  const [leadForm, setLeadForm] = useState({ nombre: "", telefono: "", email: "", origen: "otro", valor_estimado: 0, notas: "" });
  const [campForm, setCampForm] = useState({ nombre: "", tipo: "email", fecha_inicio: "", fecha_fin: "", presupuesto: 0, descripcion: "" });
  const [intForm, setIntForm] = useState({ tipo: "nota", descripcion: "", resultado: "", siguiente_accion: "", siguiente_fecha: "" });

  const fetchAll = async () => {
    if (!wsId) return;
    const [l, c] = await Promise.all([
      supabase.from("leads_crm").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
      supabase.from("campanas_marketing").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }),
    ]);
    if (l.data) setLeads(l.data);
    if (c.data) setCampanas(c.data);
  };

  const fetchInteracciones = async (leadId: string) => {
    const { data } = await supabase.from("interacciones_crm").select("*").eq("lead_id", leadId).order("fecha", { ascending: false });
    if (data) setInteracciones(data);
  };

  useEffect(() => { fetchAll(); }, [wsId]);
  useEffect(() => { if (selectedLead) fetchInteracciones(selectedLead); }, [selectedLead]);

  const crearLead = async () => {
    if (!wsId || !leadForm.nombre) return;
    const { error } = await supabase.from("leads_crm").insert({ ...leadForm, workspace_id: wsId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead creado");
    setOpenLead(false);
    setLeadForm({ nombre: "", telefono: "", email: "", origen: "otro", valor_estimado: 0, notas: "" });
    fetchAll();
  };

  const crearCampana = async () => {
    if (!wsId || !campForm.nombre) return;
    const { error } = await supabase.from("campanas_marketing").insert({
      ...campForm, workspace_id: wsId,
      fecha_inicio: campForm.fecha_inicio || null,
      fecha_fin: campForm.fecha_fin || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaña creada");
    setOpenCampana(false);
    setCampForm({ nombre: "", tipo: "email", fecha_inicio: "", fecha_fin: "", presupuesto: 0, descripcion: "" });
    fetchAll();
  };

  const crearInteraccion = async () => {
    if (!selectedLead || !intForm.descripcion) return;
    const { error } = await supabase.from("interacciones_crm").insert({
      lead_id: selectedLead,
      ...intForm,
      siguiente_fecha: intForm.siguiente_fecha || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Interacción registrada");
    setOpenInt(false);
    setIntForm({ tipo: "nota", descripcion: "", resultado: "", siguiente_accion: "", siguiente_fecha: "" });
    fetchInteracciones(selectedLead);
  };

  const cambiarEstadoLead = async (id: string, estado: string) => {
    await supabase.from("leads_crm").update({ estado } as any).eq("id", id);
    toast.success(`Lead → ${estado}`);
    fetchAll();
  };

  // KPIs
  const totalLeads = leads.length;
  const leadsAbiertos = leads.filter((l: any) => !["ganado", "perdido"].includes(l.estado)).length;
  const pipeline = leads.filter((l: any) => !["ganado", "perdido"].includes(l.estado)).reduce((s: number, l: any) => s + (l.valor_estimado || 0), 0);
  const ganados = leads.filter((l: any) => l.estado === "ganado").length;

  return (
    <div className="space-y-6">
      <MobilePageHeader title="CRM & Marketing" description="Leads, pipeline de ventas y campañas" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total leads</p><p className="text-2xl font-bold">{totalLeads}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Pipeline abierto</p><p className="text-2xl font-bold">{fmt(pipeline)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Leads activos</p><p className="text-2xl font-bold">{leadsAbiertos}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Ganados</p><p className="text-2xl font-bold text-green-600">{ganados}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="leads" className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Leads</TabsTrigger>
          <TabsTrigger value="interacciones" className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Interacciones</TabsTrigger>
          <TabsTrigger value="campanas" className="flex items-center gap-1.5"><Megaphone className="h-4 w-4" /> Campañas</TabsTrigger>
        </TabsList>

        {/* LEADS */}
        <TabsContent value="leads" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openLead} onOpenChange={setOpenLead}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo lead</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo lead</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre</Label><Input value={leadForm.nombre} onChange={(e) => setLeadForm({ ...leadForm, nombre: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Teléfono</Label><Input value={leadForm.telefono} onChange={(e) => setLeadForm({ ...leadForm, telefono: e.target.value })} /></div>
                    <div><Label>Email</Label><Input value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Origen</Label>
                      <Select value={leadForm.origen} onValueChange={(v) => setLeadForm({ ...leadForm, origen: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(ORIGEN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Valor estimado</Label><Input type="number" value={leadForm.valor_estimado} onChange={(e) => setLeadForm({ ...leadForm, valor_estimado: +e.target.value })} /></div>
                  </div>
                  <div><Label>Notas</Label><Textarea value={leadForm.notas} onChange={(e) => setLeadForm({ ...leadForm, notas: e.target.value })} /></div>
                  <Button onClick={crearLead}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l: any) => (
                  <TableRow key={l.id} className={selectedLead === l.id ? "bg-accent/30" : ""}>
                    <TableCell className="font-mono text-xs">{l.numero}</TableCell>
                    <TableCell className="font-medium">{l.nombre}</TableCell>
                    <TableCell className="text-xs">{l.telefono || l.email || "—"}</TableCell>
                    <TableCell>{ORIGEN_LABELS[l.origen] || l.origen}</TableCell>
                    <TableCell><Badge className={ESTADO_LEAD_COLORS[l.estado] || ""}>{l.estado}</Badge></TableCell>
                    <TableCell className="text-right">{fmt(l.valor_estimado || 0)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setSelectedLead(l.id)}>Ver</Button>
                        {l.estado === "nuevo" && <Button size="sm" variant="ghost" onClick={() => cambiarEstadoLead(l.id, "contactado")}>Contactar</Button>}
                        {l.estado === "calificado" && <Button size="sm" variant="ghost" onClick={() => cambiarEstadoLead(l.id, "propuesta")}>Propuesta</Button>}
                        {l.estado === "propuesta" && <Button size="sm" variant="ghost" className="text-green-600" onClick={() => cambiarEstadoLead(l.id, "ganado")}>Ganado</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!leads.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin leads</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* INTERACCIONES */}
        <TabsContent value="interacciones" className="mt-4 space-y-4">
          {!selectedLead ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Seleccione un lead en la pestaña "Leads"</CardContent></Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lead: {leads.find((l: any) => l.id === selectedLead)?.nombre}</span>
                <Dialog open={openInt} onOpenChange={setOpenInt}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva interacción</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar interacción</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div>
                        <Label>Tipo</Label>
                        <Select value={intForm.tipo} onValueChange={(v) => setIntForm({ ...intForm, tipo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(TIPO_INT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Descripción</Label><Textarea value={intForm.descripcion} onChange={(e) => setIntForm({ ...intForm, descripcion: e.target.value })} /></div>
                      <div><Label>Resultado</Label><Input value={intForm.resultado} onChange={(e) => setIntForm({ ...intForm, resultado: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Siguiente acción</Label><Input value={intForm.siguiente_accion} onChange={(e) => setIntForm({ ...intForm, siguiente_accion: e.target.value })} /></div>
                        <div><Label>Fecha siguiente</Label><Input type="date" value={intForm.siguiente_fecha} onChange={(e) => setIntForm({ ...intForm, siguiente_fecha: e.target.value })} /></div>
                      </div>
                      <Button onClick={crearInteraccion}>Guardar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead><TableHead>Resultado</TableHead><TableHead>Siguiente</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {interacciones.map((i: any) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs">{new Date(i.fecha).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="outline">{TIPO_INT_LABELS[i.tipo] || i.tipo}</Badge></TableCell>
                        <TableCell>{i.descripcion || "—"}</TableCell>
                        <TableCell>{i.resultado || "—"}</TableCell>
                        <TableCell className="text-xs">{i.siguiente_accion ? `${i.siguiente_accion} (${i.siguiente_fecha || ""})` : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!interacciones.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin interacciones</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* CAMPAÑAS */}
        <TabsContent value="campanas" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCampana} onOpenChange={setOpenCampana}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva campaña</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva campaña</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nombre</Label><Input value={campForm.nombre} onChange={(e) => setCampForm({ ...campForm, nombre: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={campForm.tipo} onValueChange={(v) => setCampForm({ ...campForm, tipo: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="redes">Redes sociales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Presupuesto</Label><Input type="number" value={campForm.presupuesto} onChange={(e) => setCampForm({ ...campForm, presupuesto: +e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio</Label><Input type="date" value={campForm.fecha_inicio} onChange={(e) => setCampForm({ ...campForm, fecha_inicio: e.target.value })} /></div>
                    <div><Label>Fecha fin</Label><Input type="date" value={campForm.fecha_fin} onChange={(e) => setCampForm({ ...campForm, fecha_fin: e.target.value })} /></div>
                  </div>
                  <div><Label>Descripción</Label><Textarea value={campForm.descripcion} onChange={(e) => setCampForm({ ...campForm, descripcion: e.target.value })} /></div>
                  <Button onClick={crearCampana}>Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Presupuesto</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversiones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanas.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell>{c.tipo}</TableCell>
                    <TableCell><Badge className={ESTADO_CAMPANA_COLORS[c.estado] || ""}>{c.estado}</Badge></TableCell>
                    <TableCell className="text-xs">{c.fecha_inicio || "—"} → {c.fecha_fin || "—"}</TableCell>
                    <TableCell className="text-right">{fmt(c.presupuesto || 0)}</TableCell>
                    <TableCell className="text-right">{c.leads_generados}</TableCell>
                    <TableCell className="text-right">{c.conversiones}</TableCell>
                  </TableRow>
                ))}
                {!campanas.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin campañas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
