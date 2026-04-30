import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Camera, CreditCard, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const nivelColor: Record<string, string> = {
  publico: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  restringido: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  critico: "bg-destructive/10 text-destructive",
};

const estadoCred: Record<string, string> = {
  activa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  suspendida: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  revocada: "bg-destructive/10 text-destructive",
  vencida: "bg-muted text-muted-foreground",
};

export default function SeguridadFisica() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("bitacora");

  const { data: areas = [] } = useQuery({
    queryKey: ["areas_seguridad", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("areas_seguridad" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: bitacora = [] } = useQuery({
    queryKey: ["bitacora_accesos", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("bitacora_accesos" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("fecha_hora", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: credenciales = [] } = useQuery({
    queryKey: ["credenciales_acceso", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("credenciales_acceso" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Seguridad Física
        </h1>
        <p className="text-muted-foreground">Control de accesos, bitácora de visitantes y credenciales</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{areas.filter((a: any) => a.activa).length}</p>
          <p className="text-xs text-muted-foreground">Áreas controladas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Camera className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{areas.reduce((s: number, a: any) => s + (a.cantidad_camaras || 0), 0)}</p>
          <p className="text-xs text-muted-foreground">Cámaras</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{bitacora.length}</p>
          <p className="text-xs text-muted-foreground">Accesos hoy</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CreditCard className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{credenciales.filter((c: any) => c.estado === "activa").length}</p>
          <p className="text-xs text-muted-foreground">Credenciales activas</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bitacora">Bitácora</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="credenciales">Credenciales</TabsTrigger>
        </TabsList>

        <TabsContent value="bitacora" className="space-y-3">
          {bitacora.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay registros</CardContent></Card>
          ) : bitacora.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{b.numero} — {b.persona_nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.tipo_persona} · {b.metodo_verificacion} · {format(new Date(b.fecha_hora), "dd/MM HH:mm", { locale: es })}
                  </p>
                  {b.motivo_visita && <p className="text-xs text-muted-foreground">{b.motivo_visita}</p>}
                </div>
                <Badge variant={b.tipo === "entrada" ? "default" : "secondary"}>{b.tipo === "entrada" ? "↓ Entrada" : "↑ Salida"}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="areas" className="space-y-3">
          {areas.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.nombre}</p>
                  <p className="text-sm text-muted-foreground">{a.ubicacion || ""} {a.capacidad ? `· Cap: ${a.capacidad}` : ""} {a.tiene_camaras ? `· ${a.cantidad_camaras} cámaras` : ""}</p>
                </div>
                <Badge className={nivelColor[a.nivel_acceso] || ""}>{a.nivel_acceso}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="credenciales" className="space-y-3">
          {credenciales.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.persona_nombre} {c.codigo_credencial ? `(${c.codigo_credencial})` : ""}</p>
                  <p className="text-sm text-muted-foreground">{c.tipo} {c.fecha_vencimiento ? `· Vence: ${c.fecha_vencimiento}` : ""}</p>
                </div>
                <Badge className={estadoCred[c.estado] || ""}>{c.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
