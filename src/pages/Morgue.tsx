import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoMorgueColor: Record<string, string> = {
  ingresado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_estudio: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  autopsia: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  liberado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const estadoPatColor: Record<string, string> = {
  recibido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_proceso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  entregado: "bg-muted text-muted-foreground",
};

export default function Morgue() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("morgue");

  const { data: registros = [] } = useQuery({
    queryKey: ["registros_morgue", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("registros_morgue" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const { data: estudios = [] } = useQuery({
    queryKey: ["estudios_patologia", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("estudios_patologia" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Microscope className="h-6 w-6" /> Morgue y Patología
        </h1>
        <p className="text-muted-foreground">Registro de defunciones, autopsias y estudios patológicos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{registros.filter((r: any) => r.estado !== "liberado").length}</p>
          <p className="text-xs text-muted-foreground">Morgue activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{registros.filter((r: any) => r.autopsia).length}</p>
          <p className="text-xs text-muted-foreground">Autopsias</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{estudios.filter((e: any) => e.estado === "en_proceso").length}</p>
          <p className="text-xs text-muted-foreground">Estudios en proceso</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{estudios.filter((e: any) => e.estado === "completado").length}</p>
          <p className="text-xs text-muted-foreground">Estudios completados</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="morgue">Morgue</TabsTrigger>
          <TabsTrigger value="patologia">Patología</TabsTrigger>
        </TabsList>

        <TabsContent value="morgue" className="space-y-3">
          {registros.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay registros</CardContent></Card>
          ) : registros.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.numero} — {r.nombre_fallecido || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.fecha_defuncion ? format(new Date(r.fecha_defuncion), "dd/MM/yyyy", { locale: es }) : ""} · {r.causa_muerte || "Causa pendiente"}
                  </p>
                </div>
                <Badge className={estadoMorgueColor[r.estado] || ""}>{r.estado.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="patologia" className="space-y-3">
          {estudios.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay estudios</CardContent></Card>
          ) : estudios.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e.numero} — {e.tipo}</p>
                  <p className="text-sm text-muted-foreground">Muestra: {e.muestra} · {e.sitio_anatomico || ""}</p>
                  {e.diagnostico_final && <p className="text-sm font-medium mt-1">{e.diagnostico_final}</p>}
                </div>
                <Badge className={estadoPatColor[e.estado] || ""}>{e.estado.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
