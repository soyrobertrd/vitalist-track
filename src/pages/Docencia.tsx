import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, FlaskConical, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoRotColor: Record<string, string> = {
  activa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelada: "bg-muted text-muted-foreground",
  suspendida: "bg-destructive/10 text-destructive",
};

const comiteColor: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  aprobado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rechazado: "bg-destructive/10 text-destructive",
  suspendido: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  exento: "bg-muted text-muted-foreground",
};

export default function Docencia() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("programas");

  const { data: programas = [] } = useQuery({
    queryKey: ["programas_docencia", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("programas_docencia" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: rotaciones = [] } = useQuery({
    queryKey: ["residentes_rotaciones", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("residentes_rotaciones" as any)
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const { data: protocolos = [] } = useQuery({
    queryKey: ["protocolos_investigacion", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase
        .from("protocolos_investigacion" as any)
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
          <GraduationCap className="h-6 w-6" /> Docencia e Investigación
        </h1>
        <p className="text-muted-foreground">Programas académicos, residencias y protocolos de investigación</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{programas.filter((p: any) => p.activo).length}</p>
          <p className="text-xs text-muted-foreground">Programas activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{rotaciones.filter((r: any) => r.estado === "activa").length}</p>
          <p className="text-xs text-muted-foreground">Residentes activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FlaskConical className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{protocolos.filter((p: any) => p.estado === "activo").length}</p>
          <p className="text-xs text-muted-foreground">Investigaciones activas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{protocolos.filter((p: any) => p.comite_etica === "aprobado").length}</p>
          <p className="text-xs text-muted-foreground">Aprobadas por ética</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="programas">Programas</TabsTrigger>
          <TabsTrigger value="residentes">Residentes / Rotaciones</TabsTrigger>
          <TabsTrigger value="investigacion">Investigación</TabsTrigger>
        </TabsList>

        <TabsContent value="programas" className="space-y-3">
          {programas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay programas</CardContent></Card>
          ) : programas.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.tipo} · {p.especialidad || ""} {p.duracion_meses ? `· ${p.duracion_meses} meses` : ""}
                    {p.cupo_maximo ? ` · Cupo: ${p.cupo_maximo}` : ""}
                  </p>
                </div>
                <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="residentes" className="space-y-3">
          {rotaciones.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay rotaciones</CardContent></Card>
          ) : rotaciones.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.nombre_residente || "Residente"}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.universidad || ""} · {r.area_rotacion || ""}
                    {r.periodo_inicio ? ` · ${format(new Date(r.periodo_inicio + "T12:00:00"), "MMM yyyy", { locale: es })}` : ""}
                    {r.periodo_fin ? ` - ${format(new Date(r.periodo_fin + "T12:00:00"), "MMM yyyy", { locale: es })}` : ""}
                  </p>
                  {r.calificacion_final && <p className="text-xs font-medium">Calificación: {r.calificacion_final}</p>}
                </div>
                <Badge className={estadoRotColor[r.estado] || ""}>{r.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="investigacion" className="space-y-3">
          {protocolos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay protocolos</CardContent></Card>
          ) : protocolos.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.numero} — {p.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.estado} · Comité ética: <span className="font-medium">{p.comite_etica}</span>
                    {p.tamano_muestra ? ` · n=${p.tamano_muestra}` : ""}
                  </p>
                  {p.financiamiento && <p className="text-xs text-muted-foreground">Financiamiento: {p.financiamiento}</p>}
                </div>
                <Badge className={comiteColor[p.comite_etica] || ""}>{p.comite_etica}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
