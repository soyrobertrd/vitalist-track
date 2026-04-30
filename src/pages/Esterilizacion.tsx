import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Package, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoCicloColor: Record<string, string> = {
  preparado: "bg-muted text-muted-foreground",
  en_proceso: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  fallido: "bg-destructive/10 text-destructive",
};

const estadoPaqueteColor: Record<string, string> = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  en_uso: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_esterilizacion: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  retirado: "bg-muted text-muted-foreground",
};

export default function Esterilizacion() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("ciclos");

  const { data: ciclos = [] } = useQuery({
    queryKey: ["ciclos_esterilizacion", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("ciclos_esterilizacion" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const { data: paquetes = [] } = useQuery({
    queryKey: ["paquetes_quirurgicos", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("paquetes_quirurgicos" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre");
      return (data || []) as any[];
    },
  });

  const enProceso = ciclos.filter((c: any) => c.resultado === "en_proceso").length;
  const completados = ciclos.filter((c: any) => c.resultado === "completado").length;
  const fallidos = ciclos.filter((c: any) => c.resultado === "fallido").length;
  const paquetesDisponibles = paquetes.filter((p: any) => p.estado === "disponible").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6" /> Esterilización y CEYE
        </h1>
        <p className="text-muted-foreground">Control de ciclos de esterilización y paquetes quirúrgicos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{enProceso}</p>
          <p className="text-xs text-muted-foreground">En proceso</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{completados}</p>
          <p className="text-xs text-muted-foreground">Completados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{fallidos}</p>
          <p className="text-xs text-muted-foreground">Fallidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{paquetesDisponibles}</p>
          <p className="text-xs text-muted-foreground">Paquetes disponibles</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ciclos">Ciclos de Esterilización</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes Quirúrgicos</TabsTrigger>
        </TabsList>

        <TabsContent value="ciclos" className="space-y-3">
          {ciclos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay ciclos registrados</CardContent></Card>
          ) : ciclos.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.numero} — {c.equipo}</p>
                  <p className="text-sm text-muted-foreground">Método: {c.metodo} · {c.temperatura_c ? `${c.temperatura_c}°C` : ""} {c.duracion_minutos ? `· ${c.duracion_minutos} min` : ""}</p>
                </div>
                <Badge className={estadoCicloColor[c.resultado] || ""}>{c.resultado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="paquetes" className="space-y-3">
          {paquetes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay paquetes registrados</CardContent></Card>
          ) : paquetes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.nombre} {p.codigo ? `(${p.codigo})` : ""}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.fecha_vencimiento_esterilizacion ? `Vence: ${format(new Date(p.fecha_vencimiento_esterilizacion), "dd/MM/yyyy", { locale: es })}` : "Sin vencimiento"}
                  </p>
                </div>
                <Badge className={estadoPaqueteColor[p.estado] || ""}>{p.estado.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
