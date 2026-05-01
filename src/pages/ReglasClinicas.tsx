import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Brain, Zap, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const sevColor: Record<string, string> = {
  baja: "bg-blue-500/10 text-blue-700",
  media: "bg-yellow-500/10 text-yellow-700",
  alta: "bg-orange-500/10 text-orange-700",
  critica: "bg-destructive/20 text-destructive",
};

const catIcon: Record<string, any> = {
  sepsis: AlertTriangle,
  laboratorio: Activity,
  farmacologia: Zap,
};

export default function ReglasClinicas() {
  const [reglas, setReglas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("reglas_clinicas")
      .select("*").order("es_global", { ascending: false }).order("severidad", { ascending: false });
    setReglas(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (r: any) => {
    const { error } = await (supabase as any).from("reglas_clinicas").update({ activo: !r.activo }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(r.activo ? "Regla desactivada" : "Regla activada");
    cargar();
  };

  if (loading) return <div className="p-6">Cargando reglas...</div>;

  const activas = reglas.filter(r => r.activo).length;
  const totalDisparos = reglas.reduce((s, r) => s + (r.veces_disparada || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" /> Motor de Reglas Clínicas
        </h1>
        <p className="text-sm text-muted-foreground">Reglas configurables que disparan alertas y workflows automáticos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><div className="text-3xl font-bold">{reglas.length}</div><div className="text-xs text-muted-foreground">Reglas totales</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-emerald-600">{activas}</div><div className="text-xs text-muted-foreground">Activas</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-orange-600">{reglas.filter(r => r.severidad === "critica" || r.severidad === "alta").length}</div><div className="text-xs text-muted-foreground">Severidad alta+</div></Card>
        <Card className="p-4 text-center"><div className="text-3xl font-bold text-blue-600">{totalDisparos}</div><div className="text-xs text-muted-foreground">Disparos totales</div></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reglas.map(r => {
          const Icon = catIcon[r.categoria] || Brain;
          return (
            <Card key={r.id} className={!r.activo ? "opacity-60" : "hover:shadow-md transition"}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {r.nombre}
                  </CardTitle>
                  <Switch checked={r.activo} onCheckedChange={() => toggleActivo(r)} />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{r.codigo}</Badge>
                  <Badge className={sevColor[r.severidad] + " text-xs"}>{r.severidad}</Badge>
                  {r.es_global && <Badge variant="outline" className="text-xs">Global</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{r.descripcion}</p>
                <div className="text-xs space-y-1">
                  <div><span className="font-medium">Disparador:</span> <code className="bg-muted px-1 rounded">{r.evento_disparador}</code></div>
                  <div><span className="font-medium">Acciones:</span> {r.acciones?.length || 0}</div>
                  <div><span className="font-medium">Disparos:</span> {r.veces_disparada || 0}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
