import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building, Plus, Layers, DoorOpen, Bed } from "lucide-react";
import { useSucursales } from "@/hooks/useSucursales";

interface Edificio { id: string; nombre: string; codigo: string | null; sucursal_id: string; }
interface Piso { id: string; numero: number; nombre: string | null; edificio_id: string; }
interface Ala { id: string; nombre: string; tipo: string; piso_id: string; }
interface Consultorio { id: string; nombre: string; codigo: string | null; tipo: string; ala_id: string | null; piso_id: string | null; sucursal_id: string; }

export default function Consultorios() {
  const { currentWorkspace } = useWorkspace();
  const { sucursales } = useSucursales();
  const [sucursalId, setSucursalId] = useState<string>("");
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [alas, setAlas] = useState<Ala[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);

  useEffect(() => {
    if (sucursales[0] && !sucursalId) setSucursalId(sucursales[0].id);
  }, [sucursales]);

  useEffect(() => {
    if (!sucursalId) return;
    void load();
  }, [sucursalId]);

  async function load() {
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from("edificios" as any).select("*").eq("sucursal_id", sucursalId).order("nombre"),
      supabase.from("consultorios" as any).select("*").eq("sucursal_id", sucursalId).order("nombre"),
    ]);
    setEdificios((e as any) ?? []);
    setConsultorios((c as any) ?? []);
    const eIds = ((e as any) ?? []).map((x: any) => x.id);
    if (eIds.length) {
      const { data: p } = await supabase.from("pisos" as any).select("*").in("edificio_id", eIds).order("numero");
      setPisos((p as any) ?? []);
      const pIds = ((p as any) ?? []).map((x: any) => x.id);
      if (pIds.length) {
        const { data: a } = await supabase.from("alas" as any).select("*").in("piso_id", pIds).order("nombre");
        setAlas((a as any) ?? []);
      } else setAlas([]);
    } else { setPisos([]); setAlas([]); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building className="h-6 w-6"/> Estructura física</h1>
          <p className="text-sm text-muted-foreground">Edificios, pisos, alas y consultorios por sucursal</p>
        </div>
        <Select value={sucursalId} onValueChange={setSucursalId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Selecciona sucursal" /></SelectTrigger>
          <SelectContent>{sucursales.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="edificios">
        <TabsList>
          <TabsTrigger value="edificios"><Building className="h-4 w-4 mr-1"/>Edificios</TabsTrigger>
          <TabsTrigger value="pisos"><Layers className="h-4 w-4 mr-1"/>Pisos</TabsTrigger>
          <TabsTrigger value="alas">Alas</TabsTrigger>
          <TabsTrigger value="consultorios"><DoorOpen className="h-4 w-4 mr-1"/>Consultorios</TabsTrigger>
        </TabsList>

        <TabsContent value="edificios">
          <SimpleCrud
            title="Edificios"
            items={edificios}
            renderItem={(e: Edificio) => <span><strong>{e.nombre}</strong> {e.codigo && <Badge variant="outline">{e.codigo}</Badge>}</span>}
            onCreate={async (form) => {
              const { error } = await supabase.from("edificios" as any).insert({ sucursal_id: sucursalId, nombre: form.nombre, codigo: form.codigo || null });
              if (error) toast.error(error.message); else { toast.success("Edificio creado"); load(); }
            }}
            fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "codigo", label: "Código" }]}
          />
        </TabsContent>

        <TabsContent value="pisos">
          <SimpleCrud
            title="Pisos"
            items={pisos.map(p => ({ ...p, _label: `Piso ${p.numero} ${p.nombre ?? ""} — ${edificios.find(e=>e.id===p.edificio_id)?.nombre ?? ""}` }))}
            renderItem={(p: any) => <span>{p._label}</span>}
            onCreate={async (form) => {
              const { error } = await supabase.from("pisos" as any).insert({ edificio_id: form.edificio_id, numero: parseInt(form.numero), nombre: form.nombre || null });
              if (error) toast.error(error.message); else { toast.success("Piso creado"); load(); }
            }}
            fields={[
              { name: "edificio_id", label: "Edificio", type: "select", options: edificios.map(e => ({ value: e.id, label: e.nombre })), required: true },
              { name: "numero", label: "Número", type: "number", required: true },
              { name: "nombre", label: "Nombre (opcional)" },
            ]}
          />
        </TabsContent>

        <TabsContent value="alas">
          <SimpleCrud
            title="Alas"
            items={alas.map(a => ({ ...a, _label: `${a.nombre} (${a.tipo})` }))}
            renderItem={(a: any) => <span>{a._label}</span>}
            onCreate={async (form) => {
              const { error } = await supabase.from("alas" as any).insert({ piso_id: form.piso_id, nombre: form.nombre, tipo: form.tipo });
              if (error) toast.error(error.message); else { toast.success("Ala creada"); load(); }
            }}
            fields={[
              { name: "piso_id", label: "Piso", type: "select", options: pisos.map(p => ({ value: p.id, label: `Piso ${p.numero} - ${edificios.find(e=>e.id===p.edificio_id)?.nombre}` })), required: true },
              { name: "nombre", label: "Nombre", required: true },
              { name: "tipo", label: "Tipo", type: "select", options: [
                { value: "general", label: "General" },
                { value: "emergencia", label: "Emergencia" },
                { value: "uci", label: "UCI" },
                { value: "hospitalizacion", label: "Hospitalización" },
                { value: "ambulatorio", label: "Ambulatorio" },
              ], required: true },
            ]}
          />
        </TabsContent>

        <TabsContent value="consultorios">
          <SimpleCrud
            title="Consultorios"
            items={consultorios.map(c => ({ ...c, _label: `${c.nombre} (${c.tipo})` }))}
            renderItem={(c: any) => <span>{c._label}</span>}
            onCreate={async (form) => {
              const { error } = await supabase.from("consultorios" as any).insert({
                sucursal_id: sucursalId,
                nombre: form.nombre,
                codigo: form.codigo || null,
                tipo: form.tipo,
                ala_id: form.ala_id || null,
                piso_id: form.piso_id || null,
              });
              if (error) toast.error(error.message); else { toast.success("Consultorio creado"); load(); }
            }}
            fields={[
              { name: "nombre", label: "Nombre", required: true },
              { name: "codigo", label: "Código" },
              { name: "tipo", label: "Tipo", type: "select", options: [
                { value: "consulta", label: "Consulta" },
                { value: "procedimiento", label: "Procedimiento" },
                { value: "emergencia", label: "Emergencia" },
                { value: "uci", label: "UCI" },
                { value: "sala", label: "Sala" },
              ], required: true },
              { name: "piso_id", label: "Piso", type: "select", options: pisos.map(p => ({ value: p.id, label: `Piso ${p.numero}` })) },
              { name: "ala_id", label: "Ala", type: "select", options: alas.map(a => ({ value: a.id, label: a.nombre })) },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Field { name: string; label: string; required?: boolean; type?: string; options?: { value: string; label: string }[]; }
function SimpleCrud({ title, items, renderItem, onCreate, fields }: { title: string; items: any[]; renderItem: (i: any) => React.ReactNode; onCreate: (form: any) => Promise<void>; fields: Field[]; }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1"/>Nuevo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo {title.toLowerCase()}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {fields.map(f => (
                <div key={f.name} className="space-y-1">
                  <Label>{f.label}{f.required && " *"}</Label>
                  {f.type === "select" ? (
                    <Select value={form[f.name] ?? ""} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input type={f.type ?? "text"} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={async () => { await onCreate(form); setForm({}); setOpen(false); }}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin registros</p>
        ) : (
          <ul className="space-y-1">
            {items.map((it: any) => <li key={it.id} className="text-sm py-2 border-b last:border-0">{renderItem(it)}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
