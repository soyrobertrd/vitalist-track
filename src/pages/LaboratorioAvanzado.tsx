import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FlaskConical, Plus, AlertTriangle, CheckCircle2, TestTube } from "lucide-react";
import { format } from "date-fns";

export default function LaboratorioAvanzado() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6"/>Laboratorio (avanzado)</h1>
        <p className="text-sm text-muted-foreground">Trazabilidad de muestras, procesamiento, control de calidad y alertas</p>
      </div>
      <Tabs defaultValue="muestras">
        <TabsList>
          <TabsTrigger value="muestras"><TestTube className="h-4 w-4 mr-1"/>Muestras</TabsTrigger>
          <TabsTrigger value="procesamiento">Procesamiento</TabsTrigger>
          <TabsTrigger value="qc"><CheckCircle2 className="h-4 w-4 mr-1"/>Control calidad</TabsTrigger>
          <TabsTrigger value="alertas"><AlertTriangle className="h-4 w-4 mr-1"/>Alertas</TabsTrigger>
        </TabsList>
        <TabsContent value="muestras" className="mt-4"><MuestrasTab/></TabsContent>
        <TabsContent value="procesamiento" className="mt-4"><ProcesamientoTab/></TabsContent>
        <TabsContent value="qc" className="mt-4"><ControlCalidadTab/></TabsContent>
        <TabsContent value="alertas" className="mt-4"><AlertasTab/></TabsContent>
      </Tabs>
    </div>
  );
}

function MuestrasTab() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [ordenes, setOrdenes] = useState<any[]>([]);

  useEffect(() => { load(); if (currentWorkspace) loadOrdenes(); }, [currentWorkspace]);
  async function load() {
    const { data } = await (supabase.from("muestras_laboratorio" as any) as any).select("*, pacientes(nombre,apellido)").order("created_at",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function loadOrdenes() {
    const { data } = await supabase.from("ordenes_laboratorio").select("id,numero_orden,paciente_id,pacientes(nombre,apellido)").eq("workspace_id", currentWorkspace!.id).in("estado",["pendiente","en_proceso"]).limit(100);
    setOrdenes(data ?? []);
  }
  async function save() {
    if (!form.orden_id || !form.tipo_muestra) return toast.error("Faltan datos");
    const orden = ordenes.find(o => o.id === form.orden_id);
    const codigo = `MX-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await (supabase.from("muestras_laboratorio" as any) as any).insert({
      orden_id: form.orden_id, paciente_id: orden.paciente_id,
      tipo_muestra: form.tipo_muestra, codigo_barras: codigo,
      recipiente: form.recipiente, volumen: form.volumen,
      estado: "recolectada", fecha_recoleccion: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success(`Muestra ${codigo} recolectada`); setOpen(false); setForm({}); load();
  }
  async function actualizar(id: string, estado: string, motivo?: string) {
    const upd: any = { estado };
    if (estado === "recibida") upd.fecha_recepcion = new Date().toISOString();
    if (motivo) upd.motivo_rechazo = motivo;
    await (supabase.from("muestras_laboratorio" as any) as any).update(upd).eq("id", id);
    load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Recolectar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Recolectar muestra</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Orden *</Label>
                <Select value={form.orden_id ?? ""} onValueChange={v => setForm({...form, orden_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar"/></SelectTrigger>
                  <SelectContent>{ordenes.map((o:any) => <SelectItem key={o.id} value={o.id}>{o.numero_orden} - {o.pacientes?.nombre} {o.pacientes?.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo *</Label><Input value={form.tipo_muestra ?? ""} onChange={e => setForm({...form, tipo_muestra: e.target.value})} placeholder="Sangre, orina, heces..."/></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Recipiente</Label><Input value={form.recipiente ?? ""} onChange={e => setForm({...form, recipiente: e.target.value})} placeholder="EDTA, citrato..."/></div>
                <div><Label>Volumen</Label><Input value={form.volumen ?? ""} onChange={e => setForm({...form, volumen: e.target.value})} placeholder="5 ml"/></div>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Recolectar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium font-mono text-sm">{i.codigo_barras}</p>
              <p className="text-xs text-muted-foreground">{i.pacientes?.nombre} {i.pacientes?.apellido} • {i.tipo_muestra}</p>
            </div>
            <div className="flex gap-2 items-center">
              <Badge>{i.estado}</Badge>
              {i.estado === "recolectada" && <Button size="sm" onClick={() => actualizar(i.id, "recibida")}>Recibir</Button>}
              {i.estado === "recibida" && <Button size="sm" onClick={() => actualizar(i.id, "procesada")}>Procesar</Button>}
              {["recolectada","recibida"].includes(i.estado) && <Button size="sm" variant="destructive" onClick={() => { const m = prompt("Motivo rechazo:"); if(m) actualizar(i.id, "rechazada", m); }}>Rechazar</Button>}
            </div>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin muestras</p>}
      </div>
    </div>
  );
}

function ProcesamientoTab() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [muestras, setMuestras] = useState<any[]>([]);

  useEffect(() => { load(); loadMuestras(); }, []);
  async function load() {
    const { data } = await (supabase.from("procesamiento_lab" as any) as any).select("*").order("fecha_procesamiento",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function loadMuestras() {
    const { data } = await (supabase.from("muestras_laboratorio" as any) as any).select("id,codigo_barras,tipo_muestra").eq("estado","recibida").limit(100);
    setMuestras(data ?? []);
  }
  async function save() {
    if (!form.muestra_id || !form.resultado) return toast.error("Faltan datos");
    const fueraRango = form.fuera_rango === true;
    const critico = form.critico === true;
    const { error } = await (supabase.from("procesamiento_lab" as any) as any).insert({
      muestra_id: form.muestra_id, equipo: form.equipo,
      resultado: form.resultado, unidad: form.unidad,
      valor_referencia: form.valor_referencia, fuera_rango: fueraRango, critico,
      observaciones: form.obs,
    });
    if (error) return toast.error(error.message);
    toast.success("Resultado registrado"); setOpen(false); setForm({}); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Registrar resultado</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Resultado de prueba</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Muestra *</Label>
                <Select value={form.muestra_id ?? ""} onValueChange={v => setForm({...form, muestra_id: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{muestras.map((m:any) => <SelectItem key={m.id} value={m.id}>{m.codigo_barras} ({m.tipo_muestra})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Equipo</Label><Input value={form.equipo ?? ""} onChange={e => setForm({...form, equipo: e.target.value})}/></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Resultado *</Label><Input value={form.resultado ?? ""} onChange={e => setForm({...form, resultado: e.target.value})}/></div>
                <div><Label>Unidad</Label><Input value={form.unidad ?? ""} onChange={e => setForm({...form, unidad: e.target.value})}/></div>
                <div><Label>V. Ref.</Label><Input value={form.valor_referencia ?? ""} onChange={e => setForm({...form, valor_referencia: e.target.value})}/></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.fuera_rango} onChange={e => setForm({...form, fuera_rango: e.target.checked})}/> Fuera de rango</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.critico} onChange={e => setForm({...form, critico: e.target.checked})}/> Crítico</label>
              </div>
              <div><Label>Observaciones</Label><Textarea value={form.obs ?? ""} onChange={e => setForm({...form, obs: e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id} className={i.critico ? "border-destructive" : ""}><CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">{i.resultado} <span className="text-sm text-muted-foreground">{i.unidad}</span></p>
              <p className="text-xs text-muted-foreground">Ref: {i.valor_referencia} • {i.equipo}</p>
            </div>
            <div className="flex gap-2">
              {i.fuera_rango && <Badge variant="outline">Fuera rango</Badge>}
              {i.critico && <Badge variant="destructive">Crítico</Badge>}
            </div>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin procesamientos</p>}
      </div>
    </div>
  );
}

function ControlCalidadTab() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (currentWorkspace) load(); }, [currentWorkspace]);
  async function load() {
    const { data } = await (supabase.from("control_calidad_lab" as any) as any).select("*").eq("workspace_id", currentWorkspace!.id).order("fecha",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function save() {
    if (!currentWorkspace) return;
    const obtenido = parseFloat(form.valor_obtenido);
    const esperado = parseFloat(form.valor_esperado);
    const desv = obtenido - esperado;
    const aprobado = Math.abs(desv) <= (esperado * 0.05);
    const { error } = await (supabase.from("control_calidad_lab" as any) as any).insert({
      workspace_id: currentWorkspace.id, equipo: form.equipo, prueba: form.prueba,
      nivel_control: form.nivel, valor_obtenido: obtenido, valor_esperado: esperado,
      desviacion: desv, aprobado,
    });
    if (error) return toast.error(error.message);
    toast.success(aprobado ? "QC aprobado" : "QC fuera de rango"); setOpen(false); setForm({}); load();
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Registrar QC</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Control de calidad</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Equipo *</Label><Input value={form.equipo ?? ""} onChange={e => setForm({...form, equipo: e.target.value})}/></div>
                <div><Label>Prueba *</Label><Input value={form.prueba ?? ""} onChange={e => setForm({...form, prueba: e.target.value})}/></div>
                <div><Label>Nivel</Label><Input value={form.nivel ?? ""} onChange={e => setForm({...form, nivel: e.target.value})} placeholder="Bajo/Normal/Alto"/></div>
                <div></div>
                <div><Label>V. Obtenido *</Label><Input type="number" step="0.01" value={form.valor_obtenido ?? ""} onChange={e => setForm({...form, valor_obtenido: e.target.value})}/></div>
                <div><Label>V. Esperado *</Label><Input type="number" step="0.01" value={form.valor_esperado ?? ""} onChange={e => setForm({...form, valor_esperado: e.target.value})}/></div>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-2">
        {items.map(i => (
          <Card key={i.id}><CardContent className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{i.prueba} <span className="text-sm text-muted-foreground">({i.equipo})</span></p>
              <p className="text-xs">Obtenido: {i.valor_obtenido} • Esperado: {i.valor_esperado} • Desv: {Number(i.desviacion).toFixed(2)}</p>
            </div>
            <Badge variant={i.aprobado ? "default" : "destructive"}>{i.aprobado ? "Aprobado" : "Rechazado"}</Badge>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin registros QC</p>}
      </div>
    </div>
  );
}

function AlertasTab() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { if (currentWorkspace) load(); }, [currentWorkspace]);
  async function load() {
    const { data } = await (supabase.from("alertas_laboratorio" as any) as any).select("*, pacientes(nombre,apellido)").eq("workspace_id", currentWorkspace!.id).order("created_at",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function resolver(id: string) {
    await (supabase.from("alertas_laboratorio" as any) as any).update({ resuelto: true }).eq("id", id);
    load();
  }
  return (
    <div className="grid gap-2">
      {items.map(i => (
        <Card key={i.id} className={i.severidad === "critica" ? "border-destructive" : ""}>
          <CardContent className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{i.descripcion}</p>
              <p className="text-xs text-muted-foreground">{i.pacientes?.nombre} {i.pacientes?.apellido} • {format(new Date(i.created_at),"dd/MM HH:mm")}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={i.severidad === "critica" ? "destructive" : "outline"}>{i.severidad}</Badge>
              {!i.resuelto && <Button size="sm" onClick={() => resolver(i.id)}>Resolver</Button>}
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin alertas</p>}
    </div>
  );
}
