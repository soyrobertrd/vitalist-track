import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, FileText, AlertTriangle } from "lucide-react";

const tipoColor: Record<string, string> = {
  biologico_infeccioso: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  punzocortante: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  quimico: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  farmaceutico: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  radioactivo: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  comun: "bg-muted text-muted-foreground",
  anatomopatologico: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
};

const estadoColor: Record<string, string> = {
  generado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  recolectado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  almacenado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  transportado: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  tratado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  dispuesto: "bg-muted text-muted-foreground",
};

export default function Residuos() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("residuos");

  const { data: residuos = [] } = useQuery({
    queryKey: ["residuos_hospitalarios", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("residuos_hospitalarios" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const { data: manifiestos = [] } = useQuery({
    queryKey: ["manifiestos_residuos", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("manifiestos_residuos" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const peligrosos = residuos.filter((r: any) => !["comun"].includes(r.tipo)).length;
  const pendientes = residuos.filter((r: any) => !["tratado", "dispuesto"].includes(r.estado)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trash2 className="h-6 w-6" /> Gestión de Residuos
        </h1>
        <p className="text-muted-foreground">Control de residuos hospitalarios y manifiestos de transporte</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{residuos.length}</p>
          <p className="text-xs text-muted-foreground">Total registros</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{peligrosos}</p>
          <p className="text-xs text-muted-foreground">Peligrosos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{pendientes}</p>
          <p className="text-xs text-muted-foreground">Pendientes disposición</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{manifiestos.length}</p>
          <p className="text-xs text-muted-foreground">Manifiestos</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="residuos">Residuos</TabsTrigger>
          <TabsTrigger value="manifiestos">Manifiestos</TabsTrigger>
        </TabsList>

        <TabsContent value="residuos" className="space-y-3">
          {residuos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay registros</CardContent></Card>
          ) : residuos.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.area_generadora || "Sin área"} · {r.peso_kg ? `${r.peso_kg} kg` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={tipoColor[r.tipo] || ""}>{r.tipo.replace(/_/g, " ")}</Badge>
                  <Badge className={estadoColor[r.estado] || ""}>{r.estado}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="manifiestos" className="space-y-3">
          {manifiestos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay manifiestos</CardContent></Card>
          ) : manifiestos.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.numero} — {m.transportista}</p>
                  <p className="text-sm text-muted-foreground">
                    Destino: {m.destino} · {m.peso_total_kg ? `${m.peso_total_kg} kg` : ""}
                  </p>
                </div>
                <Badge variant={m.verificado ? "default" : "secondary"}>{m.verificado ? "Verificado" : "Pendiente"}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
