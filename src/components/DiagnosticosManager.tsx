import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Stethoscope } from "lucide-react";
import Cie10Buscador, { Cie10Codigo } from "./Cie10Buscador";

interface Diagnostico {
  id: string;
  cie10_codigo: string;
  cie10_descripcion: string | null;
  tipo: string;
  certeza: string;
  notas: string | null;
  created_at: string;
}

export function DiagnosticosManager({ pacienteId, visitaId }: { pacienteId: string; visitaId?: string }) {
  const [items, setItems] = useState<Diagnostico[]>([]);
  const [adding, setAdding] = useState(false);
  const [sel, setSel] = useState<Cie10Codigo | null>(null);
  const [tipo, setTipo] = useState("principal");
  const [certeza, setCerteza] = useState("confirmado");
  const [notas, setNotas] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("diagnosticos_clinicos")
      .select("id, cie10_codigo, cie10_descripcion, tipo, certeza, notas, created_at")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => { load(); }, [pacienteId]);

  const guardar = async () => {
    if (!sel) { toast.error("Selecciona un código CIE-10"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("diagnosticos_clinicos").insert({
      paciente_id: pacienteId,
      visita_id: visitaId || null,
      cie10_codigo: sel.codigo,
      cie10_descripcion: sel.descripcion,
      tipo, certeza,
      notas: notas || null,
      registrado_por: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Diagnóstico registrado");
    setAdding(false); setSel(null); setNotas(""); setTipo("principal"); setCerteza("confirmado");
    load();
  };

  const eliminar = async (id: string) => {
    const { error } = await supabase.from("diagnosticos_clinicos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminado");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Diagnósticos CIE-10</CardTitle>
        {!adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" />Nuevo</Button>}
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="rounded-md border p-3 space-y-3 bg-muted/40">
            <Cie10Buscador value={sel ? { codigo: sel.codigo, descripcion: sel.descripcion } : null} onSelect={setSel} onClear={() => setSel(null)} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="secundario">Secundario</SelectItem>
                  <SelectItem value="sospecha">Sospecha</SelectItem>
                </SelectContent>
              </Select>
              <Select value={certeza} onValueChange={setCerteza}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setSel(null); }}>Cancelar</Button>
              <Button size="sm" onClick={guardar}>Guardar</Button>
            </div>
          </div>
        )}

        {items.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-4">Sin diagnósticos registrados</p>
        )}

        <div className="space-y-2">
          {items.map((d) => (
            <div key={d.id} className="flex items-start gap-2 rounded-md border p-2">
              <Badge variant="outline" className="font-mono shrink-0">{d.cie10_codigo}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm">{d.cie10_descripcion}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{d.tipo}</Badge>
                  <Badge variant={d.certeza === "confirmado" ? "default" : "outline"} className="text-xs">{d.certeza}</Badge>
                </div>
                {d.notas && <p className="text-xs text-muted-foreground mt-1">{d.notas}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => eliminar(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default DiagnosticosManager;
