import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Users, Megaphone, ThumbsUp, Plus } from "lucide-react";

interface Props { verticalTipo: string; }

export default function VerticalCRMFidelizacionTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: programas = [] } = useQuery({
    queryKey: ["programa_fidelizacion", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("programa_fidelizacion")
        .select("*")
        .eq("workspace_id", wsId!)
        .eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: campanas = [] } = useQuery({
    queryKey: ["campanas_marketing", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase
        .from("campanas_marketing")
        .select("*")
        .eq("workspace_id", wsId!)
        .eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false })
        .limit(30) as any);
      return (data as any[]) || [];
    },
  });

  const { data: nps = [] } = useQuery({
    queryKey: ["nps_encuestas", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("nps_encuestas")
        .select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", wsId!)
        .eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const npsScore = nps.length > 0
    ? Math.round(((nps.filter((n: any) => n.categoria === "promotor").length - nps.filter((n: any) => n.categoria === "detractor").length) / nps.length) * 100)
    : 0;

  const campanaEstado: Record<string, string> = {
    borrador: "bg-muted",
    programada: "bg-blue-100 text-blue-800",
    enviando: "bg-yellow-100 text-yellow-800",
    completada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
  };

  return (
    <Tabs defaultValue="programas" className="space-y-4">
      <TabsList>
        <TabsTrigger value="programas"><Gift className="h-4 w-4 mr-1" /> Fidelización</TabsTrigger>
        <TabsTrigger value="campanas"><Megaphone className="h-4 w-4 mr-1" /> Campañas</TabsTrigger>
        <TabsTrigger value="nps"><ThumbsUp className="h-4 w-4 mr-1" /> NPS</TabsTrigger>
      </TabsList>

      <TabsContent value="programas" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Programa</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {programas.map((p: any) => (
            <Card key={p.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{p.nombre}</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Badge variant="outline">{p.tipo}</Badge>
                <p className="text-muted-foreground">{p.descripcion || "Sin descripción"}</p>
                <p>{p.puntos_por_unidad} pts/unidad</p>
                <Badge className={p.activo ? "bg-green-100 text-green-800" : "bg-muted"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
              </CardContent>
            </Card>
          ))}
          {programas.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">Sin programas de fidelización</p>}
        </div>
      </TabsContent>

      <TabsContent value="campanas" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva Campaña</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Enviados</TableHead>
              <TableHead>Abiertos</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanas.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nombre}</TableCell>
                <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                <TableCell>{c.enviados}</TableCell>
                <TableCell>{c.abiertos}</TableCell>
                <TableCell>{c.clicks}</TableCell>
                <TableCell><Badge className={campanaEstado[c.estado] || ""}>{c.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {campanas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin campañas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="nps" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold">{npsScore}</p><p className="text-xs text-muted-foreground">NPS Score</p></CardContent></Card>
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-green-600">{nps.filter((n: any) => n.categoria === "promotor").length}</p><p className="text-xs text-muted-foreground">Promotores</p></CardContent></Card>
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-yellow-600">{nps.filter((n: any) => n.categoria === "pasivo").length}</p><p className="text-xs text-muted-foreground">Pasivos</p></CardContent></Card>
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-red-600">{nps.filter((n: any) => n.categoria === "detractor").length}</p><p className="text-xs text-muted-foreground">Detractores</p></CardContent></Card>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Comentario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nps.map((n: any) => (
              <TableRow key={n.id}>
                <TableCell>{n.pacientes ? `${n.pacientes.nombre} ${n.pacientes.apellido}` : "—"}</TableCell>
                <TableCell className="font-mono font-bold">{n.score}</TableCell>
                <TableCell><Badge className={n.categoria === "promotor" ? "bg-green-100 text-green-800" : n.categoria === "detractor" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>{n.categoria}</Badge></TableCell>
                <TableCell className="max-w-xs truncate">{n.comentario || "—"}</TableCell>
              </TableRow>
            ))}
            {nps.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin encuestas NPS</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
