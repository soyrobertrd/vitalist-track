import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plug, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

interface Props { workspaceId: string }

export default function IntegracionesExternasPsico({ workspaceId }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ tipo: "farmacia", nombre: "", endpoint: "" });

  const fetch = async () => {
    const { data } = await supabase
      .from("integraciones_externas_psico")
      .select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { if (workspaceId) fetch(); }, [workspaceId]);

  const crear = async () => {
    if (!form.nombre) return toast.error("Nombre requerido");
    const { error } = await supabase.from("integraciones_externas_psico").insert({
      workspace_id: workspaceId, tipo: form.tipo, nombre: form.nombre, endpoint: form.endpoint || null,
    });
    if (error) toast.error(error.message); else { toast.success("Integración creada"); setForm({ tipo: "farmacia", nombre: "", endpoint: "" }); fetch(); }
  };

  const toggle = async (id: string, activo: boolean) => {
    await supabase.from("integraciones_externas_psico").update({ activo: !activo }).eq("id", id);
    fetch();
  };

  const eliminar = async (id: string) => {
    await supabase.from("integraciones_externas_psico").delete().eq("id", id);
    fetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Plug className="h-5 w-5"/>Integraciones externas (Farmacia / Laboratorio)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-lg p-3">
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="farmacia">Farmacia</SelectItem>
                <SelectItem value="laboratorio">Laboratorio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}/></div>
          <div><Label>Endpoint</Label><Input value={form.endpoint} onChange={e => setForm({ ...form, endpoint: e.target.value })} placeholder="https://..."/></div>
          <div className="flex items-end"><Button onClick={crear} className="w-full"><Plus className="h-4 w-4 mr-1"/>Agregar</Button></div>
        </div>

        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <p className="font-medium">{it.nombre} <Badge variant="outline" className="ml-2">{it.tipo}</Badge></p>
                <p className="text-xs text-muted-foreground">{it.endpoint || "sin endpoint"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(it.id, it.activo)}>{it.activo ? "Desactivar" : "Activar"}</Button>
                <Button size="sm" variant="ghost" onClick={() => eliminar(it.id)}><Trash className="h-4 w-4"/></Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin integraciones configuradas</p>}
        </div>
      </CardContent>
    </Card>
  );
}
