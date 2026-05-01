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
import { Activity, AlertTriangle, Award, ClipboardCheck, Users, Plus } from "lucide-react";

export default function GestionCalidad() {
  const { currentWorkspace } = useWorkspace();
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [comites, setComites] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [ncs, setNcs] = useState<any[]>([]);

  const [openInd, setOpenInd] = useState(false);
  const [openMed, setOpenMed] = useState(false);
  const [openEv, setOpenEv] = useState(false);
  const [openCom, setOpenCom] = useState(false);
  const [openAud, setOpenAud] = useState(false);

  const [indForm, setIndForm] = useState({ codigo: "", nombre: "", categoria: "clinico", estandar: "JCI", unidad: "%", meta: "", umbral_alerta: "", umbral_critico: "" });
  const [medForm, setMedForm] = useState({ indicador_id: "", periodo_inicio: "", periodo_fin: "", numerador: "", denominador: "" });
  const [evForm, setEvForm] = useState({ tipo: "medicacion", severidad: "leve", departamento: "", descripcion: "", causa_raiz: "" });
  const [comForm, setComForm] = useState({ nombre: "", tipo: "calidad", descripcion: "", frecuencia_reunion: "mensual" });
  const [audForm, setAudForm] = useState({ titulo: "", tipo: "interna", estandar: "JCI", fecha_inicio: "", alcance: "", auditor: "" });

  const load = async () => {
    if (!currentWorkspace) return;
    const ws = currentWorkspace.id;
    const [i, m, e, c, a, n] = await Promise.all([
      supabase.from("indicadores_calidad").select("*").eq("workspace_id", ws).order("nombre"),
      supabase.from("mediciones_indicadores").select("*, indicadores_calidad(nombre, unidad, meta)").eq("workspace_id", ws).order("periodo_inicio", { ascending: false }).limit(50),
      supabase.from("eventos_adversos").select("*").eq("workspace_id", ws).order("fecha_evento", { ascending: false }).limit(50),
      supabase.from("comites_calidad").select("*").eq("workspace_id", ws),
      supabase.from("auditorias_calidad").select("*").eq("workspace_id", ws).order("fecha_inicio", { ascending: false }),
      supabase.from("no_conformidades").select("*").eq("workspace_id", ws).order("fecha_deteccion", { ascending: false }).limit(50),
    ]);
    setIndicadores(i.data || []);
    setMediciones(m.data || []);
    setEventos(e.data || []);
    setComites(c.data || []);
    setAuditorias(a.data || []);
    setNcs(n.data || []);
  };

  useEffect(() => { load(); }, [currentWorkspace?.id]);

  const crearIndicador = async () => {
    if (!currentWorkspace) return;
    const { error } = await supabase.from("indicadores_calidad").insert({
      workspace_id: currentWorkspace.id,
      codigo: indForm.codigo,
      nombre: indForm.nombre,
      categoria: indForm.categoria,
      estandar: indForm.estandar,
      unidad: indForm.unidad,
      meta: indForm.meta ? +indForm.meta : null,
      umbral_alerta: indForm.umbral_alerta ? +indForm.umbral_alerta : null,
      umbral_critico: indForm.umbral_critico ? +indForm.umbral_critico : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Indicador creado");
    setOpenInd(false);
    load();
  };

  const registrarMedicion = async () => {
    if (!currentWorkspace) return;
    const num = +medForm.numerador, den = +medForm.denominador;
    const resultado = den > 0 ? +(num / den * 100).toFixed(2) : 0;
    const ind = indicadores.find(i => i.id === medForm.indicador_id);
    const cumple = ind?.meta ? resultado >= ind.meta : null;
    const { error } = await supabase.from("mediciones_indicadores").insert({
      workspace_id: currentWorkspace.id,
      indicador_id: medForm.indicador_id,
      periodo_inicio: medForm.periodo_inicio,
      periodo_fin: medForm.periodo_fin,
      numerador: num,
      denominador: den,
      resultado,
      cumple_meta: cumple,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Medición registrada: ${resultado}%`);
    setOpenMed(false);
    load();
  };

  const reportarEvento = async () => {
    if (!currentWorkspace) return;
    const { error } = await supabase.from("eventos_adversos").insert({
      workspace_id: currentWorkspace.id,
      tipo: evForm.tipo,
      severidad: evForm.severidad,
      departamento: evForm.departamento || null,
      descripcion: evForm.descripcion,
      causa_raiz: evForm.causa_raiz || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Evento adverso reportado");
    setOpenEv(false);
    load();
  };

  const crearComite = async () => {
    if (!currentWorkspace) return;
    const { error } = await supabase.from("comites_calidad").insert({ ...comForm, workspace_id: currentWorkspace.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Comité creado");
    setOpenCom(false);
    load();
  };

  const crearAuditoria = async () => {
    if (!currentWorkspace) return;
    const { error } = await supabase.from("auditorias_calidad").insert({ ...audForm, workspace_id: currentWorkspace.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Auditoría planificada");
    setOpenAud(false);
    load();
  };

  const sevColor: Record<string, string> = {
    leve: "bg-yellow-500", moderado: "bg-orange-500", grave: "bg-red-500", centinela: "bg-purple-700",
    observacion: "bg-blue-500", menor: "bg-yellow-500", mayor: "bg-orange-500", critica: "bg-red-600",
  };

  const eventosCentinela = eventos.filter(e => e.severidad === "centinela").length;
  const ncAbiertas = ncs.filter(n => n.estado === "abierta" || n.estado === "en_correccion").length;
  const cumplimiento = mediciones.length > 0
    ? Math.round(mediciones.filter(m => m.cumple_meta).length / mediciones.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Calidad</h1>
        <p className="text-muted-foreground">Indicadores clínicos, eventos adversos, comités y acreditación JCI/ISO</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{indicadores.length}</div><p className="text-xs text-muted-foreground">Indicadores activos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-500">{cumplimiento}%</div><p className="text-xs text-muted-foreground">Cumplimiento meta</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{eventosCentinela}</div><p className="text-xs text-muted-foreground">Eventos centinela</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-orange-500">{ncAbiertas}</div><p className="text-xs text-muted-foreground">No conformidades abiertas</p></CardContent></Card>
      </div>

      <Tabs defaultValue="indicadores">
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="indicadores"><Activity className="h-4 w-4 mr-1" />Indicadores</TabsTrigger>
          <TabsTrigger value="eventos"><AlertTriangle className="h-4 w-4 mr-1" />Eventos</TabsTrigger>
          <TabsTrigger value="comites"><Users className="h-4 w-4 mr-1" />Comités</TabsTrigger>
          <TabsTrigger value="auditorias"><ClipboardCheck className="h-4 w-4 mr-1" />Auditorías</TabsTrigger>
          <TabsTrigger value="nc"><Award className="h-4 w-4 mr-1" />No Conformidades</TabsTrigger>
        </TabsList>

        <TabsContent value="indicadores" className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Dialog open={openMed} onOpenChange={setOpenMed}>
              <DialogTrigger asChild><Button variant="outline" disabled={indicadores.length === 0}><Plus className="h-4 w-4 mr-1" />Nueva medición</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar medición</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Indicador</Label>
                    <Select value={medForm.indicador_id} onValueChange={v => setMedForm({...medForm, indicador_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>{indicadores.map(i => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Periodo inicio</Label><Input type="date" value={medForm.periodo_inicio} onChange={e => setMedForm({...medForm, periodo_inicio: e.target.value})} /></div>
                    <div><Label>Periodo fin</Label><Input type="date" value={medForm.periodo_fin} onChange={e => setMedForm({...medForm, periodo_fin: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Numerador</Label><Input type="number" value={medForm.numerador} onChange={e => setMedForm({...medForm, numerador: e.target.value})} /></div>
                    <div><Label>Denominador</Label><Input type="number" value={medForm.denominador} onChange={e => setMedForm({...medForm, denominador: e.target.value})} /></div>
                  </div>
                  <Button onClick={registrarMedicion} className="w-full">Calcular y guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={openInd} onOpenChange={setOpenInd}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo indicador</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear indicador</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Código</Label><Input value={indForm.codigo} onChange={e => setIndForm({...indForm, codigo: e.target.value})} placeholder="IND-001" /></div>
                    <div>
                      <Label>Estándar</Label>
                      <Select value={indForm.estandar} onValueChange={v => setIndForm({...indForm, estandar: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JCI">JCI</SelectItem><SelectItem value="ISO_9001">ISO 9001</SelectItem>
                          <SelectItem value="MINISTERIO">Ministerio</SelectItem><SelectItem value="INTERNO">Interno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Nombre</Label><Input value={indForm.nombre} onChange={e => setIndForm({...indForm, nombre: e.target.value})} placeholder="Tasa de readmisión a 30 días" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Categoría</Label>
                      <Select value={indForm.categoria} onValueChange={v => setIndForm({...indForm, categoria: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mortalidad">Mortalidad</SelectItem>
                          <SelectItem value="infecciones">Infecciones IAAS</SelectItem>
                          <SelectItem value="readmision">Readmisión</SelectItem>
                          <SelectItem value="estancia_media">Estancia media</SelectItem>
                          <SelectItem value="satisfaccion">Satisfacción</SelectItem>
                          <SelectItem value="seguridad">Seguridad paciente</SelectItem>
                          <SelectItem value="eficiencia">Eficiencia</SelectItem>
                          <SelectItem value="clinico">Clínico</SelectItem>
                          <SelectItem value="financiero">Financiero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Unidad</Label><Input value={indForm.unidad} onChange={e => setIndForm({...indForm, unidad: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Meta</Label><Input type="number" value={indForm.meta} onChange={e => setIndForm({...indForm, meta: e.target.value})} /></div>
                    <div><Label>Umbral alerta</Label><Input type="number" value={indForm.umbral_alerta} onChange={e => setIndForm({...indForm, umbral_alerta: e.target.value})} /></div>
                    <div><Label>Umbral crítico</Label><Input type="number" value={indForm.umbral_critico} onChange={e => setIndForm({...indForm, umbral_critico: e.target.value})} /></div>
                  </div>
                  <Button onClick={crearIndicador} className="w-full">Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {indicadores.map(i => {
              const meds = mediciones.filter(m => m.indicador_id === i.id);
              const ultima = meds[0];
              return (
                <Card key={i.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <Badge variant="outline" className="mb-1">{i.codigo}</Badge>
                        <div className="font-semibold text-sm">{i.nombre}</div>
                      </div>
                      <Badge>{i.estandar}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{i.categoria} · Meta: {i.meta ?? "—"}{i.unidad}</div>
                    {ultima && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-xs">Última: {ultima.periodo_inicio}</span>
                        <Badge variant={ultima.cumple_meta ? "default" : "destructive"}>{ultima.resultado}{i.unidad}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {indicadores.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Sin indicadores. Crea el primero.</p>}
          </div>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openEv} onOpenChange={setOpenEv}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Reportar evento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Reportar evento adverso</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={evForm.tipo} onValueChange={v => setEvForm({...evForm, tipo: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medicacion">Medicación</SelectItem>
                          <SelectItem value="caida">Caída</SelectItem>
                          <SelectItem value="infeccion_iaas">Infección IAAS</SelectItem>
                          <SelectItem value="error_quirurgico">Error quirúrgico</SelectItem>
                          <SelectItem value="identificacion">Identificación</SelectItem>
                          <SelectItem value="transfusion">Transfusión</SelectItem>
                          <SelectItem value="equipos">Equipos</SelectItem>
                          <SelectItem value="procedimiento">Procedimiento</SelectItem>
                          <SelectItem value="documentacion">Documentación</SelectItem>
                          <SelectItem value="comunicacion">Comunicación</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Severidad</Label>
                      <Select value={evForm.severidad} onValueChange={v => setEvForm({...evForm, severidad: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem><SelectItem value="moderado">Moderado</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem><SelectItem value="centinela">Centinela</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Departamento</Label><Input value={evForm.departamento} onChange={e => setEvForm({...evForm, departamento: e.target.value})} /></div>
                  <div><Label>Descripción</Label><Textarea rows={3} value={evForm.descripcion} onChange={e => setEvForm({...evForm, descripcion: e.target.value})} /></div>
                  <div><Label>Causa raíz (preliminar)</Label><Textarea rows={2} value={evForm.causa_raiz} onChange={e => setEvForm({...evForm, causa_raiz: e.target.value})} /></div>
                  <Button onClick={reportarEvento} className="w-full">Reportar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {eventos.map(e => (
                  <div key={e.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline">{e.numero || "—"}</Badge>
                        <Badge className={sevColor[e.severidad]}>{e.severidad}</Badge>
                        <Badge variant="secondary">{e.tipo}</Badge>
                      </div>
                      <Badge variant={e.estado === "cerrado" ? "default" : "secondary"}>{e.estado}</Badge>
                    </div>
                    <div className="text-sm">{e.descripcion}</div>
                    <div className="text-xs text-muted-foreground mt-1">{e.departamento || "—"} · {new Date(e.fecha_evento).toLocaleString()}</div>
                  </div>
                ))}
                {eventos.length === 0 && <p className="text-sm text-muted-foreground">Sin eventos reportados</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comites" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCom} onOpenChange={setOpenCom}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo comité</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear comité</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nombre</Label><Input value={comForm.nombre} onChange={e => setComForm({...comForm, nombre: e.target.value})} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={comForm.tipo} onValueChange={v => setComForm({...comForm, tipo: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="etica">Ética</SelectItem>
                        <SelectItem value="infecciones">Infecciones</SelectItem>
                        <SelectItem value="mortalidad">Mortalidad</SelectItem>
                        <SelectItem value="farmacoterapeutico">Farmacoterapéutico</SelectItem>
                        <SelectItem value="seguridad">Seguridad</SelectItem>
                        <SelectItem value="calidad">Calidad</SelectItem>
                        <SelectItem value="tejidos">Tejidos</SelectItem>
                        <SelectItem value="historia_clinica">Historia clínica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Descripción</Label><Textarea rows={2} value={comForm.descripcion} onChange={e => setComForm({...comForm, descripcion: e.target.value})} /></div>
                  <div><Label>Frecuencia</Label><Input value={comForm.frecuencia_reunion} onChange={e => setComForm({...comForm, frecuencia_reunion: e.target.value})} /></div>
                  <Button onClick={crearComite} className="w-full">Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {comites.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold">{c.nombre}</div>
                    <Badge>{c.tipo}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{c.descripcion}</div>
                  <div className="text-xs mt-2">Reunión: {c.frecuencia_reunion}</div>
                </CardContent>
              </Card>
            ))}
            {comites.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Sin comités</p>}
          </div>
        </TabsContent>

        <TabsContent value="auditorias" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openAud} onOpenChange={setOpenAud}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nueva auditoría</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Planificar auditoría</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Título</Label><Input value={audForm.titulo} onChange={e => setAudForm({...audForm, titulo: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={audForm.tipo} onValueChange={v => setAudForm({...audForm, tipo: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interna">Interna</SelectItem><SelectItem value="externa">Externa</SelectItem>
                          <SelectItem value="seguimiento">Seguimiento</SelectItem><SelectItem value="certificacion">Certificación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Estándar</Label>
                      <Select value={audForm.estandar} onValueChange={v => setAudForm({...audForm, estandar: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JCI">JCI</SelectItem><SelectItem value="ISO_9001">ISO 9001</SelectItem>
                          <SelectItem value="MINISTERIO">Ministerio</SelectItem><SelectItem value="INTERNO">Interno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Fecha inicio</Label><Input type="date" value={audForm.fecha_inicio} onChange={e => setAudForm({...audForm, fecha_inicio: e.target.value})} /></div>
                  <div><Label>Alcance</Label><Textarea rows={2} value={audForm.alcance} onChange={e => setAudForm({...audForm, alcance: e.target.value})} /></div>
                  <div><Label>Auditor</Label><Input value={audForm.auditor} onChange={e => setAudForm({...audForm, auditor: e.target.value})} /></div>
                  <Button onClick={crearAuditoria} className="w-full">Planificar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {auditorias.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between mb-1">
                    <div className="font-semibold">{a.titulo}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{a.estandar}</Badge>
                      <Badge>{a.tipo}</Badge>
                      <Badge variant={a.estado === "completada" ? "default" : "secondary"}>{a.estado}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{a.alcance}</div>
                  <div className="text-xs mt-1">Auditor: {a.auditor || "—"} · {a.fecha_inicio} {a.fecha_fin && `→ ${a.fecha_fin}`}</div>
                </CardContent>
              </Card>
            ))}
            {auditorias.length === 0 && <p className="text-sm text-muted-foreground">Sin auditorías</p>}
          </div>
        </TabsContent>

        <TabsContent value="nc" className="space-y-4">
          <div className="space-y-2">
            {ncs.map(n => (
              <Card key={n.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between mb-1">
                    <div className="flex gap-2 items-center">
                      <Badge className={sevColor[n.severidad]}>{n.severidad}</Badge>
                      <span className="font-semibold">{n.area}</span>
                    </div>
                    <Badge variant={n.estado === "cerrada" ? "default" : "destructive"}>{n.estado}</Badge>
                  </div>
                  <div className="text-sm">{n.descripcion}</div>
                  <div className="text-xs mt-1 text-muted-foreground">Detección: {n.fecha_deteccion} · Límite: {n.fecha_limite_cierre || "—"}</div>
                </CardContent>
              </Card>
            ))}
            {ncs.length === 0 && <p className="text-sm text-muted-foreground">Sin no conformidades. Se generan desde auditorías.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
