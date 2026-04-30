import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmilePlus, ClipboardList, Wrench, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoPlanColor: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  presentado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  en_progreso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completado: "bg-primary/10 text-primary",
  cancelado: "bg-destructive/10 text-destructive",
};

const estadoOrdenColor: Record<string, string> = {
  solicitada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  en_proceso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  lista: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  entregada: "bg-muted text-muted-foreground",
  devuelta: "bg-destructive/10 text-destructive",
};

export default function DentalCarePro() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("planes");

  const { data: planes = [] } = useQuery({
    queryKey: ["planes_tratamiento_dental", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("planes_tratamiento_dental" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: controles = [] } = useQuery({
    queryKey: ["controles_ortodoncia", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("controles_ortodoncia" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("fecha", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes_laboratorio_dental", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("ordenes_laboratorio_dental" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const planesActivos = planes.filter((p: any) => ["aprobado", "en_progreso"].includes(p.estado)).length;
  const ordenesPendientes = ordenes.filter((o: any) => !["entregada", "devuelta"].includes(o.estado)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SmilePlus className="h-6 w-6" /> DentalCare Pro
        </h1>
        <p className="text-muted-foreground">Planes de tratamiento, ortodoncia y laboratorio dental</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <ClipboardList className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{planesActivos}</p>
          <p className="text-xs text-muted-foreground">Planes activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{controles.length}</p>
          <p className="text-xs text-muted-foreground">Controles ortodoncia</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FlaskConical className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{ordenesPendientes}</p>
          <p className="text-xs text-muted-foreground">Lab pendiente</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">${planes.reduce((s: number, p: any) => s + (p.presupuesto_total || 0), 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Presupuesto total</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="planes">Planes de Tratamiento</TabsTrigger>
          <TabsTrigger value="ortodoncia">Ortodoncia</TabsTrigger>
          <TabsTrigger value="laboratorio">Laboratorio</TabsTrigger>
        </TabsList>

        <TabsContent value="planes" className="space-y-3">
          {planes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay planes</CardContent></Card>
          ) : planes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    Presupuesto: ${p.presupuesto_total || 0} · {p.numero_cuotas} cuotas
                    {p.aprobado && " ✅ Aprobado"}
                  </p>
                  {p.notas && <p className="text-xs text-muted-foreground">{p.notas}</p>}
                </div>
                <Badge className={estadoPlanColor[p.estado] || ""}>{p.estado.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ortodoncia" className="space-y-3">
          {controles.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay controles</CardContent></Card>
          ) : controles.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{format(new Date(c.fecha + "T12:00:00"), "dd/MM/yyyy", { locale: es })}</p>
                  <p className="text-sm text-muted-foreground">
                    Progreso: {c.progreso_porcentaje}% {c.cambio_ligas ? "· Cambio ligas ✓" : ""} {c.tipo_arco ? `· ${c.tipo_arco}` : ""}
                  </p>
                  {c.ajustes_realizados && <p className="text-xs text-muted-foreground">{c.ajustes_realizados}</p>}
                </div>
                <div className="text-right">
                  {c.pago_mensual && <p className="text-sm font-medium">${c.pago_mensual}</p>}
                  <Badge variant={c.pagado ? "default" : "secondary"}>{c.pagado ? "Pagado" : "Pendiente"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="laboratorio" className="space-y-3">
          {ordenes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay órdenes</CardContent></Card>
          ) : ordenes.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.numero} — {o.tipo}</p>
                  <p className="text-sm text-muted-foreground">
                    {o.diente ? `Diente: ${o.diente}` : ""} · {o.material || ""} · {o.laboratorio || ""}
                  </p>
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
