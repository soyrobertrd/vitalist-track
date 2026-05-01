import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

export default function ProgramaReferidos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("referidos" as any).select("*").order("fecha_referido", { ascending: false });
    if (error) toast.error(error.message);
    setData((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const upd: any = { estado: nuevoEstado };
    if (nuevoEstado === "convertido") upd.fecha_conversion = new Date().toISOString().slice(0,10);
    const { error } = await supabase.from("referidos" as any).update(upd).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Estado actualizado");
    load();
  };

  const stats = {
    total: data.length,
    pendientes: data.filter(d => d.estado === "pendiente").length,
    convertidos: data.filter(d => d.estado === "convertido").length,
    tasa: data.length ? Math.round(data.filter(d => d.estado === "convertido").length / data.length * 100) : 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><UserPlus className="h-7 w-7 text-primary" /> Programa de referidos</h1>
        <p className="text-muted-foreground">Empleados ganan comisión, pacientes ganan beneficios.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></div></div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">Pendientes</div><div className="text-2xl font-bold">{stats.pendientes}</div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">Convertidos</div><div className="text-2xl font-bold text-green-600">{stats.convertidos}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-emerald-500" /><div><div className="text-sm text-muted-foreground">Conversión</div><div className="text-2xl font-bold">{stats.tasa}%</div></div></div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Referidos</h2>
        {loading ? <p className="text-muted-foreground">Cargando…</p> : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no hay referidos registrados.</p>
        ) : (
          <div className="space-y-2">
            {data.map(r => (
              <div key={r.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.nombre_prospecto || "Prospecto sin nombre"}</div>
                  <div className="text-xs text-muted-foreground">Referido por {r.referidor_tipo} · {r.contacto_prospecto || "sin contacto"} · {r.fecha_referido}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.estado === "convertido" ? "default" : r.estado === "descartado" ? "destructive" : "outline"}>{r.estado}</Badge>
                  {r.estado === "pendiente" && <Button size="sm" variant="outline" onClick={() => cambiarEstado(r.id, "contactado")}>Contactar</Button>}
                  {r.estado === "contactado" && <Button size="sm" onClick={() => cambiarEstado(r.id, "convertido")}>Convertir</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
