import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2, Code } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Token { id: string; nombre: string; api_key: string; activo: boolean; ultimo_uso: string | null; total_llamadas: number; created_at: string; }

export default function ApiPublicaCitas() {
  const { currentWorkspace } = useWorkspace();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => { void load(); }, [currentWorkspace?.id]);

  async function load() {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase.from("public_appointment_tokens" as any)
      .select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTokens((data as any) ?? []);
    setLoading(false);
  }

  async function crear() {
    if (!currentWorkspace || !nombre.trim()) return;
    const { error } = await supabase.from("public_appointment_tokens" as any)
      .insert({ workspace_id: currentWorkspace.id, nombre });
    if (error) toast.error(error.message); else { toast.success("API key generada"); setNombre(""); setOpen(false); load(); }
  }

  async function toggle(t: Token) {
    await supabase.from("public_appointment_tokens" as any).update({ activo: !t.activo }).eq("id", t.id);
    load();
  }
  async function eliminar(id: string) {
    if (!confirm("¿Eliminar API key?")) return;
    await supabase.from("public_appointment_tokens" as any).delete().eq("id", id);
    load();
  }

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-citas-publicas`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Key className="h-6 w-6"/>API Pública de Citas</h1>
          <p className="text-sm text-muted-foreground">Conecta el portal público de tu centro para que pacientes consulten y agenden</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nueva API key</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva API key</DialogTitle></DialogHeader>
            <div><Label>Nombre / descripción</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Portal Web Centro Norte"/></div>
            <DialogFooter><Button onClick={crear}>Generar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-4 w-4"/>Endpoints disponibles</CardTitle></CardHeader>
        <CardContent className="text-xs font-mono space-y-1 bg-muted/30 p-3 rounded">
          <div><Badge variant="outline">GET</Badge> {baseUrl}/profesionales</div>
          <div><Badge variant="outline">GET</Badge> {baseUrl}/disponibilidad?profesional_id=...&fecha=YYYY-MM-DD</div>
          <div><Badge variant="outline">POST</Badge> {baseUrl}/agendar</div>
          <div><Badge variant="outline">GET</Badge> {baseUrl}/mis-citas?cedula=...</div>
          <div><Badge variant="outline">POST</Badge> {baseUrl}/cancelar</div>
          <p className="mt-2 text-muted-foreground font-sans">Header requerido: <code className="bg-background px-1 rounded">x-api-key: TU_KEY</code></p>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> :
       tokens.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">Sin API keys</CardContent></Card> :
        <div className="space-y-2">
          {tokens.map(t => (
            <Card key={t.id}>
              <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">{t.nombre}</strong>
                    <Badge variant={t.activo ? "default" : "secondary"}>{t.activo ? "Activa" : "Inactiva"}</Badge>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded inline-block truncate max-w-[400px]">{t.api_key}</code>
                  <p className="text-xs text-muted-foreground">{t.total_llamadas} llamadas · Último uso: {t.ultimo_uso ? new Date(t.ultimo_uso).toLocaleString() : "nunca"}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(t.api_key); toast.success("Copiado"); }}><Copy className="h-3 w-3"/></Button>
                  <Button size="sm" variant="outline" onClick={() => toggle(t)}>{t.activo ? "Desactivar" : "Activar"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => eliminar(t.id)}><Trash2 className="h-3 w-3"/></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
