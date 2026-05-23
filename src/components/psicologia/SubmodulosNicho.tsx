import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Baby, Pill, Heart, Building2, Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type Paciente = { id: string; nombre: string; apellido: string };

export default function SubmodulosNicho({ pacientes }: { pacientes: Paciente[] }) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const sb = supabase as any;
  const qOpts = (key: string, table: string, order = "created_at") => ({
    queryKey: [key, wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await sb.from(table).select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId).order(order, { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const { data: infantil = [], refetch: refInf } = useQuery(qOpts("casos_infantil", "casos_psico_infantil"));
  const { data: adicciones = [], refetch: refAd } = useQuery(qOpts("casos_adic", "casos_adicciones"));
  const { data: recaidas = [], refetch: refRec } = useQuery(qOpts("recaidas", "recaidas_adicciones", "fecha"));
  const { data: pruebas = [], refetch: refPru } = useQuery(qOpts("pruebas_sus", "pruebas_sustancias", "fecha"));
  const { data: pareja = [], refetch: refPar } = useQuery({
    queryKey: ["casos_pareja", wsId], enabled: !!wsId,
    queryFn: async () => {
      const { data } = await sb.from("casos_pareja").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });
  const { data: acuerdos = [], refetch: refAcu } = useQuery({
    queryKey: ["acuerdos_pareja", wsId], enabled: !!wsId,
    queryFn: async () => {
      const { data } = await sb.from("acuerdos_pareja").select("*").eq("workspace_id", wsId).order("fecha", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });
  const { data: cronologia = [], refetch: refCro } = useQuery({
    queryKey: ["cronologia_par", wsId], enabled: !!wsId,
    queryFn: async () => {
      const { data } = await sb.from("cronologia_conflicto_pareja").select("*").eq("workspace_id", wsId).order("fecha", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });
  const { data: contratosEap = [], refetch: refCon } = useQuery({
    queryKey: ["contratos_eap", wsId], enabled: !!wsId,
    queryFn: async () => {
      const { data } = await sb.from("contratos_eap").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });
  const { data: empleadosEap = [], refetch: refEmp } = useQuery({
    queryKey: ["empleados_eap", wsId], enabled: !!wsId,
    queryFn: async () => {
      const { data } = await sb.from("empleados_eap").select("*, pacientes(nombre, apellido), contratos_eap(empresa_nombre)").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(300);
      return (data || []) as any[];
    },
  });

  // ===== Forms =====
  const [openInf, setOpenInf] = useState(false);
  const [infForm, setInfForm] = useState<any>({ paciente_id: "", padres_separados: false, tutor_legal: "", custodia: "", escuela_nombre: "", escuela_grado: "", escuela_contacto: "", rendimiento_escolar: "", conducta_observada: "", desarrollo_psicomotor: "", desarrollo_lenguaje: "", desarrollo_social: "", alertas_desarrollo: "", notas: "" });
  const saveInf = async () => {
    if (!wsId || !infForm.paciente_id) { toast.error("Paciente requerido"); return; }
    const { error } = await sb.from("casos_psico_infantil").insert({ workspace_id: wsId, ...infForm });
    if (error) return toast.error(error.message);
    toast.success("Caso infantil creado"); setOpenInf(false); refInf();
  };

  const [openAd, setOpenAd] = useState(false);
  const [adForm, setAdForm] = useState<any>({ paciente_id: "", sustancia_principal: "", tiempo_consumo: "", dias_sobriedad: 0, sponsor_nombre: "", sponsor_telefono: "", grupo_apoyo: "", plan_recuperacion: "", notas: "" });
  const saveAd = async () => {
    if (!wsId || !adForm.paciente_id) { toast.error("Paciente requerido"); return; }
    const { error } = await sb.from("casos_adicciones").insert({ workspace_id: wsId, ...adForm });
    if (error) return toast.error(error.message);
    toast.success("Caso de adicciones creado"); setOpenAd(false); refAd();
  };

  const [openRec, setOpenRec] = useState(false);
  const [recForm, setRecForm] = useState<any>({ caso_id: "", paciente_id: "", fecha: new Date().toISOString().slice(0,10), sustancia: "", desencadenante: "", duracion: "", intervencion: "" });
  const saveRec = async () => {
    if (!wsId || !recForm.caso_id) { toast.error("Caso requerido"); return; }
    const caso = adicciones.find((c:any)=>c.id===recForm.caso_id);
    const { error } = await sb.from("recaidas_adicciones").insert({ workspace_id: wsId, ...recForm, paciente_id: caso?.paciente_id });
    if (error) return toast.error(error.message);
    toast.success("Recaída registrada"); setOpenRec(false); refRec();
  };

  const [openPru, setOpenPru] = useState(false);
  const [pruForm, setPruForm] = useState<any>({ caso_id: "", paciente_id: "", fecha: new Date().toISOString().slice(0,10), tipo_prueba: "orina", resultado: "negativo", detalles: "", laboratorio: "" });
  const savePru = async () => {
    if (!wsId || !pruForm.caso_id) { toast.error("Caso requerido"); return; }
    const caso = adicciones.find((c:any)=>c.id===pruForm.caso_id);
    const { error } = await sb.from("pruebas_sustancias").insert({ workspace_id: wsId, ...pruForm, paciente_id: caso?.paciente_id });
    if (error) return toast.error(error.message);
    toast.success("Prueba registrada"); setOpenPru(false); refPru();
  };

  const [openPar, setOpenPar] = useState(false);
  const [parForm, setParForm] = useState<any>({ paciente_id_a: "", paciente_id_b: "", pareja_nombre: "", pareja_telefono: "", pareja_email: "", tiempo_relacion: "", motivo_consulta: "", hijos_comunes: 0 });
  const savePar = async () => {
    if (!wsId || !parForm.paciente_id_a) { toast.error("Paciente A requerido"); return; }
    const payload: any = { workspace_id: wsId, ...parForm };
    if (!payload.paciente_id_b) delete payload.paciente_id_b;
    const { error } = await sb.from("casos_pareja").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Caso de pareja creado"); setOpenPar(false); refPar();
  };

  const [openAcu, setOpenAcu] = useState(false);
  const [acuForm, setAcuForm] = useState<any>({ caso_id: "", fecha: new Date().toISOString().slice(0,10), titulo: "", descripcion: "", responsable: "", fecha_revision: "" });
  const saveAcu = async () => {
    if (!wsId || !acuForm.caso_id || !acuForm.titulo) { toast.error("Caso y título requeridos"); return; }
    const payload = { workspace_id: wsId, ...acuForm, fecha_revision: acuForm.fecha_revision || null };
    const { error } = await sb.from("acuerdos_pareja").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Acuerdo registrado"); setOpenAcu(false); refAcu();
  };

  const [openCro, setOpenCro] = useState(false);
  const [croForm, setCroForm] = useState<any>({ caso_id: "", fecha: new Date().toISOString().slice(0,10), evento: "", impacto: "medio", notas: "" });
  const saveCro = async () => {
    if (!wsId || !croForm.caso_id || !croForm.evento) { toast.error("Caso y evento requeridos"); return; }
    const { error } = await sb.from("cronologia_conflicto_pareja").insert({ workspace_id: wsId, ...croForm });
    if (error) return toast.error(error.message);
    toast.success("Evento registrado"); setOpenCro(false); refCro();
  };

  const [openCon, setOpenCon] = useState(false);
  const [conForm, setConForm] = useState<any>({ empresa_nombre: "", contacto_rrhh: "", email_rrhh: "", telefono_rrhh: "", sesiones_anuales_por_empleado: 6, fecha_inicio: "", fecha_fin: "", tarifa_sesion: 0 });
  const saveCon = async () => {
    if (!wsId || !conForm.empresa_nombre) { toast.error("Empresa requerida"); return; }
    const payload = { workspace_id: wsId, ...conForm, fecha_inicio: conForm.fecha_inicio || null, fecha_fin: conForm.fecha_fin || null };
    const { error } = await sb.from("contratos_eap").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Contrato EAP creado"); setOpenCon(false); refCon();
  };

  const [openEmp, setOpenEmp] = useState(false);
  const [empForm, setEmpForm] = useState<any>({ contrato_id: "", paciente_id: "", codigo_anonimo: "", departamento: "", cargo: "", sesiones_disponibles: 6 });
  const saveEmp = async () => {
    if (!wsId || !empForm.contrato_id || !empForm.paciente_id || !empForm.codigo_anonimo) { toast.error("Contrato, paciente y código requeridos"); return; }
    const { error } = await sb.from("empleados_eap").insert({ workspace_id: wsId, ...empForm });
    if (error) return toast.error(error.message);
    toast.success("Empleado EAP registrado"); setOpenEmp(false); refEmp();
  };

  const PacienteSelect = ({ value, onChange, placeholder = "Seleccionar paciente..." }: any) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{pacientes.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
    </Select>
  );

  return (
    <Tabs defaultValue="infantil">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="infantil"><Baby className="h-4 w-4 mr-1" />Infantil</TabsTrigger>
        <TabsTrigger value="adicciones"><Pill className="h-4 w-4 mr-1" />Adicciones</TabsTrigger>
        <TabsTrigger value="pareja"><Heart className="h-4 w-4 mr-1" />Pareja</TabsTrigger>
        <TabsTrigger value="eap"><Building2 className="h-4 w-4 mr-1" />Corporativo / EAP</TabsTrigger>
      </TabsList>

      {/* INFANTIL */}
      <TabsContent value="infantil" className="space-y-3">
        <div className="flex justify-end">
          <Dialog open={openInf} onOpenChange={setOpenInf}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nuevo caso infantil</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Caso de psicología infantil</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Paciente (menor)</Label><PacienteSelect value={infForm.paciente_id} onChange={(v:string)=>setInfForm({...infForm, paciente_id:v})} /></div>
                <div className="flex items-center gap-2"><input type="checkbox" checked={infForm.padres_separados} onChange={e=>setInfForm({...infForm, padres_separados:e.target.checked})} /><Label>Padres separados</Label></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tutor legal</Label><Input value={infForm.tutor_legal} onChange={e=>setInfForm({...infForm, tutor_legal:e.target.value})} /></div>
                  <div><Label>Custodia</Label><Input value={infForm.custodia} onChange={e=>setInfForm({...infForm, custodia:e.target.value})} placeholder="madre / padre / compartida..." /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Escuela</Label><Input value={infForm.escuela_nombre} onChange={e=>setInfForm({...infForm, escuela_nombre:e.target.value})} /></div>
                  <div><Label>Grado</Label><Input value={infForm.escuela_grado} onChange={e=>setInfForm({...infForm, escuela_grado:e.target.value})} /></div>
                  <div><Label>Contacto escolar</Label><Input value={infForm.escuela_contacto} onChange={e=>setInfForm({...infForm, escuela_contacto:e.target.value})} /></div>
                </div>
                <div><Label>Rendimiento escolar</Label><Textarea value={infForm.rendimiento_escolar} onChange={e=>setInfForm({...infForm, rendimiento_escolar:e.target.value})} /></div>
                <div><Label>Conducta observada</Label><Textarea value={infForm.conducta_observada} onChange={e=>setInfForm({...infForm, conducta_observada:e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Desarrollo psicomotor</Label><Textarea rows={2} value={infForm.desarrollo_psicomotor} onChange={e=>setInfForm({...infForm, desarrollo_psicomotor:e.target.value})} /></div>
                  <div><Label>Desarrollo lenguaje</Label><Textarea rows={2} value={infForm.desarrollo_lenguaje} onChange={e=>setInfForm({...infForm, desarrollo_lenguaje:e.target.value})} /></div>
                  <div><Label>Desarrollo social</Label><Textarea rows={2} value={infForm.desarrollo_social} onChange={e=>setInfForm({...infForm, desarrollo_social:e.target.value})} /></div>
                </div>
                <div><Label>Alertas de desarrollo</Label><Textarea value={infForm.alertas_desarrollo} onChange={e=>setInfForm({...infForm, alertas_desarrollo:e.target.value})} /></div>
                <div><Label>Notas</Label><Textarea value={infForm.notas} onChange={e=>setInfForm({...infForm, notas:e.target.value})} /></div>
                <Button onClick={saveInf} className="w-full">Guardar caso</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {infantil.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin casos infantiles</CardContent></Card>
        : infantil.map((c:any)=>(
          <Card key={c.id}><CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium flex items-center gap-2">
                {c.pacientes?.nombre} {c.pacientes?.apellido}
                {c.padres_separados && <Badge variant="outline" className="text-[10px]">Padres separados</Badge>}
                {c.alertas_desarrollo && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Alerta desarrollo</Badge>}
              </p>
              <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd/MM/yyyy", {locale:es})}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {c.escuela_nombre && <>Escuela: <b>{c.escuela_nombre}</b> ({c.escuela_grado || "—"}) · </>}
              {c.custodia && <>Custodia: <b>{c.custodia}</b></>}
            </p>
            {c.conducta_observada && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Conducta: {c.conducta_observada}</p>}
          </CardContent></Card>
        ))}
      </TabsContent>

      {/* ADICCIONES */}
      <TabsContent value="adicciones" className="space-y-3">
        <div className="flex flex-wrap gap-2 justify-end">
          <Dialog open={openAd} onOpenChange={setOpenAd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Caso adicción</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Caso de adicciones</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Paciente</Label><PacienteSelect value={adForm.paciente_id} onChange={(v:string)=>setAdForm({...adForm, paciente_id:v})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sustancia principal</Label><Input value={adForm.sustancia_principal} onChange={e=>setAdForm({...adForm, sustancia_principal:e.target.value})} /></div>
                  <div><Label>Tiempo de consumo</Label><Input value={adForm.tiempo_consumo} onChange={e=>setAdForm({...adForm, tiempo_consumo:e.target.value})} placeholder="ej. 5 años" /></div>
                </div>
                <div><Label>Días de sobriedad</Label><Input type="number" value={adForm.dias_sobriedad} onChange={e=>setAdForm({...adForm, dias_sobriedad:Number(e.target.value)})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sponsor</Label><Input value={adForm.sponsor_nombre} onChange={e=>setAdForm({...adForm, sponsor_nombre:e.target.value})} /></div>
                  <div><Label>Teléfono sponsor</Label><Input value={adForm.sponsor_telefono} onChange={e=>setAdForm({...adForm, sponsor_telefono:e.target.value})} /></div>
                </div>
                <div><Label>Grupo de apoyo</Label><Input value={adForm.grupo_apoyo} onChange={e=>setAdForm({...adForm, grupo_apoyo:e.target.value})} placeholder="AA, NA, etc." /></div>
                <div><Label>Plan de recuperación</Label><Textarea value={adForm.plan_recuperacion} onChange={e=>setAdForm({...adForm, plan_recuperacion:e.target.value})} /></div>
                <Button onClick={saveAd} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openRec} onOpenChange={setOpenRec}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Recaída</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Registrar recaída</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Caso</Label>
                  <Select value={recForm.caso_id} onValueChange={v=>setRecForm({...recForm, caso_id:v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar caso..."/></SelectTrigger>
                    <SelectContent>{adicciones.map((c:any)=>(<SelectItem key={c.id} value={c.id}>{c.pacientes?.nombre} {c.pacientes?.apellido} · {c.sustancia_principal}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha</Label><Input type="date" value={recForm.fecha} onChange={e=>setRecForm({...recForm, fecha:e.target.value})} /></div>
                <div><Label>Sustancia</Label><Input value={recForm.sustancia} onChange={e=>setRecForm({...recForm, sustancia:e.target.value})} /></div>
                <div><Label>Desencadenante</Label><Textarea value={recForm.desencadenante} onChange={e=>setRecForm({...recForm, desencadenante:e.target.value})} /></div>
                <div><Label>Duración</Label><Input value={recForm.duracion} onChange={e=>setRecForm({...recForm, duracion:e.target.value})} placeholder="horas / días" /></div>
                <div><Label>Intervención</Label><Textarea value={recForm.intervencion} onChange={e=>setRecForm({...recForm, intervencion:e.target.value})} /></div>
                <Button onClick={saveRec} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openPru} onOpenChange={setOpenPru}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Prueba</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Prueba de sustancias</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Caso</Label>
                  <Select value={pruForm.caso_id} onValueChange={v=>setPruForm({...pruForm, caso_id:v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar caso..."/></SelectTrigger>
                    <SelectContent>{adicciones.map((c:any)=>(<SelectItem key={c.id} value={c.id}>{c.pacientes?.nombre} {c.pacientes?.apellido}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha</Label><Input type="date" value={pruForm.fecha} onChange={e=>setPruForm({...pruForm, fecha:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label>
                    <Select value={pruForm.tipo_prueba} onValueChange={v=>setPruForm({...pruForm, tipo_prueba:v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{["orina","sangre","saliva","cabello","aliento"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Resultado</Label>
                    <Select value={pruForm.resultado} onValueChange={v=>setPruForm({...pruForm, resultado:v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{["negativo","positivo","no_concluyente"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Laboratorio</Label><Input value={pruForm.laboratorio} onChange={e=>setPruForm({...pruForm, laboratorio:e.target.value})} /></div>
                <div><Label>Detalles</Label><Textarea value={pruForm.detalles} onChange={e=>setPruForm({...pruForm, detalles:e.target.value})} /></div>
                <Button onClick={savePru} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Casos activos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {adicciones.length === 0 ? <p className="text-xs text-muted-foreground">Sin casos</p>
              : adicciones.map((c:any)=>(
                <div key={c.id} className="border rounded p-2">
                  <p className="text-sm font-medium">{c.pacientes?.nombre} {c.pacientes?.apellido} · {c.sustancia_principal || "—"}</p>
                  <p className="text-xs text-muted-foreground">Sobriedad: <b>{c.dias_sobriedad ?? 0}</b> días · Sponsor: {c.sponsor_nombre || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recaídas recientes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recaidas.length === 0 ? <p className="text-xs text-muted-foreground">Sin recaídas</p>
              : recaidas.slice(0,10).map((r:any)=>(
                <div key={r.id} className="border rounded p-2">
                  <p className="text-sm">{r.pacientes?.nombre} {r.pacientes?.apellido} · {r.sustancia || "—"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.fecha+"T12:00:00"), "dd/MM/yyyy")} · {r.duracion || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pruebas recientes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pruebas.length === 0 ? <p className="text-xs text-muted-foreground">Sin pruebas</p>
              : pruebas.slice(0,10).map((p:any)=>(
                <div key={p.id} className="border rounded p-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{p.pacientes?.nombre} {p.pacientes?.apellido} · {p.tipo_prueba}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.fecha+"T12:00:00"), "dd/MM/yyyy")} · Lab: {p.laboratorio || "—"}</p>
                  </div>
                  <Badge variant={p.resultado === "positivo" ? "destructive" : p.resultado === "negativo" ? "default" : "secondary"}>{p.resultado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* PAREJA */}
      <TabsContent value="pareja" className="space-y-3">
        <div className="flex flex-wrap gap-2 justify-end">
          <Dialog open={openPar} onOpenChange={setOpenPar}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Caso de pareja</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo caso de pareja</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Paciente A</Label><PacienteSelect value={parForm.paciente_id_a} onChange={(v:string)=>setParForm({...parForm, paciente_id_a:v})} /></div>
                <div><Label>Paciente B (opcional)</Label><PacienteSelect value={parForm.paciente_id_b} onChange={(v:string)=>setParForm({...parForm, paciente_id_b:v})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nombre de la pareja</Label><Input value={parForm.pareja_nombre} onChange={e=>setParForm({...parForm, pareja_nombre:e.target.value})} /></div>
                  <div><Label>Tiempo de relación</Label><Input value={parForm.tiempo_relacion} onChange={e=>setParForm({...parForm, tiempo_relacion:e.target.value})} placeholder="ej. 8 años" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Teléfono</Label><Input value={parForm.pareja_telefono} onChange={e=>setParForm({...parForm, pareja_telefono:e.target.value})} /></div>
                  <div><Label>Email</Label><Input value={parForm.pareja_email} onChange={e=>setParForm({...parForm, pareja_email:e.target.value})} /></div>
                  <div><Label>Hijos comunes</Label><Input type="number" value={parForm.hijos_comunes} onChange={e=>setParForm({...parForm, hijos_comunes:Number(e.target.value)})} /></div>
                </div>
                <div><Label>Motivo de consulta</Label><Textarea value={parForm.motivo_consulta} onChange={e=>setParForm({...parForm, motivo_consulta:e.target.value})} /></div>
                <Button onClick={savePar} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openAcu} onOpenChange={setOpenAcu}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Acuerdo</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Acuerdo de pareja</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Caso</Label>
                  <Select value={acuForm.caso_id} onValueChange={v=>setAcuForm({...acuForm, caso_id:v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar caso..."/></SelectTrigger>
                    <SelectContent>{pareja.map((c:any)=>(<SelectItem key={c.id} value={c.id}>{c.pareja_nombre || c.id.slice(0,8)}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha</Label><Input type="date" value={acuForm.fecha} onChange={e=>setAcuForm({...acuForm, fecha:e.target.value})} /></div>
                <div><Label>Título</Label><Input value={acuForm.titulo} onChange={e=>setAcuForm({...acuForm, titulo:e.target.value})} /></div>
                <div><Label>Descripción</Label><Textarea value={acuForm.descripcion} onChange={e=>setAcuForm({...acuForm, descripcion:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Responsable</Label><Input value={acuForm.responsable} onChange={e=>setAcuForm({...acuForm, responsable:e.target.value})} /></div>
                  <div><Label>Revisión</Label><Input type="date" value={acuForm.fecha_revision} onChange={e=>setAcuForm({...acuForm, fecha_revision:e.target.value})} /></div>
                </div>
                <Button onClick={saveAcu} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openCro} onOpenChange={setOpenCro}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Evento cronología</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Evento cronología conflicto</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Caso</Label>
                  <Select value={croForm.caso_id} onValueChange={v=>setCroForm({...croForm, caso_id:v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar caso..."/></SelectTrigger>
                    <SelectContent>{pareja.map((c:any)=>(<SelectItem key={c.id} value={c.id}>{c.pareja_nombre || c.id.slice(0,8)}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha</Label><Input type="date" value={croForm.fecha} onChange={e=>setCroForm({...croForm, fecha:e.target.value})} /></div>
                <div><Label>Evento</Label><Textarea value={croForm.evento} onChange={e=>setCroForm({...croForm, evento:e.target.value})} /></div>
                <div><Label>Impacto</Label>
                  <Select value={croForm.impacto} onValueChange={v=>setCroForm({...croForm, impacto:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{["bajo","medio","alto","critico"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Notas</Label><Textarea value={croForm.notas} onChange={e=>setCroForm({...croForm, notas:e.target.value})} /></div>
                <Button onClick={saveCro} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Casos de pareja</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pareja.length === 0 ? <p className="text-xs text-muted-foreground">Sin casos</p>
              : pareja.map((c:any)=>(
                <div key={c.id} className="border rounded p-2">
                  <p className="text-sm font-medium">{c.pareja_nombre || "Caso pareja"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.motivo_consulta || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Acuerdos pendientes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {acuerdos.filter((a:any)=>!a.cumplido).slice(0,10).map((a:any)=>(
                <div key={a.id} className="border rounded p-2 flex items-center justify-between">
                  <div><p className="text-sm">{a.titulo}</p><p className="text-xs text-muted-foreground">{a.responsable || "—"}</p></div>
                  <Badge variant="secondary">Pendiente</Badge>
                </div>
              ))}
              {acuerdos.filter((a:any)=>!a.cumplido).length === 0 && <p className="text-xs text-muted-foreground">Sin pendientes</p>}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cronología de conflictos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {cronologia.length === 0 ? <p className="text-xs text-muted-foreground">Sin eventos</p>
              : cronologia.slice(0,10).map((e:any)=>(
                <div key={e.id} className="border rounded p-2 flex items-center justify-between">
                  <div><p className="text-sm line-clamp-1">{e.evento}</p><p className="text-xs text-muted-foreground">{format(new Date(e.fecha+"T12:00:00"), "dd/MM/yyyy")}</p></div>
                  <Badge variant={["alto","critico"].includes(e.impacto) ? "destructive" : "outline"}>{e.impacto}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* EAP */}
      <TabsContent value="eap" className="space-y-3">
        <div className="flex gap-2 justify-end">
          <Dialog open={openCon} onOpenChange={setOpenCon}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Contrato EAP</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Nuevo contrato corporativo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Empresa</Label><Input value={conForm.empresa_nombre} onChange={e=>setConForm({...conForm, empresa_nombre:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Contacto RRHH</Label><Input value={conForm.contacto_rrhh} onChange={e=>setConForm({...conForm, contacto_rrhh:e.target.value})} /></div>
                  <div><Label>Email RRHH</Label><Input value={conForm.email_rrhh} onChange={e=>setConForm({...conForm, email_rrhh:e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Teléfono RRHH</Label><Input value={conForm.telefono_rrhh} onChange={e=>setConForm({...conForm, telefono_rrhh:e.target.value})} /></div>
                  <div><Label>Sesiones/año por empleado</Label><Input type="number" value={conForm.sesiones_anuales_por_empleado} onChange={e=>setConForm({...conForm, sesiones_anuales_por_empleado:Number(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Inicio</Label><Input type="date" value={conForm.fecha_inicio} onChange={e=>setConForm({...conForm, fecha_inicio:e.target.value})} /></div>
                  <div><Label>Fin</Label><Input type="date" value={conForm.fecha_fin} onChange={e=>setConForm({...conForm, fecha_fin:e.target.value})} /></div>
                  <div><Label>Tarifa sesión</Label><Input type="number" step="0.01" value={conForm.tarifa_sesion} onChange={e=>setConForm({...conForm, tarifa_sesion:Number(e.target.value)})} /></div>
                </div>
                <Button onClick={saveCon} className="w-full">Crear contrato</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openEmp} onOpenChange={setOpenEmp}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Empleado anónimo</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Empleado cubierto (anonimizado)</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Contrato</Label>
                  <Select value={empForm.contrato_id} onValueChange={v=>{
                    const c = contratosEap.find((x:any)=>x.id===v);
                    setEmpForm({...empForm, contrato_id:v, sesiones_disponibles: c?.sesiones_anuales_por_empleado || 6});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                    <SelectContent>{contratosEap.map((c:any)=>(<SelectItem key={c.id} value={c.id}>{c.empresa_nombre}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Paciente real</Label><PacienteSelect value={empForm.paciente_id} onChange={(v:string)=>setEmpForm({...empForm, paciente_id:v})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Código anónimo</Label><Input value={empForm.codigo_anonimo} onChange={e=>setEmpForm({...empForm, codigo_anonimo:e.target.value})} placeholder="EMP-001" /></div>
                  <div><Label>Sesiones disponibles</Label><Input type="number" value={empForm.sesiones_disponibles} onChange={e=>setEmpForm({...empForm, sesiones_disponibles:Number(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Departamento</Label><Input value={empForm.departamento} onChange={e=>setEmpForm({...empForm, departamento:e.target.value})} /></div>
                  <div><Label>Cargo</Label><Input value={empForm.cargo} onChange={e=>setEmpForm({...empForm, cargo:e.target.value})} /></div>
                </div>
                <Button onClick={saveEmp} className="w-full">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contratos activos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {contratosEap.length === 0 ? <p className="text-xs text-muted-foreground">Sin contratos</p>
              : contratosEap.map((c:any)=>(
                <div key={c.id} className="border rounded p-2">
                  <p className="text-sm font-medium">{c.empresa_nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.sesiones_anuales_por_empleado} sesiones/empleado · {c.activo ? "Activo" : "Inactivo"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Empleados (anonimizado)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {empleadosEap.length === 0 ? <p className="text-xs text-muted-foreground">Sin empleados registrados</p>
              : empleadosEap.slice(0,15).map((e:any)=>(
                <div key={e.id} className="border rounded p-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono">{e.codigo_anonimo}</p>
                    <p className="text-xs text-muted-foreground">{e.contratos_eap?.empresa_nombre} · {e.departamento || "—"}</p>
                  </div>
                  <Badge variant="outline">{e.sesiones_usadas}/{e.sesiones_disponibles}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
