import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Gift, Star, Users } from "lucide-react";
import { toast } from "sonner";

export default function BeneficiosUsuarios() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("beneficios_usuarios" as any).select("*").order("fecha_otorgado", { ascending: false });
      if (error) toast.error(error.message);
      setData((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const totalPuntos = data.filter(d => d.estado === "activo").reduce((s, d) => s + Number(d.puntos || 0), 0);
  const totalDesc = data.filter(d => d.estado === "activo").reduce((s, d) => s + Number(d.monto_descuento || 0), 0);
  const niveles = ["bronce", "plata", "oro", "platino"];
  const conteoNiveles = niveles.map(n => ({ nivel: n, count: data.filter(d => d.nivel === n).length }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Gift className="h-7 w-7 text-primary" /> Beneficios de usuarios</h1>
        <p className="text-muted-foreground">Programa de loyalty: puntos, descuentos y niveles VIP para pacientes individuales.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><Star className="h-8 w-8 text-amber-500" /><div><div className="text-sm text-muted-foreground">Puntos activos</div><div className="text-2xl font-bold">{totalPuntos}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Gift className="h-8 w-8 text-primary" /><div><div className="text-sm text-muted-foreground">Descuentos vigentes</div><div className="text-2xl font-bold">${totalDesc.toFixed(2)}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Award className="h-8 w-8 text-purple-500" /><div><div className="text-sm text-muted-foreground">Beneficios totales</div><div className="text-2xl font-bold">{data.length}</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-blue-500" /><div><div className="text-sm text-muted-foreground">Pacientes con loyalty</div><div className="text-2xl font-bold">{new Set(data.map(d => d.paciente_id)).size}</div></div></div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Distribución por nivel</h2>
        <div className="grid grid-cols-4 gap-3">
          {conteoNiveles.map(n => (
            <div key={n.nivel} className="border rounded-lg p-3 text-center">
              <div className="text-xs uppercase text-muted-foreground">{n.nivel}</div>
              <div className="text-2xl font-bold">{n.count}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Beneficios recientes</h2>
        {loading ? <p className="text-muted-foreground">Cargando…</p> : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no hay beneficios otorgados. Usa este sistema para premiar fidelidad, referidos o compras grandes.</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 20).map((b) => (
              <div key={b.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.concepto}</div>
                  <div className="text-xs text-muted-foreground">{b.tipo} · {b.fecha_otorgado} {b.puntos ? `· ${b.puntos} pts` : ""} {b.monto_descuento ? `· $${b.monto_descuento}` : ""}</div>
                </div>
                <Badge variant={b.estado === "activo" ? "default" : "outline"}>{b.estado}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
