import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Glasses, FileText, Package, AlertTriangle, Users, CalendarDays, DollarSign, Calculator } from "lucide-react";
import VerticalPersonalTab from "@/components/vertical/VerticalPersonalTab";
import VerticalCitasTab from "@/components/vertical/VerticalCitasTab";
import VerticalFacturacionTab from "@/components/vertical/VerticalFacturacionTab";
import VerticalNominaTab from "@/components/vertical/VerticalNominaTab";
import VerticalPacientesTab from "@/components/vertical/VerticalPacientesTab";

const estadoOrdenColor: Record<string, string> = {
  solicitada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_laboratorio: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  lista: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  entregada: "bg-muted text-muted-foreground",
  devuelta: "bg-destructive/10 text-destructive",
};

export default function VisionCarePro() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("recetas");

  const { data: recetas = [] } = useQuery({
    queryKey: ["recetas_oftalmicas", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("recetas_oftalmicas" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: inventario = [] } = useQuery({
    queryKey: ["inventario_optica", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("inventario_optica" as any).select("*").eq("workspace_id", currentWorkspace!.id).eq("activo", true).order("tipo");
      return (data || []) as any[];
    },
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_trabajo_optica", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("ordenes_trabajo_optica" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const monturas = inventario.filter((i: any) => i.tipo === "montura").length;
  const stockBajo = inventario.filter((i: any) => (i.stock || 0) < (i.stock_minimo || 2)).length;
  const ordenesPendientes = ordenes.filter((o: any) => !["entregada", "devuelta"].includes(o.estado)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Eye className="h-6 w-6" /> VisionCare Pro
        </h1>
        <p className="text-muted-foreground">Recetas oftálmicas, inventario óptico y órdenes de laboratorio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{recetas.length}</p>
          <p className="text-xs text-muted-foreground">Recetas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Glasses className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{monturas}</p>
          <p className="text-xs text-muted-foreground">Monturas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{inventario.length}</p>
          <p className="text-xs text-muted-foreground">Productos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold">{stockBajo}</p>
          <p className="text-xs text-muted-foreground">Stock bajo</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{ordenesPendientes}</p>
          <p className="text-xs text-muted-foreground">Órdenes pendientes</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="recetas">Recetas</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes Lab</TabsTrigger>
          <TabsTrigger value="pacientes" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Pacientes</TabsTrigger>
          <TabsTrigger value="citas" className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Citas</TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Doctores</TabsTrigger>
          <TabsTrigger value="facturacion" className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Facturación</TabsTrigger>
          <TabsTrigger value="nomina" className="flex items-center gap-1"><Calculator className="h-3.5 w-3.5" /> Nómina</TabsTrigger>
        </TabsList>

        <TabsContent value="recetas" className="space-y-3">
          {recetas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay recetas</CardContent></Card>
          ) : recetas.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <p className="font-medium">{r.numero}</p>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <p className="font-medium text-xs text-muted-foreground">OD (Derecho)</p>
                    <p>Esf: {r.od_esfera ?? "—"} Cil: {r.od_cilindro ?? "—"} Eje: {r.od_eje ?? "—"}</p>
                    {r.od_add && <p>ADD: {r.od_add}</p>}
                  </div>
                  <div>
                    <p className="font-medium text-xs text-muted-foreground">OI (Izquierdo)</p>
                    <p>Esf: {r.oi_esfera ?? "—"} Cil: {r.oi_cilindro ?? "—"} Eje: {r.oi_eje ?? "—"}</p>
                    {r.oi_add && <p>ADD: {r.oi_add}</p>}
                  </div>
                </div>
                {r.distancia_pupilar && <p className="text-xs text-muted-foreground mt-1">DP: {r.distancia_pupilar}mm</p>}
                {r.tipo_lente_recomendado && <Badge variant="outline" className="mt-2">{r.tipo_lente_recomendado}</Badge>}
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
                  <p className="font-medium">{i.marca || ""} {i.modelo || i.tipo}</p>
                  <p className="text-sm text-muted-foreground">
                    {i.tipo.replace(/_/g, " ")} {i.color ? `· ${i.color}` : ""} {i.material ? `· ${i.material}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {i.stock} · Precio: ${i.precio_venta || 0}
                  </p>
                </div>
                {(i.stock || 0) < (i.stock_minimo || 2) && <Badge variant="destructive">Stock bajo</Badge>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-3">
          {ordenes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay órdenes</CardContent></Card>
          ) : ordenes.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    {o.tipo_lente || ""} · {o.laboratorio || ""} 
                    {o.tratamientos?.length > 0 ? ` · ${(o.tratamientos as string[]).join(", ")}` : ""}
                  </p>
                  {o.precio_total && <p className="text-sm font-medium">${o.precio_total}</p>}
                </div>
                <Badge className={estadoOrdenColor[o.estado] || ""}>{o.estado.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
