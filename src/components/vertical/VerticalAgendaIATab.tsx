import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Brain, TrendingDown, Calendar, Lightbulb, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalAgendaIATab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const { data: predicciones = [] } = useQuery({
    queryKey: ["agenda_ia_predicciones", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("agenda_ia_predicciones") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: sugerencias = [] } = useQuery({
    queryKey: ["agenda_ia_sugerencias", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("agenda_ia_sugerencias") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).eq("estado", "pendiente").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const aplicarSugerencia = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from("agenda_ia_sugerencias") as any)
        .update({ estado: "aplicada", aplicada_por: user?.id, aplicada_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sugerencia aplicada"); qc.invalidateQueries({ queryKey: ["agenda_ia_sugerencias"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const descartarSugerencia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("agenda_ia_sugerencias") as any).update({ estado: "descartada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sugerencia descartada"); qc.invalidateQueries({ queryKey: ["agenda_ia_sugerencias"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const altaProb = predicciones.filter((p: any) => p.probabilidad >= 70);
  const mediaProb = predicciones.filter((p: any) => p.probabilidad >= 40 && p.probabilidad < 70);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Brain className="h-5 w-5" /> Agenda Inteligente + IA</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Alto riesgo no-show</span></div>
          <p className="text-2xl font-bold">{altaProb.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-yellow-600" /><span className="text-xs text-muted-foreground">Riesgo medio</span></div>
          <p className="text-2xl font-bold">{mediaProb.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Lightbulb className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Sugerencias pendientes</span></div>
          <p className="text-2xl font-bold">{sugerencias.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1"><Brain className="h-4 w-4 text-green-600" /><span className="text-xs text-muted-foreground">Predicciones totales</span></div>
          <p className="text-2xl font-bold">{predicciones.length}</p>
        </Card>
      </div>

      {sugerencias.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mt-4">Sugerencias de IA</h4>
          <div className="grid gap-2">
            {sugerencias.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.descripcion}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{s.tipo_sugerencia}</Badge>
                      <Badge variant={s.prioridad === "alta" ? "destructive" : s.prioridad === "media" ? "default" : "secondary"}>{s.prioridad}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => aplicarSugerencia.mutate(s.id)}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => descartarSugerencia.mutate(s.id)}><XCircle className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {predicciones.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mt-4">Predicciones recientes</h4>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead><TableHead>Probabilidad</TableHead><TableHead>Acción sugerida</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predicciones.slice(0, 15).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline">{p.tipo_prediccion}</Badge></TableCell>
                    <TableCell>
                      <span className={`font-bold ${p.probabilidad >= 70 ? "text-destructive" : p.probabilidad >= 40 ? "text-yellow-600" : "text-green-600"}`}>
                        {p.probabilidad}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{p.accion_sugerida || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{p.estado}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {predicciones.length === 0 && sugerencias.length === 0 && (
        <Card className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">El motor de IA analizará patrones de citas para generar predicciones y sugerencias automáticas.</p>
        </Card>
      )}
    </div>
  );
}
