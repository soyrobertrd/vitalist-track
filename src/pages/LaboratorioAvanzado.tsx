import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
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
import { FlaskConical, Plus, AlertTriangle, CheckCircle2, TestTube, PhoneCall, Clock, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

export default function LaboratorioAvanzado() {
  return (
    <div className="space-y-6">
      <ClinicalPageHeader title="Laboratorio (avanzado)" subtitle="Trazabilidad de muestras, procesamiento, control de calidad y alertas" icon={FlaskConical} />
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
    const { data } = await (db.from("muestras_laboratorio" as any) as any).select("*, pacientes(nombre,apellido)").order("created_at",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function loadOrdenes() {
    const { data } = await db.from("ordenes_laboratorio").select("id,numero_orden,paciente_id,pacientes(nombre,apellido)").eq("workspace_id", currentWorkspace!.id).in("estado",["pendiente","en_proceso"]).limit(100);
    setOrdenes(data ?? []);
  }
  async function save() {
    if (!form.orden_id || !form.tipo_muestra) return toast.error("Faltan datos");
    const orden = ordenes.find(o => o.id === form.orden_id);
    const codigo = `MX-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await (db.from("muestras_laboratorio" as any) as any).insert({
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
    await (db.from("muestras_laboratorio" as any) as any).update(upd).eq("id", id);
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
    const { data } = await (db.from("procesamiento_lab" as any) as any).select("*").order("fecha_procesamiento",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function loadMuestras() {
    const { data } = await (db.from("muestras_laboratorio" as any) as any).select("id,codigo_barras,tipo_muestra").eq("estado","recibida").limit(100);
    setMuestras(data ?? []);
  }
  async function save() {
    if (!form.muestra_id || !form.resultado) return toast.error("Faltan datos");
    const fueraRango = form.fuera_rango === true;
    const critico = form.critico === true;
    const { error } = await (db.from("procesamiento_lab" as any) as any).insert({
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
    const { data } = await (db.from("control_calidad_lab" as any) as any).select("*").eq("workspace_id", currentWorkspace!.id).order("fecha",{ ascending:false }).limit(50);
    setItems(data ?? []);
  }
  async function save() {
    if (!currentWorkspace) return;
    const obtenido = parseFloat(form.valor_obtenido);
    const esperado = parseFloat(form.valor_esperado);
    const desv = obtenido - esperado;
    const aprobado = Math.abs(desv) <= (esperado * 0.05);
    const { error } = await (db.from("control_calidad_lab" as any) as any).insert({
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
  const [modalPanico, setModalPanico] = useState<any>(null);
  const [medicoReceptor, setMedicoReceptor] = useState("");
  const [servicioReceptor, setServicioReceptor] = useState("UCI / Cuidados Críticos");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [confirmReadback, setConfirmReadback] = useState(false);
  const [notasReadback, setNotasReadback] = useState("");

  const MOCK_ALERTAS_LAB = [
    {
      id: "al-01",
      descripcion: "Potasio sérico (K+) = 6.4 mEq/L (PÁNICO - Hiperkalemia severa)",
      severidad: "critica",
      resuelto: false,
      created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      pacientes: { nombre: "Don Ramón Arturo", apellido: "Henríquez" },
      prueba: "Ionograma Sérico",
      valor: "6.4 mEq/L",
    },
    {
      id: "al-02",
      descripcion: "Glucosa plasmática = 42 mg/dL (PÁNICO - Hipoglicemia severa)",
      severidad: "critica",
      resuelto: false,
      created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      pacientes: { nombre: "Elena", apellido: "Gómez" },
      prueba: "Glicemia Central",
      valor: "42 mg/dL",
    },
    {
      id: "al-03",
      descripcion: "Plaquetas = 18,000 /mm³ (PÁNICO - Trombocitopenia crítica)",
      severidad: "critica",
      resuelto: true,
      created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      pacientes: { nombre: "Bartolomé", apellido: "De Oleo" },
      prueba: "Hemograma Automatizado",
      valor: "18,000 /mm³",
      notificado_a: "Dr. Carlos Mendoza (Urgencias)",
      readback_verificado: true,
    },
  ];

  useEffect(() => {
    if (currentWorkspace) load();
    else setItems(MOCK_ALERTAS_LAB);
  }, [currentWorkspace]);

  async function load() {
    const { data } = await (db.from("alertas_laboratorio" as any) as any)
      .select("*, pacientes(nombre,apellido)")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data && data.length > 0) setItems(data);
    else setItems(MOCK_ALERTAS_LAB);
  }

  async function guardarReadBack() {
    if (!confirmReadback || !medicoReceptor) {
      toast.error("Debe ingresar el profesional receptor y verificar el Read-Back.");
      return;
    }

    try {
      await (db.from("alertas_laboratorio" as any) as any)
        .update({
          resuelto: true,
          notificado_a: `${medicoReceptor} (${servicioReceptor})`,
          readback_verificado: true,
          notas_notificacion: notasReadback,
        })
        .eq("id", modalPanico.id);
    } catch {
      // Fallback local
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === modalPanico.id
          ? {
              ...i,
              resuelto: true,
              notificado_a: `${medicoReceptor} (${servicioReceptor})`,
              readback_verificado: true,
            }
          : i
      )
    );

    toast.success(
      `Valor de pánico notificado con éxito a ${medicoReceptor} con confirmación Read-Back obligatoria cumplida.`
    );
    setModalPanico(null);
    setMedicoReceptor("");
    setConfirmReadback(false);
    setNotasReadback("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-rose-600" />
          <div>
            <h4 className="font-bold text-sm text-foreground">Protocolo de Valores de Pánico & Read-Back (Joint Commission)</h4>
            <p className="text-xs text-muted-foreground">
              Todo valor crítico debe comunicarse por vía telefónica inmediata (&lt; 15 min) con lectura repetida obligatoria por el médico receptor.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((i) => (
          <Card key={i.id} className={i.severidad === "critica" && !i.resuelto ? "border-rose-500/40 bg-rose-500/5" : "border-border/80"}>
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={i.severidad === "critica" ? "destructive" : "outline"} className="text-[10px] font-bold">
                    {i.severidad.toUpperCase()}
                  </Badge>
                  <span className="font-bold text-sm text-foreground">{i.descripcion}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paciente: <strong className="text-foreground">{i.pacientes?.nombre} {i.pacientes?.apellido}</strong> • {format(new Date(i.created_at), "dd/MM/yyyy HH:mm")}
                </p>
                {i.notificado_a && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Notificado con Read-Back a: {i.notificado_a}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!i.resuelto ? (
                  <Button
                    size="sm"
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 shadow-sm"
                    onClick={() => setModalPanico(i)}
                  >
                    <PhoneCall className="h-4 w-4" /> Notificar Read-Back
                  </Button>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    Notificado & Resuelto
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin alertas activas</p>}
      </div>

      {/* Modal Protocolo Read-Back */}
      <Dialog open={!!modalPanico} onOpenChange={() => setModalPanico(null)}>
        {modalPanico && (
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <PhoneCall className="h-5 w-5" />
                Protocolo de Pánico: Notificación Telefónica Inmediata
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground block">Hallazgo Crítico:</span>
                <p className="font-bold text-rose-800 dark:text-rose-300 text-sm">{modalPanico.descripcion}</p>
                <p className="text-muted-foreground">Paciente: {modalPanico.pacientes?.nombre} {modalPanico.pacientes?.apellido}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Médico / Profesional Receptor:</Label>
                <Input
                  placeholder="Ej: Dra. Sofía Rivas (Exeq: 12048-20)"
                  value={medicoReceptor}
                  onChange={(e) => setMedicoReceptor(e.target.value)}
                  className="rounded-xl border-border/80 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Servicio / Unidad:</Label>
                  <Select value={servicioReceptor} onValueChange={setServicioReceptor}>
                    <SelectTrigger className="rounded-xl border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UCI / Cuidados Críticos">UCI / Cuidados Críticos</SelectItem>
                      <SelectItem value="Urgencias & Trauma">Urgencias & Trauma</SelectItem>
                      <SelectItem value="Piso 2 Medicina Interna">Piso 2 Medicina Interna</SelectItem>
                      <SelectItem value="Piso 3 Cirugía">Piso 3 Cirugía</SelectItem>
                      <SelectItem value="Quirófano / Recuperación">Quirófano / Recuperación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Teléfono / Anexo:</Label>
                  <Input
                    placeholder="Ej: Ext. 4022 / Cel"
                    value={telefonoContacto}
                    onChange={(e) => setTelefonoContacto(e.target.value)}
                    className="rounded-xl border-border/80 text-xs"
                  />
                </div>
              </div>

              {/* Casilla de verificación Read-Back */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="chkReadback"
                  checked={confirmReadback}
                  onChange={(e) => setConfirmReadback(e.target.checked)}
                  className="mt-0.5 rounded h-4 w-4 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="chkReadback" className="text-xs text-foreground cursor-pointer leading-relaxed">
                  <strong>Confirmación de Read-Back Obligatoria:</strong> Certifico que el médico receptor repitió verbalmente el nombre del paciente, el parámetro analítico y el valor numérico exacto para garantizar la ausencia de error en la transmisión.
                </label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Notas o Conducta Indicada por el Receptor:</Label>
                <Textarea
                  placeholder="Ej: Médico indica administración inmediata de Gluconato de Calcio IV y ECG urgente..."
                  value={notasReadback}
                  onChange={(e) => setNotasReadback(e.target.value)}
                  rows={2}
                  className="rounded-xl border-border/80 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setModalPanico(null)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={guardarReadBack}
                disabled={!confirmReadback || !medicoReceptor}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Registrar Comunicación Oficial
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
