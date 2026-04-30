import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoCasoColor: Record<string, string> = {
  abierto: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_seguimiento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  referido: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  cerrado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archivado: "bg-muted text-muted-foreground",
};

const prioridadColor: Record<string, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgente: "bg-destructive/10 text-destructive",
};

const estadoRefColor: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  enviado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aceptado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rechazado: "bg-destructive/10 text-destructive",
  completado: "bg-muted text-muted-foreground",
};

export default function TrabajoSocial() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("casos");

  const { data: casos = [] } = useQuery({
    queryKey: ["casos_trabajo_social", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("casos_trabajo_social" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: referimientos = [] } = useQuery({
    queryKey: ["referimientos_sociales", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("referimientos_sociales" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const activos = casos.filter((c: any) => !["cerrado", "archivado"].includes(c.estado)).length;
  const urgentes = casos.filter((c: any) => c.prioridad === "urgente" && c.estado !== "cerrado").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6" /> Trabajo Social
        </h1>
        <p className="text-muted-foreground">Gestión de casos sociales y referimientos comunitarios</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{activos}</p>
          <p className="text-xs text-muted-foreground">Casos activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-destructive">{urgentes}</p>
          <p className="text-xs text-muted-foreground">Urgentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ArrowRightLeft className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{referimientos.filter((r: any) => r.estado === "pendiente").length}</p>
          <p className="text-xs text-muted-foreground">Referimientos pendientes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{casos.filter((c: any) => c.estado === "cerrado").length}</p>
          <p className="text-xs text-muted-foreground">Cerrados</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="casos">Casos</TabsTrigger>
          <TabsTrigger value="referimientos">Referimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="casos" className="space-y-3">
          {casos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay casos</CardContent></Card>
          ) : casos.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.numero} — {c.tipo_caso.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">{c.descripcion || "Sin descripción"}</p>
                  {c.nivel_socioeconomico && <p className="text-xs text-muted-foreground">Nivel: {c.nivel_socioeconomico}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={estadoCasoColor[c.estado] || ""}>{c.estado.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className={prioridadColor[c.prioridad] || ""}>{c.prioridad}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="referimientos" className="space-y-3">
          {referimientos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay referimientos</CardContent></Card>
          ) : referimientos.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.institucion_destino}</p>
                  <p className="text-sm text-muted-foreground">{r.motivo}</p>
                  {r.resultado && <p className="text-xs font-medium mt-1">{r.resultado}</p>}
                </div>
                <Badge className={estadoRefColor[r.estado] || ""}>{r.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
