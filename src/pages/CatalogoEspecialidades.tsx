import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

const CATEGORIAS = [
  { v: "medica", l: "Médica" },
  { v: "enfermeria", l: "Enfermería" },
  { v: "terapeutica", l: "Terapéutica" },
  { v: "tecnica", l: "Técnica" },
  { v: "administrativa", l: "Administrativa" },
  { v: "otra", l: "Otra" },
];

export default function CatalogoEspecialidades() {
  const { currentWorkspace } = useWorkspace();
  const [items, setItems] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [openCat, setOpenCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nombre: "", categoria: "medica", descripcion: "", requiere_exequatur: false, requiere_colegiatura: false, activo: true });

  const load = async () => {
    const { data } = await supabase.from("especialidades_catalogo").select("*").order("categoria").order("nombre");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nombre.trim()) { toast.error("Nombre requerido"); return; }
    if (editing) {
      const { error } = await supabase.from("especialidades_catalogo").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const payload: any = { ...form, workspace_id: currentWorkspace?.id || null, global: false };
      const { error } = await supabase.from("especialidades_catalogo").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Guardado");
    setOpen(false); setEditing(null);
    setForm({ nombre: "", categoria: "medica", descripcion: "", requiere_exequatur: false, requiere_colegiatura: false, activo: true });
    load();
  };

  const openEdit = (it: any) => {
    setEditing(it);
    setForm({ nombre: it.nombre, categoria: it.categoria, descripcion: it.descripcion || "", requiere_exequatur: it.requiere_exequatur, requiere_colegiatura: it.requiere_colegiatura, activo: it.activo });
    setOpen(true);
  };

  const filtered = items.filter((i) =>
    (openCat === "all" || i.categoria === openCat) &&
    (!filtro || i.nombre.toLowerCase().includes(filtro.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Especialidades y Profesiones</h1>
          <p className="text-sm text-muted-foreground">Define qué tipos de profesionales pueden registrarse en tu centro.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} especialidad</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div className="flex items-center justify-between"><Label>Requiere exequátur</Label><Switch checked={form.requiere_exequatur} onCheckedChange={(v) => setForm({ ...form, requiere_exequatur: v })} /></div>
              <div className="flex items-center justify-between"><Label>Requiere colegiatura</Label><Switch checked={form.requiere_colegiatura} onCheckedChange={(v) => setForm({ ...form, requiere_colegiatura: v })} /></div>
              <div className="flex items-center justify-between"><Label>Activa</Label><Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} /></div>
              <Button onClick={save} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="Buscar..." className="max-w-xs" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            <Select value={openCat} onValueChange={setOpenCat}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIAS.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nombre</TableHead><TableHead>Categoría</TableHead>
              <TableHead>Exequátur</TableHead><TableHead>Colegiatura</TableHead>
              <TableHead>Origen</TableHead><TableHead>Estado</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nombre}</TableCell>
                  <TableCell>{CATEGORIAS.find(c => c.v === i.categoria)?.l || i.categoria}</TableCell>
                  <TableCell>{i.requiere_exequatur ? "Sí" : "—"}</TableCell>
                  <TableCell>{i.requiere_colegiatura ? "Sí" : "—"}</TableCell>
                  <TableCell><Badge variant={i.global ? "secondary" : "default"}>{i.global ? "Global" : "Workspace"}</Badge></TableCell>
                  <TableCell><Badge variant={i.activo ? "default" : "outline"}>{i.activo ? "Activa" : "Inactiva"}</Badge></TableCell>
                  <TableCell>{!i.global && <Button size="sm" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-3 w-3" /></Button>}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
