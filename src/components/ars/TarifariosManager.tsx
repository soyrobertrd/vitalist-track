import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, ListChecks } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";
import { localeFromCountry } from "@/lib/dateFormat";

interface Tarifa {
  id: string;
  aseguradora_id: string;
  codigo_procedimiento: string;
  descripcion: string;
  precio_lista: number;
  precio_convenio: number | null;
  cobertura_porcentaje: number | null;
  requiere_autorizacion: boolean;
  activo: boolean;
  aseguradoras?: { nombre: string } | null;
}

const emptyForm = {
  aseguradora_id: "",
  codigo_procedimiento: "",
  descripcion: "",
  precio_lista: "",
  precio_convenio: "",
  cobertura_porcentaje: "",
  requiere_autorizacion: false,
};

export function TarifariosManager() {
  const { currentWorkspace } = useWorkspace();
  const wsId = (currentWorkspace as any)?.id;
  const { countryCode } = useLocale();
  const currency = resolveCurrency(currentWorkspace, countryCode);
  const locale = localeFromCountry(countryCode);
  const fmt = (n: number | string | null) => n != null ? formatCurrency(n, currency, locale) : "—";

  const [items, setItems] = useState<Tarifa[]>([]);
  const [aseguradoras, setAseguradoras] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filtroAseg, setFiltroAseg] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const { data } = await supabase
      .from("tarifarios_ars")
      .select("*, aseguradoras(nombre)")
      .eq("workspace_id", wsId)
      .order("descripcion");
    setItems((data as any[]) || []);

    const { data: asegs } = await supabase
      .from("aseguradoras")
      .select("id, nombre")
      .eq("workspace_id", wsId)
      .eq("activa", true)
      .order("nombre");
    setAseguradoras((asegs as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const crear = async () => {
    if (!form.aseguradora_id || !form.descripcion.trim() || !form.codigo_procedimiento.trim()) {
      toast({ title: "Aseguradora, código y descripción requeridos", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("tarifarios_ars").insert({
      workspace_id: wsId,
      aseguradora_id: form.aseguradora_id,
      codigo_procedimiento: form.codigo_procedimiento,
      descripcion: form.descripcion,
      precio_lista: parseFloat(form.precio_lista) || 0,
      precio_convenio: form.precio_convenio ? parseFloat(form.precio_convenio) : null,
      cobertura_porcentaje: form.cobertura_porcentaje ? parseFloat(form.cobertura_porcentaje) : null,
      requiere_autorizacion: form.requiere_autorizacion,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Tarifa creada" });
    setOpen(false);
    setForm(emptyForm);
    cargar();
  };

  const filtered = items
    .filter(i => filtroAseg === "todos" || i.aseguradora_id === filtroAseg)
    .filter(i => !busqueda || i.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || i.codigo_procedimiento.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" /> Tarifarios ARS
        </h3>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-[180px]" />
          <Select value={filtroAseg} onValueChange={setFiltroAseg}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas ARS</SelectItem>
              {aseguradoras.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Tarifa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Aseguradora *</Label>
                  <Select value={form.aseguradora_id} onValueChange={v => setForm({ ...form, aseguradora_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {aseguradoras.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Código proc. *</Label><Input value={form.codigo_procedimiento} onChange={e => setForm({ ...form, codigo_procedimiento: e.target.value })} /></div>
                  <div><Label>Cobertura %</Label><Input type="number" value={form.cobertura_porcentaje} onChange={e => setForm({ ...form, cobertura_porcentaje: e.target.value })} /></div>
                </div>
                <div><Label>Descripción *</Label><Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Precio lista</Label><Input type="number" step="0.01" value={form.precio_lista} onChange={e => setForm({ ...form, precio_lista: e.target.value })} /></div>
                  <div><Label>Precio convenio</Label><Input type="number" step="0.01" value={form.precio_convenio} onChange={e => setForm({ ...form, precio_convenio: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.requiere_autorizacion} onCheckedChange={v => setForm({ ...form, requiere_autorizacion: v })} />
                  <Label>Requiere autorización previa</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={crear}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay tarifas registradas.</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>ARS</TableHead>
              <TableHead>P. Lista</TableHead>
              <TableHead>P. Convenio</TableHead>
              <TableHead>Cobertura</TableHead>
              <TableHead>Autorización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.codigo_procedimiento}</TableCell>
                <TableCell>{t.descripcion}</TableCell>
                <TableCell>{(t as any).aseguradoras?.nombre}</TableCell>
                <TableCell>{fmt(t.precio_lista)}</TableCell>
                <TableCell>{fmt(t.precio_convenio)}</TableCell>
                <TableCell>{t.cobertura_porcentaje != null ? `${t.cobertura_porcentaje}%` : "—"}</TableCell>
                <TableCell>{t.requiere_autorizacion ? "Sí" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
