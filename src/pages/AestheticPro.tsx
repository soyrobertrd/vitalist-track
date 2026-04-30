import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Camera, CreditCard, Package } from "lucide-react";

const estadoLeadColor: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contactado: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  cita_agendada: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  evaluado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  presupuestado: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  convertido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  perdido: "bg-muted text-muted-foreground",
  reactivar: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const origenIcon: Record<string, string> = {
  instagram: "📸", whatsapp: "💬", meta_ads: "📢", google_ads: "🔍", web: "🌐", referido: "👥", llamada: "📞", otro: "📌",
};

export default function AestheticPro() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("leads");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads_estetica", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("leads_estetica" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: evaluaciones = [] } = useQuery({
    queryKey: ["evaluaciones_esteticas", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("evaluaciones_esteticas" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: procedimientos = [] } = useQuery({
    queryKey: ["procedimientos_esteticos", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("procedimientos_esteticos" as any).select("*").eq("workspace_id", currentWorkspace!.id).eq("activo", true).order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: paquetes = [] } = useQuery({
    queryKey: ["paquetes_esteticos", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("paquetes_esteticos" as any).select("*").eq("workspace_id", currentWorkspace!.id).eq("activo", true).order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: financiamientos = [] } = useQuery({
    queryKey: ["financiamiento_estetico", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("financiamiento_estetico" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(50);
      return (data || []) as any[];
    },
  });

  const convertidos = leads.filter((l: any) => l.estado === "convertido").length;
  const tasaConversion = leads.length > 0 ? Math.round((convertidos / leads.length) * 100) : 0;
  const balancePendiente = financiamientos.reduce((s: number, f: any) => s + (f.balance_pendiente || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6" /> Aesthetic Pro
        </h1>
        <p className="text-muted-foreground">CRM, evaluaciones y gestión de clínica estética</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{leads.length}</p>
          <p className="text-xs text-muted-foreground">Leads totales</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{tasaConversion}%</p>
          <p className="text-xs text-muted-foreground">Tasa conversión</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Camera className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{evaluaciones.length}</p>
          <p className="text-xs text-muted-foreground">Evaluaciones</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{paquetes.length}</p>
          <p className="text-xs text-muted-foreground">Paquetes activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CreditCard className="h-5 w-5 mx-auto mb-1 text-orange-500" />
          <p className="text-2xl font-bold">${balancePendiente.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Por cobrar</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="leads">Leads CRM</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
          <TabsTrigger value="procedimientos">Procedimientos</TabsTrigger>
          <TabsTrigger value="paquetes">Paquetes</TabsTrigger>
          <TabsTrigger value="financiamiento">Financiamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-3">
          {leads.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay leads</CardContent></Card>
          ) : leads.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{origenIcon[l.origen] || "📌"} {l.numero} — {l.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.procedimiento_interes || ""} {l.telefono ? `· ${l.telefono}` : ""}
                  </p>
                </div>
                <Badge className={estadoLeadColor[l.estado] || ""}>{l.estado.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="evaluaciones" className="space-y-3">
          {evaluaciones.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.procedimiento_recomendado || ""} · IMC: {e.imc || "—"} {e.presupuesto ? `· $${e.presupuesto}` : ""}
                  </p>
                  {e.objetivos && <p className="text-xs text-muted-foreground">{e.objetivos}</p>}
                </div>
                <Badge variant={e.estado === "aprobada" ? "default" : "secondary"}>{e.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="procedimientos" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedimientos.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <p className="font-medium">{p.nombre}</p>
                <Badge variant="outline" className="mt-1">{p.categoria}</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {p.duracion_minutos ? `${p.duracion_minutos} min` : ""} {p.dias_recuperacion ? `· ${p.dias_recuperacion} días recup.` : ""}
                </p>
                {p.precio_base && <p className="text-lg font-bold mt-1">${p.precio_base}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="paquetes" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paquetes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <p className="font-bold text-lg">{p.nombre}</p>
                <div className="flex gap-2 mt-2">
                  {p.precio_regular && <span className="text-sm line-through text-muted-foreground">${p.precio_regular}</span>}
                  {p.precio_paquete && <span className="text-lg font-bold text-green-600">${p.precio_paquete}</span>}
                </div>
                {p.descripcion && <p className="text-sm text-muted-foreground mt-2">{p.descripcion}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="financiamiento" className="space-y-3">
          {financiamientos.map((f: any) => (
            <Card key={f.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{f.numero} — {f.procedimiento || "Procedimiento"}</p>
                  <p className="text-sm text-muted-foreground">
                    Total: ${f.monto_total} · {f.numero_cuotas} cuotas · Balance: ${f.balance_pendiente || 0}
                  </p>
                </div>
                <Badge variant={f.estado === "pagado" ? "default" : f.estado === "vencido" ? "destructive" : "secondary"}>{f.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
