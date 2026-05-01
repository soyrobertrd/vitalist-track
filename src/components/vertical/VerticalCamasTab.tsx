import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BedDouble, History, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props { verticalTipo: string; }

export default function VerticalCamasTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: camas = [] } = useQuery({
    queryKey: ["camas_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("camas_vertical")
        .select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", wsId!)
        .eq("vertical_tipo", verticalTipo)
        .order("piso", { ascending: true });
      return data || [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["ocupacion_camas_log", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ocupacion_camas_log")
        .select("*, camas_vertical(nombre, piso, sala), pacientes(nombre, apellido)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const estadoColor: Record<string, string> = {
    disponible: "bg-green-100 text-green-800",
    ocupada: "bg-red-100 text-red-800",
    limpieza: "bg-yellow-100 text-yellow-800",
    mantenimiento: "bg-orange-100 text-orange-800",
    reservada: "bg-blue-100 text-blue-800",
  };

  const resumen = {
    total: camas.length,
    disponibles: camas.filter((c: any) => c.estado === "disponible").length,
    ocupadas: camas.filter((c: any) => c.estado === "ocupada").length,
  };
  const ocupacion = resumen.total ? Math.round((resumen.ocupadas / resumen.total) * 100) : 0;

  return (
    <Tabs defaultValue="mapa" className="space-y-4">
      <TabsList>
        <TabsTrigger value="mapa"><BedDouble className="h-4 w-4 mr-1" /> Mapa de Camas</TabsTrigger>
        <TabsTrigger value="historial"><History className="h-4 w-4 mr-1" /> Historial</TabsTrigger>
      </TabsList>

      <TabsContent value="mapa" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold">{resumen.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-green-600">{resumen.disponibles}</p><p className="text-xs text-muted-foreground">Disponibles</p></CardContent></Card>
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-red-600">{resumen.ocupadas}</p><p className="text-xs text-muted-foreground">Ocupadas</p></CardContent></Card>
          <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold">{ocupacion}%</p><p className="text-xs text-muted-foreground">Ocupación</p></CardContent></Card>
        </div>
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva Cama</Button>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          {camas.map((c: any) => (
            <Card key={c.id} className="relative">
              <CardContent className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{c.nombre}</span>
                  <Badge className={`text-xs ${estadoColor[c.estado] || ""}`}>{c.estado}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{[c.piso, c.sala].filter(Boolean).join(" · ") || "—"}</p>
                {c.pacientes && <p className="text-xs">{c.pacientes.nombre} {c.pacientes.apellido}</p>}
              </CardContent>
            </Card>
          ))}
          {camas.length === 0 && <p className="text-sm text-muted-foreground col-span-4 py-8 text-center">No hay camas registradas</p>}
        </div>
      </TabsContent>

      <TabsContent value="historial">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cama</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Egreso</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>{(l as any).camas_vertical?.nombre || "—"}</TableCell>
                <TableCell>{l.pacientes ? `${l.pacientes.nombre} ${l.pacientes.apellido}` : "—"}</TableCell>
                <TableCell>{format(new Date(l.fecha_ingreso), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
                <TableCell>{l.fecha_egreso ? format(new Date(l.fecha_egreso), "dd/MM/yy HH:mm", { locale: es }) : "—"}</TableCell>
                <TableCell>{l.motivo_egreso || "—"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin historial</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
