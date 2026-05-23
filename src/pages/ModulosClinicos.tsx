import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Syringe, Activity, Baby, Heart, HardHat } from "lucide-react";

export default function ModulosClinicos() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [vacCat, setVacCat] = useState<any[]>([]);
  const [cronicos, setCronicos] = useState<any[]>([]);
  const [enr, setEnr] = useState<any[]>([]);
  const [prenatal, setPrenatal] = useState<any[]>([]);
  const [ped, setPed] = useState<any[]>([]);
  const [ocup, setOcup] = useState<any[]>([]);

  const [vacOpen, setVacOpen] = useState(false);
  const [vacForm, setVacForm] = useState({ paciente_id: "", vacuna_id: "", vacuna_nombre: "", dosis: 1, fecha_aplicacion: new Date().toISOString().slice(0, 10), lote: "" });

  const load = async () => {
    if (!wsId) return;
    const [p, v, vc, pc, ec, pr, pd, oc] = await Promise.all([
      supabase.from("pacientes").select("id,nombre,apellido").eq("workspace_id", wsId).order("nombre").limit(500),
      supabase.from("vacunas_paciente").select("*, pacientes(nombre,apellido)").eq("workspace_id", wsId).order("fecha_aplicacion", { ascending: false }).limit(100),
      supabase.from("vacunas_catalogo").select("*").eq("activo", true).order("nombre"),
      supabase.from("programas_cronicos").select("*").eq("workspace_id", wsId).order("nombre"),
      supabase.from("enrolamientos_cronicos").select("*, pacientes(nombre,apellido), programas_cronicos(nombre)").eq("workspace_id", wsId).limit(100),
      supabase.from("controles_prenatales").select("*, pacientes(nombre,apellido)").eq("workspace_id", wsId).order("fecha_control", { ascending: false }).limit(100),
      supabase.from("controles_pediatricos").select("*, pacientes(nombre,apellido)").eq("workspace_id", wsId).order("fecha", { ascending: false }).limit(100),
      supabase.from("salud_ocupacional").select("*, pacientes(nombre,apellido)").eq("workspace_id", wsId).order("fecha", { ascending: false }).limit(100),
    ]);
    setPacientes(p.data || []); setVacunas(v.data || []); setVacCat(vc.data || []);
    setCronicos(pc.data || []); setEnr(ec.data || []); setPrenatal(pr.data || []);
    setPed(pd.data || []); setOcup(oc.data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const saveVac = async () => {
    if (!wsId || !vacForm.paciente_id) return toast.error("Seleccione paciente");
    const nombre = vacForm.vacuna_id ? vacCat.find(v => v.id === vacForm.vacuna_id)?.nombre : vacForm.vacuna_nombre;
    if (!nombre) return toast.error("Seleccione vacuna");
    const { error } = await supabase.from("vacunas_paciente").insert({ ...vacForm, vacuna_nombre: nombre, workspace_id: wsId, vacuna_id: vacForm.vacuna_id || null });
    if (error) return toast.error(error.message);
    toast.success("Vacuna registrada"); setVacOpen(false); load();
    setVacForm({ paciente_id: "", vacuna_id: "", vacuna_nombre: "", dosis: 1, fecha_aplicacion: new Date().toISOString().slice(0, 10), lote: "" });
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Módulos Clínicos Especializados</h1>
      <p className="text-sm text-muted-foreground">Vacunación, programas crónicos, prenatal, pediatría y salud ocupacional.</p>

      <Tabs defaultValue="vac">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="vac"><Syringe className="h-4 w-4 mr-1" /> Vacunación</TabsTrigger>
          <TabsTrigger value="cron"><Heart className="h-4 w-4 mr-1" /> Crónicos</TabsTrigger>
          <TabsTrigger value="pre"><Activity className="h-4 w-4 mr-1" /> Prenatal</TabsTrigger>
          <TabsTrigger value="ped"><Baby className="h-4 w-4 mr-1" /> Pediatría</TabsTrigger>
          <TabsTrigger value="ocup"><HardHat className="h-4 w-4 mr-1" /> Ocupacional</TabsTrigger>
        </TabsList>

        <TabsContent value="vac" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={vacOpen} onOpenChange={setVacOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Aplicar vacuna</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar vacunación</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label>
                    <Select value={vacForm.paciente_id} onValueChange={v => setVacForm({ ...vacForm, paciente_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent className="max-h-72">{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Vacuna</Label>
                    <Select value={vacForm.vacuna_id} onValueChange={v => setVacForm({ ...vacForm, vacuna_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent className="max-h-72">{vacCat.map(v => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Dosis</Label><Input type="number" value={vacForm.dosis} onChange={e => setVacForm({ ...vacForm, dosis: +e.target.value })} /></div>
                    <div><Label>Fecha</Label><Input type="date" value={vacForm.fecha_aplicacion} onChange={e => setVacForm({ ...vacForm, fecha_aplicacion: e.target.value })} /></div>
                  </div>
                  <div><Label>Lote</Label><Input value={vacForm.lote} onChange={e => setVacForm({ ...vacForm, lote: e.target.value })} /></div>
                  <Button onClick={saveVac} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Vacuna</TableHead><TableHead>Dosis</TableHead><TableHead>Fecha</TableHead><TableHead>Lote</TableHead><TableHead>Próxima</TableHead></TableRow></TableHeader>
            <TableBody>
              {vacunas.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>{v.pacientes?.nombre} {v.pacientes?.apellido}</TableCell>
                  <TableCell>{v.vacuna_nombre}</TableCell>
                  <TableCell><Badge>#{v.dosis}</Badge></TableCell>
                  <TableCell>{v.fecha_aplicacion}</TableCell>
                  <TableCell>{v.lote || "—"}</TableCell>
                  <TableCell>{v.proxima_dosis || "—"}</TableCell>
                </TableRow>
              ))}
              {!vacunas.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin vacunas registradas</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="cron" className="space-y-3">
          <Card><CardHeader><CardTitle>Programas crónicos</CardTitle></CardHeader>
            <CardContent><Table>
              <TableHeader><TableRow><TableHead>Programa</TableHead><TableHead>Enfermedad</TableHead><TableHead>Pacientes enrolados</TableHead></TableRow></TableHeader>
              <TableBody>
                {cronicos.map(c => <TableRow key={c.id}><TableCell>{c.nombre}</TableCell><TableCell>{c.enfermedad}</TableCell><TableCell>{enr.filter(e => e.programa_id === c.id).length}</TableCell></TableRow>)}
                {!cronicos.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Cree programas (DM, HTA, asma, EPOC, ERC) desde Configuración.</TableCell></TableRow>}
              </TableBody>
            </Table></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pre">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Sem. gestación</TableHead><TableHead>FUM</TableHead><TableHead>FPP</TableHead><TableHead>Control #</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
            <TableBody>
              {prenatal.map((p: any) => <TableRow key={p.id}><TableCell>{p.pacientes?.nombre} {p.pacientes?.apellido}</TableCell><TableCell>{p.semanas_gestacion}</TableCell><TableCell>{p.fum || "—"}</TableCell><TableCell>{p.fpp || "—"}</TableCell><TableCell>{p.numero_control}</TableCell><TableCell>{p.fecha_control}</TableCell></TableRow>)}
              {!prenatal.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin controles prenatales</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="ped">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Edad (m)</TableHead><TableHead>Peso</TableHead><TableHead>Talla</TableHead><TableHead>PC</TableHead><TableHead>Percentiles</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
            <TableBody>
              {ped.map((p: any) => <TableRow key={p.id}><TableCell>{p.pacientes?.nombre} {p.pacientes?.apellido}</TableCell><TableCell>{p.edad_meses}</TableCell><TableCell>{p.peso_kg} kg</TableCell><TableCell>{p.talla_cm} cm</TableCell><TableCell>{p.perimetro_cefalico}</TableCell><TableCell>{p.percentil_peso ? `P${p.percentil_peso}/P${p.percentil_talla}` : "—"}</TableCell><TableCell>{p.fecha}</TableCell></TableRow>)}
              {!ped.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin controles pediátricos</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="ocup">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead>Empresa</TableHead><TableHead>Cargo</TableHead><TableHead>Tipo</TableHead><TableHead>Fecha</TableHead><TableHead>Apto</TableHead></TableRow></TableHeader>
            <TableBody>
              {ocup.map((o: any) => <TableRow key={o.id}><TableCell>{o.pacientes?.nombre} {o.pacientes?.apellido}</TableCell><TableCell>{o.empresa}</TableCell><TableCell>{o.cargo}</TableCell><TableCell><Badge>{o.tipo}</Badge></TableCell><TableCell>{o.fecha}</TableCell><TableCell>{o.apto ? <Badge>Apto</Badge> : <Badge variant="destructive">No apto</Badge>}</TableCell></TableRow>)}
              {!ocup.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin evaluaciones ocupacionales</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
