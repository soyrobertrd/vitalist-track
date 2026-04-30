import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Droplets, Heart, AlertTriangle, Package } from "lucide-react";

const BancoSangre = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("inventario");
  const [showNewDonante, setShowNewDonante] = useState(false);
  const [showNewUnidad, setShowNewUnidad] = useState(false);
  const [donForm, setDonForm] = useState({ nombre: "", apellido: "", cedula: "", tipo_sangre: "O", factor_rh: "+" });
  const [uniForm, setUniForm] = useState({ tipo_sangre: "O", factor_rh: "+", componente: "sangre_total", volumen_ml: "450", lote: "" });

  const { data: donantes } = useQuery({
    queryKey: ["donantes-sangre", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase.from("donantes_sangre").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const { data: unidades } = useQuery({
    queryKey: ["unidades-sangre", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase.from("unidades_sangre").select("*, donantes_sangre(nombre, apellido)").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const { data: solicitudes } = useQuery({
    queryKey: ["solicitudes-transfusion", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase.from("solicitudes_transfusion").select("*, pacientes(nombre, apellido)").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const createDonante = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error();
      const { error } = await supabase.from("donantes_sangre").insert({ ...donForm, workspace_id: currentWorkspace.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["donantes-sangre"] }); setShowNewDonante(false); toast.success("Donante registrado"); },
    onError: () => toast.error("Error"),
  });

  const createUnidad = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id) throw new Error();
      const { error } = await supabase.from("unidades_sangre").insert({
        workspace_id: currentWorkspace.id,
        tipo_sangre: uniForm.tipo_sangre,
        factor_rh: uniForm.factor_rh,
        componente: uniForm.componente,
        volumen_ml: Number(uniForm.volumen_ml),
        lote: uniForm.lote || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["unidades-sangre"] }); setShowNewUnidad(false); toast.success("Unidad registrada"); },
    onError: () => toast.error("Error"),
  });

  const disponibles = (unidades || []).filter(u => u.estado === "disponible").length;
  const vencidas = (unidades || []).filter(u => u.estado === "vencida").length;
  const pendientes = (solicitudes || []).filter(s => s.estado === "pendiente").length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banco de Sangre</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Droplets className="h-6 w-6 mx-auto text-red-500" /><p className="text-2xl font-bold">{disponibles}</p><p className="text-xs text-muted-foreground">Unidades disponibles</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Heart className="h-6 w-6 mx-auto text-pink-500" /><p className="text-2xl font-bold">{(donantes || []).length}</p><p className="text-xs text-muted-foreground">Donantes</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="h-6 w-6 mx-auto text-yellow-500" /><p className="text-2xl font-bold">{pendientes}</p><p className="text-xs text-muted-foreground">Solicitudes pendientes</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Package className="h-6 w-6 mx-auto text-destructive" /><p className="text-2xl font-bold">{vencidas}</p><p className="text-xs text-muted-foreground">Vencidas</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="donantes">Donantes</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Unidades de Sangre</CardTitle>
              <Button size="sm" onClick={() => setShowNewUnidad(true)}><Plus className="h-4 w-4 mr-1" /> Nueva Unidad</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Tipo</TableHead><TableHead>Componente</TableHead><TableHead>Vol (ml)</TableHead><TableHead>Lote</TableHead><TableHead>Estado</TableHead><TableHead>Extracción</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(unidades || []).map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold text-red-600">{u.tipo_sangre}{u.factor_rh}</TableCell>
                      <TableCell>{(u.componente || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{u.volumen_ml}</TableCell>
                      <TableCell className="font-mono text-xs">{u.lote || "—"}</TableCell>
                      <TableCell><Badge variant={u.estado === "disponible" ? "default" : u.estado === "vencida" ? "destructive" : "outline"}>{u.estado}</Badge></TableCell>
                      <TableCell>{new Date(u.fecha_extraccion + "T12:00:00").toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donantes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Donantes</CardTitle>
              <Button size="sm" onClick={() => setShowNewDonante(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Donante</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nombre</TableHead><TableHead>Cédula</TableHead><TableHead>Tipo</TableHead><TableHead>Elegible</TableHead><TableHead>Última donación</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(donantes || []).map(d => (
                    <TableRow key={d.id}>
                      <TableCell>{d.nombre} {d.apellido}</TableCell>
                      <TableCell>{d.cedula || "—"}</TableCell>
                      <TableCell className="font-bold text-red-600">{d.tipo_sangre}{d.factor_rh}</TableCell>
                      <TableCell><Badge variant={d.elegible ? "default" : "destructive"}>{d.elegible ? "Sí" : "No"}</Badge></TableCell>
                      <TableCell>{d.ultima_donacion ? new Date(d.ultima_donacion + "T12:00:00").toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitudes">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Número</TableHead><TableHead>Paciente</TableHead><TableHead>Componente</TableHead><TableHead>Urgencia</TableHead><TableHead>Estado</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(solicitudes || []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.numero}</TableCell>
                      <TableCell>{s.pacientes?.nombre} {s.pacientes?.apellido}</TableCell>
                      <TableCell>{(s.componente_solicitado || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell><Badge variant={s.urgencia === "emergencia" ? "destructive" : "outline"}>{s.urgencia}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{s.estado}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New donante */}
      <Dialog open={showNewDonante} onOpenChange={setShowNewDonante}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Donante</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Nombre</Label><Input value={donForm.nombre} onChange={e => setDonForm(f => ({ ...f, nombre: e.target.value }))} /></div>
              <div><Label>Apellido</Label><Input value={donForm.apellido} onChange={e => setDonForm(f => ({ ...f, apellido: e.target.value }))} /></div>
            </div>
            <div><Label>Cédula</Label><Input value={donForm.cedula} onChange={e => setDonForm(f => ({ ...f, cedula: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Tipo sangre</Label>
                <Select value={donForm.tipo_sangre} onValueChange={v => setDonForm(f => ({ ...f, tipo_sangre: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A","B","AB","O"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Rh</Label>
                <Select value={donForm.factor_rh} onValueChange={v => setDonForm(f => ({ ...f, factor_rh: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={() => createDonante.mutate()} disabled={createDonante.isPending}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New unidad */}
      <Dialog open={showNewUnidad} onOpenChange={setShowNewUnidad}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Unidad de Sangre</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Tipo sangre</Label>
                <Select value={uniForm.tipo_sangre} onValueChange={v => setUniForm(f => ({ ...f, tipo_sangre: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A","B","AB","O"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Rh</Label>
                <Select value={uniForm.factor_rh} onValueChange={v => setUniForm(f => ({ ...f, factor_rh: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="+">+</SelectItem><SelectItem value="-">-</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Componente</Label>
              <Select value={uniForm.componente} onValueChange={v => setUniForm(f => ({ ...f, componente: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sangre_total">Sangre total</SelectItem>
                  <SelectItem value="globulos_rojos">Glóbulos rojos</SelectItem>
                  <SelectItem value="plaquetas">Plaquetas</SelectItem>
                  <SelectItem value="plasma">Plasma</SelectItem>
                  <SelectItem value="crioprecipitado">Crioprecipitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Volumen (ml)</Label><Input type="number" value={uniForm.volumen_ml} onChange={e => setUniForm(f => ({ ...f, volumen_ml: e.target.value }))} /></div>
              <div><Label>Lote</Label><Input value={uniForm.lote} onChange={e => setUniForm(f => ({ ...f, lote: e.target.value }))} /></div>
            </div>
            <Button className="w-full" onClick={() => createUnidad.mutate()} disabled={createUnidad.isPending}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BancoSangre;
