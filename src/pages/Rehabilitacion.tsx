import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Dumbbell, TrendingUp, Activity, Calendar } from "lucide-react";

const TIPOS_REHAB = ["fisioterapia","ocupacional","respiratoria","neurologica","cardiaca","deportiva"];

const Rehabilitacion = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("planes");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: planes } = useQuery({
    queryKey: ["planes-rehab", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase.from("planes_rehabilitacion")
        .select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const { data: sesiones } = useQuery({
    queryKey: ["sesiones-rehab", selectedPlanId],
    queryFn: async () => {
      if (!selectedPlanId) return [];
      const { data } = await supabase.from("sesiones_rehabilitacion")
        .select("*").eq("plan_id", selectedPlanId)
        .order("numero_sesion", { ascending: true });
      return data || [];
    },
    enabled: !!selectedPlanId,
  });

  const activos = (planes || []).filter(p => p.estado === "activo").length;
  const completados = (planes || []).filter(p => p.estado === "completado").length;

  const addSesion = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) throw new Error();
      const nextNum = (sesiones || []).length + 1;
      const { error } = await supabase.from("sesiones_rehabilitacion").insert({
        plan_id: selectedPlanId,
        numero_sesion: nextNum,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sesiones-rehab"] });
      toast.success("Sesión registrada");
    },
    onError: () => toast.error("Error"),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rehabilitación y Fisioterapia</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Dumbbell className="h-6 w-6 mx-auto text-primary" /><p className="text-2xl font-bold">{activos}</p><p className="text-xs text-muted-foreground">Planes activos</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="h-6 w-6 mx-auto text-green-500" /><p className="text-2xl font-bold">{completados}</p><p className="text-xs text-muted-foreground">Completados</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Activity className="h-6 w-6 mx-auto text-blue-500" /><p className="text-2xl font-bold">{(planes || []).length}</p><p className="text-xs text-muted-foreground">Total planes</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
        </TabsList>

        <TabsContent value="planes">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Número</TableHead><TableHead>Paciente</TableHead><TableHead>Tipo</TableHead><TableHead>Duración</TableHead><TableHead>Estado</TableHead><TableHead>Inicio</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(planes || []).map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedPlanId(p.id); setTab("sesiones"); }}>
                      <TableCell className="font-mono">{p.numero}</TableCell>
                      <TableCell>{p.pacientes?.nombre} {p.pacientes?.apellido}</TableCell>
                      <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                      <TableCell>{p.duracion_semanas} sem / {p.sesiones_por_semana}x</TableCell>
                      <TableCell><Badge variant={p.estado === "activo" ? "default" : p.estado === "completado" ? "secondary" : "destructive"}>{p.estado}</Badge></TableCell>
                      <TableCell>{new Date(p.fecha_inicio + "T12:00:00").toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sesiones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sesiones {selectedPlanId ? "" : "(seleccione un plan)"}</CardTitle>
              {selectedPlanId && <Button size="sm" onClick={() => addSesion.mutate()} disabled={addSesion.isPending}><Plus className="h-4 w-4 mr-1" /> Nueva Sesión</Button>}
            </CardHeader>
            <CardContent>
              {!selectedPlanId ? (
                <p className="text-muted-foreground text-center py-4">Seleccione un plan de la pestaña Planes.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>#</TableHead><TableHead>Fecha</TableHead><TableHead>Duración</TableHead><TableHead>Dolor antes</TableHead><TableHead>Dolor después</TableHead><TableHead>Progreso</TableHead><TableHead>Asistió</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(sesiones || []).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold">{s.numero_sesion}</TableCell>
                        <TableCell>{new Date(s.fecha + "T12:00:00").toLocaleDateString()}</TableCell>
                        <TableCell>{s.duracion_minutos} min</TableCell>
                        <TableCell>{s.dolor_antes ?? "—"}/10</TableCell>
                        <TableCell>{s.dolor_despues ?? "—"}/10</TableCell>
                        <TableCell>{s.progreso_pct}%</TableCell>
                        <TableCell><Badge variant={s.asistio ? "default" : "destructive"}>{s.asistio ? "Sí" : "No"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Rehabilitacion;
