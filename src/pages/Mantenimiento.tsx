import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoEquipoColor: Record<string, string> = {
  operativo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  en_mantenimiento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  fuera_servicio: "bg-destructive/10 text-destructive",
  baja: "bg-muted text-muted-foreground",
};

const estadoOrdenColor: Record<string, string> = {
  solicitada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  asignada: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  en_proceso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelada: "bg-muted text-muted-foreground",
};

const prioridadColor: Record<string, string> = {
  baja: "bg-muted text-muted-foreground",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgente: "bg-destructive/10 text-destructive",
};

export default function Mantenimiento() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("ordenes");

  const { data: equipos = [] } = useQuery({
    queryKey: ["equipos_hospitalarios", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("equipos_hospitalarios" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_mantenimiento", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("ordenes_mantenimiento" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const fueraServicio = equipos.filter((e: any) => e.estado === "fuera_servicio").length;
  const ordenesPendientes = ordenes.filter((o: any) => !["completada", "cancelada"].includes(o.estado)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="h-6 w-6" /> Mantenimiento Hospitalario
        </h1>
        <p className="text-muted-foreground">Gestión de equipos biomédicos y órdenes de mantenimiento</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{equipos.length}</p>
          <p className="text-xs text-muted-foreground">Equipos totales</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{fueraServicio}</p>
          <p className="text-xs text-muted-foreground">Fuera de servicio</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{ordenesPendientes}</p>
          <p className="text-xs text-muted-foreground">Órdenes pendientes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{ordenes.filter((o: any) => o.estado === "completada").length}</p>
          <p className="text-xs text-muted-foreground">Completadas</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes de Trabajo</TabsTrigger>
          <TabsTrigger value="equipos">Equipos</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-3">
          {ordenes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay órdenes registradas</CardContent></Card>
          ) : ordenes.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.numero} — {o.tipo}</p>
                  <p className="text-sm text-muted-foreground">{o.descripcion || "Sin descripción"}</p>
                  {o.tecnico_asignado && <p className="text-xs text-muted-foreground">Técnico: {o.tecnico_asignado}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={estadoOrdenColor[o.estado] || ""}>{o.estado.replace("_", " ")}</Badge>
                  <Badge variant="outline" className={prioridadColor[o.prioridad] || ""}>{o.prioridad}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="equipos" className="space-y-3">
          {equipos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay equipos registrados</CardContent></Card>
          ) : equipos.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.marca || ""} {e.modelo || ""} {e.numero_serie ? `· S/N: ${e.numero_serie}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{e.ubicacion || ""} {e.departamento ? `· ${e.departamento}` : ""}</p>
                </div>
                <Badge className={estadoEquipoColor[e.estado] || ""}>{e.estado.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
