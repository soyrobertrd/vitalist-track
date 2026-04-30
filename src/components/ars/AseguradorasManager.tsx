import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Building2, Edit, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Aseguradora {
  id: string;
  nombre: string;
  codigo: string | null;
  rnc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activa: boolean;
  notas: string | null;
}

interface PlanSeguro {
  id: string;
  aseguradora_id: string;
  nombre: string;
  codigo: string | null;
  cobertura_porcentaje: number;
  copago: number;
  deducible: number;
  activo: boolean;
  notas: string | null;
}

const emptyAseg = { nombre: "", codigo: "", rnc: "", telefono: "", email: "", direccion: "", notas: "" };
const emptyPlan = { nombre: "", codigo: "", cobertura_porcentaje: "80", copago: "0", deducible: "0", notas: "" };

export function AseguradorasManager() {
  const { currentWorkspace } = useWorkspace();
  const wsId = (currentWorkspace as any)?.id;
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [planes, setPlanes] = useState<Record<string, PlanSeguro[]>>({});
  const [loading, setLoading] = useState(true);
  const [openAseg, setOpenAseg] = useState(false);
  const [editAseg, setEditAseg] = useState<Aseguradora | null>(null);
  const [form, setForm] = useState(emptyAseg);
  const [openPlan, setOpenPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [expandedAseg, setExpandedAseg] = useState<string | null>(null);

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const { data: asegs } = await supabase
      .from("aseguradoras")
      .select("*")
      .eq("workspace_id", wsId)
      .order("nombre");
    setAseguradoras((asegs as any[]) || []);

    if (asegs?.length) {
      const { data: pls } = await supabase
        .from("planes_seguro")
        .select("*")
        .eq("workspace_id", wsId)
        .order("nombre");
      const grouped: Record<string, PlanSeguro[]> = {};
      (pls || []).forEach((p: any) => {
        if (!grouped[p.aseguradora_id]) grouped[p.aseguradora_id] = [];
        grouped[p.aseguradora_id].push(p);
      });
      setPlanes(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const guardarAseg = async () => {
    if (!form.nombre.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    const payload = {
      ...form,
      workspace_id: wsId,
      codigo: form.codigo || null,
      rnc: form.rnc || null,
      telefono: form.telefono || null,
      email: form.email || null,
      direccion: form.direccion || null,
      notas: form.notas || null,
    };
    if (editAseg) {
      const { error } = await supabase.from("aseguradoras").update(payload as any).eq("id", editAseg.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Aseguradora actualizada" });
    } else {
      const { error } = await supabase.from("aseguradoras").insert(payload as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Aseguradora creada" });
    }
    setOpenAseg(false);
    setEditAseg(null);
    setForm(emptyAseg);
    cargar();
  };

  const toggleActiva = async (a: Aseguradora) => {
    await supabase.from("aseguradoras").update({ activa: !a.activa } as any).eq("id", a.id);
    cargar();
  };

  const guardarPlan = async (asegId: string) => {
    if (!planForm.nombre.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    const { error } = await supabase.from("planes_seguro").insert({
      aseguradora_id: asegId,
      workspace_id: wsId,
      nombre: planForm.nombre,
      codigo: planForm.codigo || null,
      cobertura_porcentaje: parseFloat(planForm.cobertura_porcentaje) || 80,
      copago: parseFloat(planForm.copago) || 0,
      deducible: parseFloat(planForm.deducible) || 0,
      notas: planForm.notas || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plan creado" });
    setOpenPlan(null);
    setPlanForm(emptyPlan);
    cargar();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Aseguradoras / ARS
        </h3>
        <Dialog open={openAseg} onOpenChange={(o) => { setOpenAseg(o); if (!o) { setEditAseg(null); setForm(emptyAseg); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editAseg ? "Editar" : "Nueva"} Aseguradora</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} /></div>
                <div><Label>RNC</Label><Input value={form.rnc} onChange={e => setForm({ ...form, rnc: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAseg(false)}>Cancelar</Button>
              <Button onClick={guardarAseg}>{editAseg ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : aseguradoras.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay aseguradoras registradas.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {aseguradoras.map(a => (
            <Collapsible key={a.id} open={expandedAseg === a.id} onOpenChange={(o) => setExpandedAseg(o ? a.id : null)}>
              <Card>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                      {expandedAseg === a.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">{a.nombre}</span>
                      {a.codigo && <span className="text-xs text-muted-foreground">({a.codigo})</span>}
                      <Badge variant={a.activa ? "default" : "secondary"}>{a.activa ? "Activa" : "Inactiva"}</Badge>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Switch checked={a.activa} onCheckedChange={() => toggleActiva(a)} />
                      <Button size="sm" variant="ghost" onClick={() => { setEditAseg(a); setForm({ nombre: a.nombre, codigo: a.codigo || "", rnc: a.rnc || "", telefono: a.telefono || "", email: a.email || "", direccion: a.direccion || "", notas: a.notas || "" }); setOpenAseg(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {a.rnc && <p className="text-xs text-muted-foreground">RNC: {a.rnc}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Planes</p>
                      <Dialog open={openPlan === a.id} onOpenChange={(o) => { setOpenPlan(o ? a.id : null); if (!o) setPlanForm(emptyPlan); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Plan</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Nuevo plan — {a.nombre}</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div><Label>Nombre *</Label><Input value={planForm.nombre} onChange={e => setPlanForm({ ...planForm, nombre: e.target.value })} /></div>
                            <div><Label>Código</Label><Input value={planForm.codigo} onChange={e => setPlanForm({ ...planForm, codigo: e.target.value })} /></div>
                            <div className="grid grid-cols-3 gap-3">
                              <div><Label>Cobertura %</Label><Input type="number" value={planForm.cobertura_porcentaje} onChange={e => setPlanForm({ ...planForm, cobertura_porcentaje: e.target.value })} /></div>
                              <div><Label>Copago</Label><Input type="number" value={planForm.copago} onChange={e => setPlanForm({ ...planForm, copago: e.target.value })} /></div>
                              <div><Label>Deducible</Label><Input type="number" value={planForm.deducible} onChange={e => setPlanForm({ ...planForm, deducible: e.target.value })} /></div>
                            </div>
                            <div><Label>Notas</Label><Textarea value={planForm.notas} onChange={e => setPlanForm({ ...planForm, notas: e.target.value })} /></div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenPlan(null)}>Cancelar</Button>
                            <Button onClick={() => guardarPlan(a.id)}>Crear</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {(planes[a.id] || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin planes registrados.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plan</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Cobertura</TableHead>
                            <TableHead>Copago</TableHead>
                            <TableHead>Deducible</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(planes[a.id] || []).map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.nombre}</TableCell>
                              <TableCell>{p.codigo || "—"}</TableCell>
                              <TableCell>{p.cobertura_porcentaje}%</TableCell>
                              <TableCell>{p.copago}</TableCell>
                              <TableCell>{p.deducible}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
