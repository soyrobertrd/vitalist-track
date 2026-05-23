import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Paciente = { id: string; nombre: string; apellido: string };

export default function NotasUltraPrivadas({ pacientes }: { pacientes: Paciente[] }) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const sb = supabase as any;

  const { data: notas = [], refetch } = useQuery({
    queryKey: ["notas_ultra_privadas", wsId], enabled: !!wsId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await sb.from("notas_ultra_privadas")
        .select("id, titulo, paciente_id, created_at, updated_at")
        .eq("workspace_id", wsId).eq("terapeuta_id", user?.id)
        .order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const pacMap = Object.fromEntries(pacientes.map(p => [p.id, `${p.nombre} ${p.apellido}`]));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ paciente_id: "", titulo: "", contenido: "" });
  const save = async () => {
    if (!wsId || !form.contenido) { toast.error("Contenido requerido"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { workspace_id: wsId, terapeuta_id: user?.id, titulo: form.titulo, contenido: form.contenido };
    if (form.paciente_id) payload.paciente_id = form.paciente_id;
    const { error } = await sb.from("notas_ultra_privadas").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Nota ultra privada guardada"); setOpen(false); refetch();
    setForm({ paciente_id: "", titulo: "", contenido: "" });
  };

  const [reading, setReading] = useState<{ id: string; titulo?: string; contenido?: string } | null>(null);
  const leerNota = async (id: string, titulo?: string) => {
    const { data, error } = await (supabase.rpc as any)("leer_nota_ultra_privada", { _nota_id: id });
    if (error) return toast.error(error.message);
    setReading({ id, titulo: titulo || data?.titulo, contenido: data?.contenido });
  };

  return (
    <div className="space-y-3">
      <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="py-3 text-xs flex items-start gap-2">
          <Lock className="h-4 w-4 mt-0.5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">Notas ultra privadas</p>
            <p className="text-amber-800/80 dark:text-amber-300/80">Solo tú puedes leerlas. Ni supervisor ni admin tienen acceso al contenido. Cada lectura queda registrada en auditoría.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva nota ultra privada</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Nota ultra privada</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente (opcional)</Label>
                <Select value={form.paciente_id} onValueChange={v => setForm({ ...form, paciente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sin paciente asociado" /></SelectTrigger>
                  <SelectContent>{pacientes.map(p => (<SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
              <div><Label>Contenido</Label><Textarea rows={10} value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} /></div>
              <Button onClick={save} className="w-full"><Lock className="h-4 w-4 mr-1" />Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notas.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin notas ultra privadas</CardContent></Card>
        : notas.map((n: any) => (
          <Card key={n.id}><CardContent className="py-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-amber-600" />{n.titulo || "Sin título"}</p>
              <p className="text-xs text-muted-foreground">
                {n.paciente_id && pacMap[n.paciente_id] ? `${pacMap[n.paciente_id]} · ` : ""}
                {format(new Date(n.created_at), "dd/MM/yyyy HH:mm")}
              </p>
              {reading?.id === n.id && reading.contenido && (
                <div className="mt-2 p-3 bg-muted rounded text-sm whitespace-pre-wrap">{reading.contenido}</div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => reading?.id === n.id ? setReading(null) : leerNota(n.id, n.titulo)}>
              {reading?.id === n.id ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Ocultar</> : <><Eye className="h-3.5 w-3.5 mr-1" />Leer</>}
            </Button>
          </CardContent></Card>
        ))}
      <Badge variant="outline" className="text-[10px]">Cada apertura se audita automáticamente</Badge>
    </div>
  );
}
