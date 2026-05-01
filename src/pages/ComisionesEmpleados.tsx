import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ComisionesEmpleados() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comisiones_empleados" as any)
      .select("*")
      .order("fecha_generada", { ascending: false });
    if (error) toast.error(error.message);
    setData((data as any[]) || []);
    setLoading(false);
  };

  const aprobar = async (id: string) => {
    const { error } = await supabase.from("comisiones_empleados" as any).update({ estado: "aprobada" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Comisión aprobada");
    load();
  };
  const pagar = async (id: string) => {
    const { error } = await supabase.from("comisiones_empleados" as any).update({ estado: "pagada", fecha_pago: new Date().toISOString().slice(0,10) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Comisión pagada");
    load();
  };

  const pend = data.filter(d => d.estado === "pendiente").reduce((s, d) => s + Number(d.monto_comision || 0), 0);
  const apr = data.filter(d => d.estado === "aprobada").reduce((s, d) => s + Number(d.monto_comision || 0), 0);
  const pag = data.filter(d => d.estado === "pagada").reduce((s, d) => s + Number(d.monto_comision || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><DollarSign className="h-7 w-7 text-primary" /> Comisiones de empleados</h1>
        <p className="text-muted-foreground">Comisiones por referidos, ventas, metas y cierres.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-amber-500" /><div><div className="text-sm text-muted-foreground">Pendientes</div><div className="text-2xl font-bold">${pend.toFixed(2)}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-500" /><div><div className="text-sm text-muted-foreground">Aprobadas</div><div className="text-2xl font-bold">${apr.toFixed(2)}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><div className="text-sm text-muted-foreground">Pagadas</div><div className="text-2xl font-bold">${pag.toFixed(2)}</div></div></div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Comisiones registradas</h2>
        {loading ? <p className="text-muted-foreground">Cargando…</p> : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no hay comisiones registradas. Las comisiones se generan automáticamente cuando un empleado refiere o cierra una venta.</p>
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.concepto}</div>
                  <div className="text-xs text-muted-foreground">{c.origen} · {c.fecha_generada} · ${Number(c.monto_comision).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.estado === "pagada" ? "default" : c.estado === "aprobada" ? "secondary" : "outline"}>{c.estado}</Badge>
                  {c.estado === "pendiente" && <Button size="sm" variant="outline" onClick={() => aprobar(c.id)}>Aprobar</Button>}
                  {c.estado === "aprobada" && <Button size="sm" onClick={() => pagar(c.id)}>Pagar</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
