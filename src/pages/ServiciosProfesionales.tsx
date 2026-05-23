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
import { Plus } from "lucide-react";

export default function ServiciosProfesionales() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [openSrv, setOpenSrv] = useState(false);
  const [openAsig, setOpenAsig] = useState(false);
  const [srvForm, setSrvForm] = useState({ nombre: "", codigo: "", modalidad: "consulta", duracion_min: 30, precio_referencia: 0 });
  const [asigForm, setAsigForm] = useState({ profesional_id: "", servicio_id: "", precio: 0, comision_pct: 0 });

  const load = async () => {
    if (!wsId) return;
    const [s, p, a] = await Promise.all([
      supabase.from("servicios_catalogo").select("*").eq("workspace_id", wsId).order("nombre"),
      supabase.from("personal_salud").select("id,nombre,apellido,especialidad").eq("workspace_id", wsId).eq("activo", true),
      supabase.from("profesional_servicios").select("*, servicios_catalogo(nombre), personal_salud(nombre,apellido)").eq("workspace_id", wsId),
    ]);
    setServicios(s.data || []); setProfesionales(p.data || []); setAsignaciones(a.data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const saveSrv = async () => {
    if (!wsId || !srvForm.nombre) return;
    const { error } = await supabase.from("servicios_catalogo").insert({ ...srvForm, workspace_id: wsId });
    if (error) return toast.error(error.message);
    toast.success("Servicio creado"); setOpenSrv(false); load();
    setSrvForm({ nombre: "", codigo: "", modalidad: "consulta", duracion_min: 30, precio_referencia: 0 });
  };

  const saveAsig = async () => {
    if (!wsId || !asigForm.profesional_id || !asigForm.servicio_id) return;
    const { error } = await supabase.from("profesional_servicios").insert({ ...asigForm, workspace_id: wsId });
    if (error) return toast.error(error.message);
    toast.success("Asignado"); setOpenAsig(false); load();
    setAsigForm({ profesional_id: "", servicio_id: "", precio: 0, comision_pct: 0 });
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Servicios y Asignación de Profesionales</h1>
      <Tabs defaultValue="srv">
        <TabsList>
          <TabsTrigger value="srv">Catálogo de servicios</TabsTrigger>
          <TabsTrigger value="asig">Asignación profesional ↔ servicio</TabsTrigger>
        </TabsList>
        <TabsContent value="srv" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openSrv} onOpenChange={setOpenSrv}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nuevo servicio</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo servicio</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nombre</Label><Input value={srvForm.nombre} onChange={e => setSrvForm({ ...srvForm, nombre: e.target.value })} /></div>
                  <div><Label>Código</Label><Input value={srvForm.codigo} onChange={e => setSrvForm({ ...srvForm, codigo: e.target.value })} /></div>
                  <div>
                    <Label>Modalidad</Label>
                    <Select value={srvForm.modalidad} onValueChange={v => setSrvForm({ ...srvForm, modalidad: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["consulta","cirugia","teleconsulta","domiciliaria","procedimiento","terapia","laboratorio","imagen"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Duración (min)</Label><Input type="number" value={srvForm.duracion_min} onChange={e => setSrvForm({ ...srvForm, duracion_min: +e.target.value })} /></div>
                    <div><Label>Precio referencia</Label><Input type="number" value={srvForm.precio_referencia} onChange={e => setSrvForm({ ...srvForm, precio_referencia: +e.target.value })} /></div>
                  </div>
                  <Button onClick={saveSrv} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Código</TableHead><TableHead>Modalidad</TableHead><TableHead>Duración</TableHead><TableHead>Precio</TableHead></TableRow></TableHeader>
            <TableBody>
              {servicios.map(s => (
                <TableRow key={s.id}><TableCell>{s.nombre}</TableCell><TableCell>{s.codigo}</TableCell><TableCell><Badge>{s.modalidad}</Badge></TableCell><TableCell>{s.duracion_min} min</TableCell><TableCell>RD$ {s.precio_referencia}</TableCell></TableRow>
              ))}
              {!servicios.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin servicios</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="asig" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openAsig} onOpenChange={setOpenAsig}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Asignar</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Asignar servicio a profesional</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Profesional</Label>
                    <Select value={asigForm.profesional_id} onValueChange={v => setAsigForm({ ...asigForm, profesional_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{profesionales.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido} - {p.especialidad}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Servicio</Label>
                    <Select value={asigForm.servicio_id} onValueChange={v => setAsigForm({ ...asigForm, servicio_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{servicios.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Precio</Label><Input type="number" value={asigForm.precio} onChange={e => setAsigForm({ ...asigForm, precio: +e.target.value })} /></div>
                    <div><Label>Comisión %</Label><Input type="number" value={asigForm.comision_pct} onChange={e => setAsigForm({ ...asigForm, comision_pct: +e.target.value })} /></div>
                  </div>
                  <Button onClick={saveAsig} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Profesional</TableHead><TableHead>Servicio</TableHead><TableHead>Precio</TableHead><TableHead>Comisión</TableHead></TableRow></TableHeader>
            <TableBody>
              {asignaciones.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{a.personal_salud?.nombre} {a.personal_salud?.apellido}</TableCell>
                  <TableCell>{a.servicios_catalogo?.nombre}</TableCell>
                  <TableCell>RD$ {a.precio}</TableCell>
                  <TableCell>{a.comision_pct}%</TableCell>
                </TableRow>
              ))}
              {!asignaciones.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin asignaciones</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
