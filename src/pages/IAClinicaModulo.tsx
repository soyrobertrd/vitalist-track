import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Brain, Sparkles, FileText, Stethoscope, Mic, AlertCircle } from "lucide-react";

const CAPACIDADES = [
  { tipo: "resumen", l: "Resumen automático de consultas", icon: FileText, desc: "Genera resumen estructurado de las notas de evolución." },
  { tipo: "diagnostico_dif", l: "Diagnóstico diferencial sugerido", icon: Stethoscope, desc: "Lista posibles diagnósticos en base a síntomas." },
  { tipo: "scribe", l: "Scribe ambiental", icon: Mic, desc: "Transcribe la consulta médica y la estructura en SOAP." },
  { tipo: "interacciones", l: "Interacciones medicamentosas en tiempo real", icon: AlertCircle, desc: "Detecta y alerta sobre interacciones críticas." },
];

export default function IAClinicaModulo() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [cfg, setCfg] = useState<any>({ habilitada: false, modelo_preferido: "", resumenes_automaticos: false, scribe_activo: false, interacciones_tiempo_real: false, consentimiento_paciente_requerido: true });
  const [sols, setSols] = useState<any[]>([]);

  const load = async () => {
    if (!wsId) return;
    const [c, s] = await Promise.all([
      supabase.from("ia_configuracion").select("*").eq("workspace_id", wsId).maybeSingle(),
      supabase.from("ia_solicitudes").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(50),
    ]);
    if (c.data) setCfg(c.data);
    setSols(s.data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const saveCfg = async () => {
    if (!wsId) return;
    const payload = { ...cfg, workspace_id: wsId };
    const { error } = await supabase.from("ia_configuracion").upsert(payload, { onConflict: "workspace_id" });
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-6 w-6" /> IA Clínica</h1>
          <p className="text-sm text-muted-foreground">Módulo preparado para integración de IA clínica. La integración con modelos reales se activará cuando se conecten las credenciales correspondientes.</p>
        </div>
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">No integrado todavía</Badge>
      </div>

      <Tabs defaultValue="cap">
        <TabsList>
          <TabsTrigger value="cap">Capacidades</TabsTrigger>
          <TabsTrigger value="cfg">Configuración</TabsTrigger>
          <TabsTrigger value="hist">Historial de solicitudes</TabsTrigger>
        </TabsList>

        <TabsContent value="cap" className="grid md:grid-cols-2 gap-4">
          {CAPACIDADES.map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.tipo}>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5" /> {c.l}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                  <Badge variant="secondary"><Sparkles className="h-3 w-3 mr-1" /> Esqueleto listo · Integración pendiente</Badge>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="cfg">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between"><Label>Habilitar IA Clínica en este centro</Label><Switch checked={cfg.habilitada} onCheckedChange={v => setCfg({ ...cfg, habilitada: v })} /></div>
            <div><Label>Modelo preferido (informativo)</Label><Input value={cfg.modelo_preferido || ""} onChange={e => setCfg({ ...cfg, modelo_preferido: e.target.value })} placeholder="Pendiente de integración" /></div>
            <div className="flex items-center justify-between"><Label>Resúmenes automáticos</Label><Switch checked={cfg.resumenes_automaticos} onCheckedChange={v => setCfg({ ...cfg, resumenes_automaticos: v })} /></div>
            <div className="flex items-center justify-between"><Label>Scribe ambiental</Label><Switch checked={cfg.scribe_activo} onCheckedChange={v => setCfg({ ...cfg, scribe_activo: v })} /></div>
            <div className="flex items-center justify-between"><Label>Interacciones en tiempo real</Label><Switch checked={cfg.interacciones_tiempo_real} onCheckedChange={v => setCfg({ ...cfg, interacciones_tiempo_real: v })} /></div>
            <div className="flex items-center justify-between"><Label>Requerir consentimiento del paciente</Label><Switch checked={cfg.consentimiento_paciente_requerido} onCheckedChange={v => setCfg({ ...cfg, consentimiento_paciente_requerido: v })} /></div>
            <Button onClick={saveCfg}>Guardar configuración</Button>
            <p className="text-xs text-muted-foreground border-t pt-2">⚠️ Estas opciones solo guardan la intención. Cuando se conecte un proveedor de IA, las funcionalidades activadas comenzarán a procesarse automáticamente.</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="hist">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Estado</TableHead><TableHead>Modelo</TableHead></TableRow></TableHeader>
            <TableBody>
              {sols.map((s: any) => <TableRow key={s.id}><TableCell>{new Date(s.created_at).toLocaleString()}</TableCell><TableCell><Badge>{s.tipo}</Badge></TableCell><TableCell>{s.estado}</TableCell><TableCell>{s.modelo || "—"}</TableCell></TableRow>)}
              {!sols.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin solicitudes registradas todavía.</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
