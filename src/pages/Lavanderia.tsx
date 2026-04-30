import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shirt, Package, AlertTriangle } from "lucide-react";

const estadoOrdenColor: Record<string, string> = {
  recibida: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_lavado: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  secado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  planchado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  lista: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  entregada: "bg-muted text-muted-foreground",
};

export default function Lavanderia() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("ordenes");

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_lavanderia", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("ordenes_lavanderia" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: inventario = [] } = useQuery({
    queryKey: ["inventario_ropa", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("inventario_ropa" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("tipo");
      return (data || []) as any[];
    },
  });

  const enProceso = ordenes.filter((o: any) => !["lista", "entregada"].includes(o.estado)).length;
  const stockBajo = inventario.filter((i: any) => (i.cantidad_disponible || 0) < (i.stock_minimo || 10)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shirt className="h-6 w-6" /> Lavandería y Ropería
        </h1>
        <p className="text-muted-foreground">Órdenes de lavado e inventario de ropa hospitalaria</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{ordenes.length}</p>
          <p className="text-xs text-muted-foreground">Total órdenes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{enProceso}</p>
          <p className="text-xs text-muted-foreground">En proceso</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{inventario.length}</p>
          <p className="text-xs text-muted-foreground">Tipos de ropa</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{stockBajo}</p>
          <p className="text-xs text-muted-foreground">Stock bajo</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-3">
          {ordenes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay órdenes</CardContent></Card>
          ) : ordenes.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.numero} — {o.servicio_solicitante}</p>
                  <p className="text-sm text-muted-foreground">
                    {o.tipo_ropa.replace(/_/g, " ")} · {o.cantidad_piezas ? `${o.cantidad_piezas} piezas` : ""} {o.peso_kg ? `· ${o.peso_kg} kg` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={estadoOrdenColor[o.estado] || ""}>{o.estado.replace(/_/g, " ")}</Badge>
                  {o.prioridad === "urgente" && <Badge variant="destructive">Urgente</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="inventario" className="space-y-3">
          {inventario.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay inventario</CardContent></Card>
          ) : inventario.map((i: any) => (
            <Card key={i.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{i.tipo}</p>
                  <p className="text-sm text-muted-foreground">
                    Disponible: {i.cantidad_disponible} · Lavado: {i.en_lavado || 0} · Baja: {i.en_baja || 0} · Total: {i.cantidad_total}
                  </p>
                </div>
                {(i.cantidad_disponible || 0) < (i.stock_minimo || 10) && (
                  <Badge variant="destructive">Stock bajo</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
