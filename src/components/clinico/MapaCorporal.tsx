import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useVertical } from "@/contexts/VerticalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Marca {
  id: string;
  tipo: string;
  vista: string;
  pos_x: number;
  pos_y: number;
  color: string | null;
  severidad: number | null;
  etiqueta: string | null;
  notas: string | null;
  fecha: string;
}

const TIPOS_POR_VERTICAL: Record<string, { value: string; label: string; color: string }[]> = {
  clinica:  [{ value: "dolor", label: "Dolor", color: "#ef4444" }, { value: "lesion", label: "Lesión", color: "#f59e0b" }, { value: "herida", label: "Herida", color: "#dc2626" }],
  recovery: [{ value: "herida", label: "Herida", color: "#dc2626" }, { value: "ulcera", label: "Úlcera", color: "#b91c1c" }, { value: "edema", label: "Edema", color: "#3b82f6" }],
  aesthetic:[{ value: "tratamiento", label: "Zona a tratar", color: "#a855f7" }, { value: "cicatriz", label: "Cicatriz", color: "#6b7280" }, { value: "tatuaje", label: "Tatuaje", color: "#0ea5e9" }],
  dental:   [{ value: "lesion", label: "Lesión bucal/facial", color: "#f59e0b" }],
  vision:   [{ value: "lesion", label: "Lesión", color: "#f59e0b" }],
  default:  [{ value: "general", label: "General", color: "#ef4444" }],
};

export function MapaCorporal({ pacienteId }: { pacienteId: string }) {
  const { verticalActiva } = useVertical();
  const { currentWorkspaceId } = useWorkspace();
  const [vista, setVista] = useState("frontal");
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [editando, setEditando] = useState<Partial<Marca> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const v = verticalActiva && verticalActiva !== "todas" ? verticalActiva : "clinica";
  const tipos = TIPOS_POR_VERTICAL[v] ?? TIPOS_POR_VERTICAL.default;

  async function load() {
    const { data } = await supabase.from("mapa_corporal_marcas" as any)
      .select("*").eq("paciente_id", pacienteId).order("fecha", { ascending: false });
    setMarcas((data as any) ?? []);
  }
  useEffect(() => { void load(); }, [pacienteId]);

  function onMapClick(e: React.MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setEditando({ pos_x: x, pos_y: y, vista, tipo: tipos[0].value, color: tipos[0].color, severidad: 5 });
  }

  async function guardar() {
    if (!editando || !currentWorkspaceId) return;
    const { error } = await supabase.from("mapa_corporal_marcas" as any).insert({
      workspace_id: currentWorkspaceId,
      paciente_id: pacienteId,
      vertical: v,
      tipo: editando.tipo, vista: editando.vista,
      pos_x: editando.pos_x, pos_y: editando.pos_y,
      color: editando.color, severidad: editando.severidad,
      etiqueta: editando.etiqueta ?? null, notas: editando.notas ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Marca registrada"); setEditando(null); void load();
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from("mapa_corporal_marcas" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada"); void load();
  }

  const marcasVisibles = marcas.filter(m => m.vista === vista);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mapa corporal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={vista} onValueChange={setVista}>
          <TabsList>
            <TabsTrigger value="frontal">Frontal</TabsTrigger>
            <TabsTrigger value="posterior">Posterior</TabsTrigger>
            <TabsTrigger value="lateral_izq">Lat. Izq</TabsTrigger>
            <TabsTrigger value="lateral_der">Lat. Der</TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          ref={ref}
          onClick={onMapClick}
          className="relative mx-auto bg-muted/30 border rounded-lg cursor-crosshair select-none"
          style={{ width: 240, height: 480 }}
        >
          {/* Silueta SVG simple */}
          <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full text-muted-foreground/40" preserveAspectRatio="none">
            <circle cx="50" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            <path d="M30 35 L70 35 L75 100 L65 180 L55 180 L52 110 L48 110 L45 180 L35 180 L25 100 Z" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            <path d="M30 40 L15 90 M70 40 L85 90" fill="none" stroke="currentColor" strokeWidth="0.8"/>
          </svg>
          {marcasVisibles.map(m => (
            <div key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background"
              style={{ left: `${m.pos_x}%`, top: `${m.pos_y}%`, width: 16, height: 16, background: m.color ?? "#ef4444" }}
              title={m.etiqueta ?? m.tipo}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Haz clic en la silueta para añadir una marca.</p>

        {marcasVisibles.length > 0 && (
          <div className="space-y-1">
            {marcasVisibles.map(m => (
              <div key={m.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: m.color ?? "#ef4444" }}/>
                  <Badge variant="outline" className="capitalize">{m.tipo}</Badge>
                  {m.etiqueta && <span>{m.etiqueta}</span>}
                  {m.severidad != null && <span className="text-muted-foreground">· {m.severidad}/10</span>}
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => eliminar(m.id)}>
                  <Trash2 className="h-3 w-3"/>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nueva marca</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tipo</Label>
              <Select value={editando?.tipo ?? ""} onValueChange={(val) => {
                const t = tipos.find(x => x.value === val);
                setEditando({ ...editando!, tipo: val, color: t?.color ?? editando?.color });
              }}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Etiqueta</Label><Input value={editando?.etiqueta ?? ""} onChange={(e) => setEditando({ ...editando!, etiqueta: e.target.value })}/></div>
            <div><Label>Severidad (0-10)</Label><Input type="number" min={0} max={10} value={editando?.severidad ?? 5} onChange={(e) => setEditando({ ...editando!, severidad: parseInt(e.target.value || "0") })}/></div>
            <div><Label>Notas</Label><Textarea value={editando?.notas ?? ""} onChange={(e) => setEditando({ ...editando!, notas: e.target.value })}/></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
