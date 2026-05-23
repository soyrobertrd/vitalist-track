import { Navigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Brain, AlertTriangle, ClipboardCheck, ListChecks, Activity, Pill, Heart, Users, Plus, Lock, Layers } from "lucide-react";
import SubmodulosNicho from "@/components/psicologia/SubmodulosNicho";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESCALAS_INFO: Record<string, { label: string; max: number; cortes: { label: string; min: number }[] }> = {
  phq9:  { label: "PHQ-9 (Depresión)",  max: 27, cortes: [{label:"mínima",min:0},{label:"leve",min:5},{label:"moderada",min:10},{label:"moderada_severa",min:15},{label:"severa",min:20}] },
  gad7:  { label: "GAD-7 (Ansiedad)",   max: 21, cortes: [{label:"mínima",min:0},{label:"leve",min:5},{label:"moderada",min:10},{label:"severa",min:15}] },
  bdi:   { label: "BDI (Beck depresión)", max: 63, cortes: [{label:"mínima",min:0},{label:"leve",min:14},{label:"moderada",min:20},{label:"severa",min:29}] },
  pcl5:  { label: "PCL-5 (TEPT)", max: 80, cortes: [{label:"sin TEPT",min:0},{label:"probable TEPT",min:33}] },
  asrs:  { label: "ASRS (TDAH adultos)", max: 24, cortes: [{label:"baja",min:0},{label:"alta",min:14}] },
  escala_infantil: { label: "Escala infantil", max: 100, cortes: [{label:"normal",min:0}] },
  riesgo_suicida:  { label: "Riesgo suicida", max: 10, cortes: [{label:"bajo",min:0},{label:"moderado",min:4},{label:"alto",min:7}] },
  otro: { label: "Otra escala", max: 100, cortes: [{label:"n/a",min:0}] },
};

export default function PsicologiaPro() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [tab, setTab] = useTabParam("");
  const isResumen = !tab;
  if (isResumen) return <Navigate to="/dashboard" replace />;

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_psico_combo", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("pacientes") as any)
        .select("id, nombre, apellido").eq("workspace_id", wsId!).eq("activo", true).order("nombre").limit(500);
      return (data || []) as any[];
    },
  });

  const { data: pacientesPsico = [], refetch: refPP } = useQuery({
    queryKey: ["pacientes_psicologia", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("pacientes_psicologia" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: sesiones = [], refetch: refSes } = useQuery({
    queryKey: ["sesiones_psicologia", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("sesiones_psicologia" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("fecha_hora", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: notas = [], refetch: refNot } = useQuery({
    queryKey: ["notas_psicologia", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("notas_psicologia" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: evaluaciones = [], refetch: refEval } = useQuery({
    queryKey: ["evaluaciones_psicometricas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("evaluaciones_psicometricas" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("fecha_aplicacion", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: tareas = [], refetch: refTar } = useQuery({
    queryKey: ["tareas_terapeuticas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("tareas_terapeuticas" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("fecha_asignacion", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: seguimiento = [], refetch: refSeg } = useQuery({
    queryKey: ["seguimiento_emocional", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("seguimiento_emocional" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("fecha", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: prescripciones = [], refetch: refPres } = useQuery({
    queryKey: ["prescripciones_psiquiatricas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("prescripciones_psiquiatricas" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: paquetes = [], refetch: refPaq } = useQuery({
    queryKey: ["paquetes_sesiones", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("paquetes_sesiones" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  // --- Crear sesión ---
  const [openSes, setOpenSes] = useState(false);
  const [sesForm, setSesForm] = useState<any>({ paciente_id: "", fecha_hora: "", tipo_sesion: "psicoterapia_individual", modalidad: "presencial", motivo: "" });
  const crearSesion = async () => {
    if (!wsId || !sesForm.paciente_id || !sesForm.fecha_hora) { toast.error("Paciente y fecha requeridos"); return; }
    const { error } = await (supabase.from("sesiones_psicologia" as any) as any).insert({ workspace_id: wsId, ...sesForm });
    if (error) { toast.error(error.message); return; }
    toast.success("Sesión agendada"); setOpenSes(false); refSes();
    setSesForm({ paciente_id: "", fecha_hora: "", tipo_sesion: "psicoterapia_individual", modalidad: "presencial", motivo: "" });
  };

  // --- Crear nota ---
  const [openNot, setOpenNot] = useState(false);
  const [notForm, setNotForm] = useState<any>({ paciente_id: "", tipo_nota: "soap", contenido: "", es_privada: true });
  const crearNota = async () => {
    if (!wsId || !notForm.paciente_id) { toast.error("Paciente requerido"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from("notas_psicologia" as any) as any).insert({
      workspace_id: wsId, ...notForm, terapeuta_id: user?.id, created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Nota guardada"); setOpenNot(false); refNot();
    setNotForm({ paciente_id: "", tipo_nota: "soap", contenido: "", es_privada: true });
  };

  // --- Crear evaluación ---
  const [openEval, setOpenEval] = useState(false);
  const [evalForm, setEvalForm] = useState<any>({ paciente_id: "", escala: "phq9", puntaje_total: 0, notas: "" });
  const crearEval = async () => {
    if (!wsId || !evalForm.paciente_id) { toast.error("Paciente requerido"); return; }
    const info = ESCALAS_INFO[evalForm.escala];
    const cortesOrd = [...info.cortes].sort((a,b)=>b.min-a.min);
    const sev = cortesOrd.find(c => evalForm.puntaje_total >= c.min)?.label || null;
    const { error } = await (supabase.from("evaluaciones_psicometricas" as any) as any).insert({
      workspace_id: wsId, ...evalForm,
      severidad: ["mínima","leve","moderada","moderada_severa","severa","critica"].includes(sev||"") ? sev : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Evaluación registrada"); setOpenEval(false); refEval();
    setEvalForm({ paciente_id: "", escala: "phq9", puntaje_total: 0, notas: "" });
  };

  // --- Seguimiento emocional ---
  const [openSeg, setOpenSeg] = useState(false);
  const [segForm, setSegForm] = useState<any>({ paciente_id: "", animo: 5, ansiedad: 5, sueno: 5, estres: 5, disparadores: "", crisis_reciente: false, notas: "" });
  const crearSeg = async () => {
    if (!wsId || !segForm.paciente_id) { toast.error("Paciente requerido"); return; }
    const { error } = await (supabase.from("seguimiento_emocional" as any) as any).insert({ workspace_id: wsId, ...segForm });
    if (error) { toast.error(error.message); return; }
    toast.success("Registro emocional guardado"); setOpenSeg(false); refSeg();
  };

  // --- Prescripción ---
  const [openPres, setOpenPres] = useState(false);
  const [presForm, setPresForm] = useState<any>({ paciente_id: "", medicamento: "", dosis: "", frecuencia: "", adherencia: 100, notas: "" });
  const crearPres = async () => {
    if (!wsId || !presForm.paciente_id || !presForm.medicamento) { toast.error("Paciente y medicamento requeridos"); return; }
    const { error } = await (supabase.from("prescripciones_psiquiatricas" as any) as any).insert({ workspace_id: wsId, ...presForm });
    if (error) { toast.error(error.message); return; }
    toast.success("Prescripción registrada"); setOpenPres(false); refPres();
  };

  // --- Paquete ---
  const [openPaq, setOpenPaq] = useState(false);
  const [paqForm, setPaqForm] = useState<any>({ paciente_id: "", nombre: "Bono 4 sesiones", tipo: "bono_4", total_sesiones: 4, precio: 0, cobro_automatico: false });
  const crearPaq = async () => {
    if (!wsId || !paqForm.nombre) return;
    const { error } = await (supabase.from("paquetes_sesiones" as any) as any).insert({ workspace_id: wsId, ...paqForm });
    if (error) { toast.error(error.message); return; }
    toast.success("Paquete creado"); setOpenPaq(false); refPaq();
  };

  // --- Ficha paciente psico ---
  const [openPp, setOpenPp] = useState(false);
  const [ppForm, setPpForm] = useState<any>({ paciente_id: "", motivo_consulta: "", antecedentes_familiares: "", diagnosticos_previos: "", medicacion_actual: "", consumo_sustancias: "", riesgo_suicida: "ninguno", riesgo_autolesion: "ninguno", es_menor: false, tutor_nombre: "", tutor_telefono: "", contacto_emergencia_nombre: "", contacto_emergencia_telefono: "" });
  const crearPp = async () => {
    if (!wsId || !ppForm.paciente_id) return;
    const alerta = ["alto","critico"].includes(ppForm.riesgo_suicida) || ["alto","critico"].includes(ppForm.riesgo_autolesion);
    const { error } = await (supabase.from("pacientes_psicologia" as any) as any).insert({ workspace_id: wsId, ...ppForm, alerta_interna_activa: alerta });
    if (error) { toast.error(error.message); return; }
    toast.success("Ficha psico creada"); setOpenPp(false); refPP();
  };

  // KPIs
  const sesionesProximas = sesiones.filter((s:any)=>new Date(s.fecha_hora) >= new Date() && s.estado === "agendada").length;
  const noShow = sesiones.filter((s:any)=>s.estado === "no_show").length;
  const alertasRiesgo = pacientesPsico.filter((p:any)=>p.alerta_interna_activa).length;
  const tareasPendientes = tareas.filter((t:any)=>!t.cumplida).length;
  const prescActivas = prescripciones.filter((p:any)=>p.estado === "activa").length;
  const refillPend = prescripciones.filter((p:any)=>p.refill_pendiente).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6" /> Psicología & Psiquiatría Pro
        </h1>
        <p className="text-muted-foreground">Salud mental integral — sesiones, notas privadas, escalas, seguimiento emocional, psiquiatría y paquetes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{sesionesProximas}</p><p className="text-xs text-muted-foreground">Sesiones próximas</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" /><p className="text-2xl font-bold">{alertasRiesgo}</p><p className="text-xs text-muted-foreground">Alertas riesgo</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Activity className="h-5 w-5 mx-auto mb-1 text-yellow-600" /><p className="text-2xl font-bold">{noShow}</p><p className="text-xs text-muted-foreground">No-show</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><ListChecks className="h-5 w-5 mx-auto mb-1 text-blue-500" /><p className="text-2xl font-bold">{tareasPendientes}</p><p className="text-xs text-muted-foreground">Tareas pendientes</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Pill className="h-5 w-5 mx-auto mb-1 text-purple-600" /><p className="text-2xl font-bold">{prescActivas}</p><p className="text-xs text-muted-foreground">Prescripciones</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Heart className="h-5 w-5 mx-auto mb-1 text-pink-500" /><p className="text-2xl font-bold">{refillPend}</p><p className="text-xs text-muted-foreground">Refill pendiente</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="fichas">Fichas psico</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
          <TabsTrigger value="notas">Notas clínicas</TabsTrigger>
          <TabsTrigger value="evaluaciones">Tests/Escalas</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="psiquiatria">Psiquiatría</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
          <TabsTrigger value="nichos"><Layers className="h-4 w-4 mr-1" />Sub-módulos</TabsTrigger>
        </TabsList>

        {/* FICHAS */}
        <TabsContent value="fichas" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openPp} onOpenChange={setOpenPp}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva ficha</Button></DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Ficha psicológica del paciente</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={ppForm.paciente_id} onValueChange={(v)=>setPpForm({...ppForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Motivo de consulta</Label><Textarea value={ppForm.motivo_consulta} onChange={e=>setPpForm({...ppForm, motivo_consulta:e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Antecedentes familiares</Label><Textarea value={ppForm.antecedentes_familiares} onChange={e=>setPpForm({...ppForm, antecedentes_familiares:e.target.value})} /></div>
                    <div><Label>Diagnósticos previos</Label><Textarea value={ppForm.diagnosticos_previos} onChange={e=>setPpForm({...ppForm, diagnosticos_previos:e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Medicación actual</Label><Textarea value={ppForm.medicacion_actual} onChange={e=>setPpForm({...ppForm, medicacion_actual:e.target.value})} /></div>
                    <div><Label>Consumo sustancias</Label><Textarea value={ppForm.consumo_sustancias} onChange={e=>setPpForm({...ppForm, consumo_sustancias:e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Riesgo suicida</Label>
                      <Select value={ppForm.riesgo_suicida} onValueChange={v=>setPpForm({...ppForm, riesgo_suicida:v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{["ninguno","bajo","moderado","alto","critico"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Riesgo autolesión</Label>
                      <Select value={ppForm.riesgo_autolesion} onValueChange={v=>setPpForm({...ppForm, riesgo_autolesion:v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{["ninguno","bajo","moderado","alto","critico"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Contacto emergencia</Label><Input value={ppForm.contacto_emergencia_nombre} onChange={e=>setPpForm({...ppForm, contacto_emergencia_nombre:e.target.value})} /></div>
                    <div><Label>Teléfono emergencia</Label><Input value={ppForm.contacto_emergencia_telefono} onChange={e=>setPpForm({...ppForm, contacto_emergencia_telefono:e.target.value})} /></div>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={ppForm.es_menor} onChange={e=>setPpForm({...ppForm, es_menor:e.target.checked})} /><Label>Menor de edad (registrar tutor)</Label></div>
                  {ppForm.es_menor && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Tutor</Label><Input value={ppForm.tutor_nombre} onChange={e=>setPpForm({...ppForm, tutor_nombre:e.target.value})} /></div>
                      <div><Label>Teléfono tutor</Label><Input value={ppForm.tutor_telefono} onChange={e=>setPpForm({...ppForm, tutor_telefono:e.target.value})} /></div>
                    </div>
                  )}
                  <Button onClick={crearPp} className="w-full">Guardar ficha</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {pacientesPsico.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aún no hay fichas psicológicas</CardContent></Card>
          ) : pacientesPsico.map((p:any)=>(
            <Card key={p.id}><CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">{p.pacientes?.nombre} {p.pacientes?.apellido}
                    {p.alerta_interna_activa && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Riesgo alto</Badge>}
                    {p.es_menor && <Badge variant="outline" className="text-[10px]">Menor</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{p.motivo_consulta || "Sin motivo registrado"}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Riesgo suicida: <b>{p.riesgo_suicida}</b> · autolesión: <b>{p.riesgo_autolesion}</b>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* SESIONES */}
        <TabsContent value="sesiones" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openSes} onOpenChange={setOpenSes}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Agendar sesión</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Nueva sesión</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={sesForm.paciente_id} onValueChange={v=>setSesForm({...sesForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fecha y hora</Label><Input type="datetime-local" value={sesForm.fecha_hora} onChange={e=>setSesForm({...sesForm, fecha_hora:e.target.value})} /></div>
                  <div><Label>Tipo</Label>
                    <Select value={sesForm.tipo_sesion} onValueChange={v=>setSesForm({...sesForm, tipo_sesion:v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primera_evaluacion">Primera evaluación</SelectItem>
                        <SelectItem value="psicoterapia_individual">Psicoterapia individual</SelectItem>
                        <SelectItem value="terapia_pareja">Terapia de pareja</SelectItem>
                        <SelectItem value="terapia_familiar">Terapia familiar</SelectItem>
                        <SelectItem value="terapia_grupal">Terapia grupal</SelectItem>
                        <SelectItem value="seguimiento_psiquiatrico">Seguimiento psiquiátrico</SelectItem>
                        <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                        <SelectItem value="emergencia_emocional">Emergencia emocional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Modalidad</Label>
                    <Select value={sesForm.modalidad} onValueChange={v=>setSesForm({...sesForm, modalidad:v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="telefono">Teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Motivo</Label><Textarea value={sesForm.motivo} onChange={e=>setSesForm({...sesForm, motivo:e.target.value})} /></div>
                  <Button onClick={crearSesion} className="w-full">Agendar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {sesiones.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin sesiones</CardContent></Card>
          : sesiones.map((s:any)=>(
            <Card key={s.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.pacientes?.nombre} {s.pacientes?.apellido} · {s.tipo_sesion.replace(/_/g," ")}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(s.fecha_hora), "dd/MM/yyyy HH:mm", {locale:es})} · {s.modalidad}{s.recurrencia_semanal?" · semanal":""}</p>
              </div>
              <Badge variant={s.estado === "no_show" ? "destructive" : s.estado === "realizada" ? "default" : "secondary"}>{s.estado}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* NOTAS */}
        <TabsContent value="notas" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openNot} onOpenChange={setOpenNot}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva nota</Button></DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Nota clínica privada</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={notForm.paciente_id} onValueChange={v=>setNotForm({...notForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Tipo</Label>
                    <Select value={notForm.tipo_nota} onValueChange={v=>setNotForm({...notForm, tipo_nota:v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soap">SOAP</SelectItem>
                        <SelectItem value="evolutiva">Evolutiva libre</SelectItem>
                        <SelectItem value="plan_terapeutico">Plan terapéutico</SelectItem>
                        <SelectItem value="narrativa">Narrativa</SelectItem>
                        <SelectItem value="observacion_conductual">Observación conductual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Contenido</Label><Textarea rows={8} value={notForm.contenido} onChange={e=>setNotForm({...notForm, contenido:e.target.value})} /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={notForm.es_privada} onChange={e=>setNotForm({...notForm, es_privada:e.target.checked})} /><Label>Nota privada (solo terapeuta y supervisor)</Label></div>
                  <Button onClick={crearNota} className="w-full">Guardar nota</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {notas.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin notas</CardContent></Card>
          : notas.map((n:any)=>(
            <Card key={n.id}><CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium flex items-center gap-2">
                  {n.es_privada && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  {n.pacientes?.nombre} {n.pacientes?.apellido} · <Badge variant="outline">{n.tipo_nota.replace(/_/g," ")}</Badge>
                  {n.bloqueada_supervisor && <Badge variant="destructive" className="text-[10px]">Bloqueada</Badge>}
                </p>
                <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd/MM/yyyy HH:mm", {locale:es})}</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{n.contenido}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* EVALUACIONES */}
        <TabsContent value="evaluaciones" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openEval} onOpenChange={setOpenEval}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva evaluación</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Test psicométrico</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={evalForm.paciente_id} onValueChange={v=>setEvalForm({...evalForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Escala</Label>
                    <Select value={evalForm.escala} onValueChange={v=>setEvalForm({...evalForm, escala:v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{Object.entries(ESCALAS_INFO).map(([k,v])=>(<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Puntaje total (max {ESCALAS_INFO[evalForm.escala]?.max})</Label>
                    <Input type="number" value={evalForm.puntaje_total} onChange={e=>setEvalForm({...evalForm, puntaje_total:Number(e.target.value)})} />
                  </div>
                  <div><Label>Notas</Label><Textarea value={evalForm.notas} onChange={e=>setEvalForm({...evalForm, notas:e.target.value})} /></div>
                  <Button onClick={crearEval} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {evaluaciones.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin evaluaciones</CardContent></Card>
          : evaluaciones.map((e:any)=>(
            <Card key={e.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{e.pacientes?.nombre} {e.pacientes?.apellido} · {ESCALAS_INFO[e.escala]?.label || e.escala}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(e.fecha_aplicacion), "dd/MM/yyyy", {locale:es})} · puntaje {e.puntaje_total}</p>
              </div>
              {e.severidad && <Badge variant={["severa","critica","moderada_severa"].includes(e.severidad) ? "destructive" : "secondary"}>{e.severidad.replace(/_/g," ")}</Badge>}
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* TAREAS */}
        <TabsContent value="tareas" className="space-y-3">
          {tareas.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin tareas asignadas</CardContent></Card>
          : tareas.map((t:any)=>(
            <Card key={t.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.titulo}</p>
                <p className="text-sm text-muted-foreground">{t.pacientes?.nombre} {t.pacientes?.apellido} · {t.fecha_limite ? `Vence ${format(new Date(t.fecha_limite+"T12:00:00"), "dd/MM/yyyy")}` : "Sin fecha límite"}</p>
              </div>
              <Badge variant={t.cumplida ? "default" : "secondary"}>{t.cumplida ? "Cumplida" : "Pendiente"}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* SEGUIMIENTO EMOCIONAL */}
        <TabsContent value="seguimiento" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openSeg} onOpenChange={setOpenSeg}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Registrar</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Seguimiento emocional</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={segForm.paciente_id} onValueChange={v=>setSegForm({...segForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["animo","ansiedad","sueno","estres"] as const).map(k=>(
                      <div key={k}><Label className="capitalize">{k} (0-10)</Label>
                        <Input type="number" min={0} max={10} value={segForm[k]} onChange={e=>setSegForm({...segForm, [k]:Number(e.target.value)})} />
                      </div>
                    ))}
                  </div>
                  <div><Label>Disparadores</Label><Textarea value={segForm.disparadores} onChange={e=>setSegForm({...segForm, disparadores:e.target.value})} /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={segForm.crisis_reciente} onChange={e=>setSegForm({...segForm, crisis_reciente:e.target.checked})}/><Label>Crisis reciente</Label></div>
                  <Button onClick={crearSeg} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {seguimiento.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin registros emocionales</CardContent></Card>
          : seguimiento.map((s:any)=>(
            <Card key={s.id}><CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{s.pacientes?.nombre} {s.pacientes?.apellido}</p>
                <span className="text-xs text-muted-foreground">{format(new Date(s.fecha+"T12:00:00"), "dd/MM/yyyy")}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>Ánimo <b className="text-base">{s.animo}</b></div>
                <div>Ansiedad <b className="text-base">{s.ansiedad}</b></div>
                <div>Sueño <b className="text-base">{s.sueno}</b></div>
                <div>Estrés <b className="text-base">{s.estres}</b></div>
              </div>
              {s.crisis_reciente && <Badge variant="destructive" className="mt-2">Crisis reciente</Badge>}
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* PSIQUIATRÍA */}
        <TabsContent value="psiquiatria" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openPres} onOpenChange={setOpenPres}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Prescripción</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Prescripción psiquiátrica</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={presForm.paciente_id} onValueChange={v=>setPresForm({...presForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Medicamento</Label><Input value={presForm.medicamento} onChange={e=>setPresForm({...presForm, medicamento:e.target.value})} /></div>
                    <div><Label>Dosis</Label><Input value={presForm.dosis} onChange={e=>setPresForm({...presForm, dosis:e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Frecuencia</Label><Input value={presForm.frecuencia} onChange={e=>setPresForm({...presForm, frecuencia:e.target.value})} /></div>
                    <div><Label>Adherencia (%)</Label><Input type="number" min={0} max={100} value={presForm.adherencia} onChange={e=>setPresForm({...presForm, adherencia:Number(e.target.value)})} /></div>
                  </div>
                  <div><Label>Notas / efectos secundarios</Label><Textarea value={presForm.notas} onChange={e=>setPresForm({...presForm, notas:e.target.value})} /></div>
                  <Button onClick={crearPres} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {prescripciones.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin prescripciones</CardContent></Card>
          : prescripciones.map((p:any)=>(
            <Card key={p.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.medicamento} {p.dosis} · {p.frecuencia}</p>
                <p className="text-sm text-muted-foreground">{p.pacientes?.nombre} {p.pacientes?.apellido} · adherencia {p.adherencia ?? "-"}%</p>
              </div>
              <div className="text-right">
                <Badge>{p.estado}</Badge>
                {p.refill_pendiente && <Badge variant="destructive" className="ml-1">Refill</Badge>}
                {p.alerta_suspension_abrupta && <Badge variant="destructive" className="ml-1">Suspensión</Badge>}
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* PAQUETES */}
        <TabsContent value="paquetes" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openPaq} onOpenChange={setOpenPaq}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nuevo paquete</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Paquete / Bono / Membresía</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente (opcional)</Label>
                    <Select value={paqForm.paciente_id} onValueChange={v=>setPaqForm({...paqForm, paciente_id:v})}>
                      <SelectTrigger><SelectValue placeholder="Sin asignar"/></SelectTrigger>
                      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Nombre</Label><Input value={paqForm.nombre} onChange={e=>setPaqForm({...paqForm, nombre:e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Tipo</Label>
                      <Select value={paqForm.tipo} onValueChange={v=>setPaqForm({...paqForm, tipo:v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bono_4">Bono 4 sesiones</SelectItem>
                          <SelectItem value="bono_8">Bono 8 sesiones</SelectItem>
                          <SelectItem value="membresia_mensual">Membresía mensual</SelectItem>
                          <SelectItem value="paquete_custom">Paquete custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Total sesiones</Label><Input type="number" value={paqForm.total_sesiones} onChange={e=>setPaqForm({...paqForm, total_sesiones:Number(e.target.value)})} /></div>
                  </div>
                  <div><Label>Precio</Label><Input type="number" value={paqForm.precio} onChange={e=>setPaqForm({...paqForm, precio:Number(e.target.value)})} /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={paqForm.cobro_automatico} onChange={e=>setPaqForm({...paqForm, cobro_automatico:e.target.checked})} /><Label>Cobro automático</Label></div>
                  <Button onClick={crearPaq} className="w-full">Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {paquetes.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin paquetes</CardContent></Card>
          : paquetes.map((p:any)=>(
            <Card key={p.id}><CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.nombre} · {p.tipo?.replace(/_/g," ")}</p>
                <p className="text-sm text-muted-foreground">{p.pacientes?.nombre} {p.pacientes?.apellido} · {p.sesiones_usadas}/{p.total_sesiones} sesiones</p>
              </div>
              <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        {/* SUB-MÓDULOS DE NICHO */}
        <TabsContent value="nichos">
          <SubmodulosNicho pacientes={pacientes as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
