import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { toast } from "sonner";

export default function SegmentacionPacientes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("segmentos_pacientes" as any).select("*").order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setData((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="h-7 w-7 text-primary" /> Segmentación de pacientes</h1>
        <p className="text-muted-foreground">Crea segmentos para campañas de marketing, recordatorios y promociones.</p>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Segmentos definidos</h2>
        {loading ? <p className="text-muted-foreground">Cargando…</p> : data.length === 0 ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Aún no hay segmentos. Ejemplos típicos:</p>
            <ul className="list-disc ml-6">
              <li>Pacientes VIP (LTV {">"} $50,000)</li>
              <li>Inactivos (sin visita en 6 meses)</li>
              <li>Cumpleañeros del mes</li>
              <li>Adultos mayores con condiciones crónicas</li>
              <li>Madres recientes (post-parto)</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map(s => (
              <div key={s.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.nombre}</div>
                  <Badge variant={s.activo ? "default" : "outline"}>{s.activo ? "Activo" : "Pausado"}</Badge>
                </div>
                {s.descripcion && <div className="text-sm text-muted-foreground mt-1">{s.descripcion}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
