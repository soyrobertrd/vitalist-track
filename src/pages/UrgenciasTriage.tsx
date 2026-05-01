import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const NIVEL_COLOR: Record<string, string> = {
  rojo: "bg-red-600 text-white",
  naranja: "bg-orange-500 text-white",
  amarillo: "bg-yellow-400 text-black",
  verde: "bg-green-500 text-white",
  azul: "bg-blue-500 text-white",
};

const NIVEL_TIEMPO: Record<string, string> = {
  rojo: "Inmediato",
  naranja: "10 min",
  amarillo: "60 min",
  verde: "120 min",
  azul: "240 min",
};

export default function UrgenciasTriage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [triages, setTriages] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const { data: regs } = await supabase
        .from("registros_urgencias")
        .select("*")
        .in("estado", ["en_triage", "en_atencion", "observacion"])
        .order("hora_llegada", { ascending: false })
        .limit(50);
      setRegistros(regs || []);

      if (regs?.length) {
        const ids = regs.map((r: any) => r.id);
        const { data: tri } = await supabase
          .from("triage_manchester")
          .select("*")
          .in("registro_urgencia_id", ids);
        const map: Record<string, any> = {};
        (tri || []).forEach((t: any) => {
          if (!map[t.registro_urgencia_id]) map[t.registro_urgencia_id] = t;
        });
        setTriages(map);
      }
    })();
  }, []);

  const porNivel = (nivel: string) =>
    registros.filter((r) => triages[r.id]?.nivel === nivel);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="h-7 w-7 text-red-500" /> Urgencias & Triage Manchester
        </h1>
        <p className="text-muted-foreground">Gestión de sala de emergencias con tiempos objetivo por nivel.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["rojo", "naranja", "amarillo", "verde", "azul"] as const).map((n) => (
          <Card key={n}>
            <CardContent className="p-4 text-center">
              <Badge className={`${NIVEL_COLOR[n]} mb-2 capitalize`}>{n}</Badge>
              <p className="text-3xl font-bold">{porNivel(n).length}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> {NIVEL_TIEMPO[n]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos ({registros.length})</TabsTrigger>
          <TabsTrigger value="critico">Críticos</TabsTrigger>
        </TabsList>
        <TabsContent value="todos" className="space-y-2">
          {registros.length === 0 && <p className="text-sm text-muted-foreground">Sin pacientes activos en urgencias.</p>}
          {registros.map((r) => {
            const tri = triages[r.id];
            return (
              <Card key={r.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {tri && <Badge className={`${NIVEL_COLOR[tri.nivel]} capitalize`}>{tri.nivel}</Badge>}
                    <div>
                      <p className="font-semibold">{r.motivo_consulta}</p>
                      <p className="text-xs text-muted-foreground">
                        Llegada: {format(new Date(r.hora_llegada), "Pp")} · {r.modo_llegada}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{r.estado}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        <TabsContent value="critico" className="space-y-2">
          {[...porNivel("rojo"), ...porNivel("naranja")].map((r) => (
            <Card key={r.id} className="border-red-300">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{r.motivo_consulta}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.hora_llegada), "Pp")}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-red-500" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
