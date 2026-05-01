import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Move, ListOrdered, Activity } from "lucide-react";
import { format } from "date-fns";

const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
  ocupada: "bg-red-500/10 text-red-700 border-red-300",
  limpieza: "bg-amber-500/10 text-amber-700 border-amber-300",
  mantenimiento: "bg-slate-500/10 text-slate-700 border-slate-300",
  reservada: "bg-blue-500/10 text-blue-700 border-blue-300",
  bloqueada: "bg-zinc-500/10 text-zinc-700 border-zinc-300",
};

export default function CensoCamas() {
  const [camas, setCamas] = useState<any[]>([]);
  const [traslados, setTraslados] = useState<any[]>([]);
  const [espera, setEspera] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, t, e] = await Promise.all([
        supabase.from("mapa_camas").select("*").eq("activo", true).order("piso").order("sala").order("numero_cama"),
        supabase.from("traslados_internos").select("*").order("fecha_traslado", { ascending: false }).limit(20),
        supabase.from("lista_espera_admision").select("*").eq("estado", "esperando").order("fecha_solicitud"),
      ]);
      setCamas(c.data || []);
      setTraslados(t.data || []);
      setEspera(e.data || []);
    })();
  }, []);

  const total = camas.length;
  const ocupadas = camas.filter((x) => x.estado === "ocupada").length;
  const ocupacion = total > 0 ? ((ocupadas / total) * 100).toFixed(1) : "0";

  // Agrupar por piso/sala
  const grupos: Record<string, any[]> = {};
  camas.forEach((c) => {
    const k = `${c.piso} · ${c.sala}`;
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(c);
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BedDouble className="h-7 w-7 text-primary" /> Censo & Mapa de Camas</h1>
        <p className="text-muted-foreground">Ocupación en tiempo real, traslados internos y lista de espera.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total camas</p><p className="text-3xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ocupadas</p><p className="text-3xl font-bold text-red-600">{ocupadas}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Disponibles</p><p className="text-3xl font-bold text-emerald-600">{camas.filter(c=>c.estado==="disponible").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">% Ocupación</p><p className="text-3xl font-bold">{ocupacion}%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="mapa">
        <TabsList>
          <TabsTrigger value="mapa">Mapa de camas</TabsTrigger>
          <TabsTrigger value="traslados">Traslados</TabsTrigger>
          <TabsTrigger value="espera">Lista de espera ({espera.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-4">
          {Object.keys(grupos).length === 0 && <p className="text-sm text-muted-foreground">Sin camas registradas.</p>}
          {Object.entries(grupos).map(([key, list]) => (
            <Card key={key}>
              <CardHeader><CardTitle className="text-lg">{key}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {list.map((c) => (
                  <div key={c.id} className={`p-3 rounded border text-center ${ESTADO_COLOR[c.estado]}`}>
                    <p className="font-bold">{c.numero_cama}</p>
                    <p className="text-xs capitalize">{c.tipo}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="traslados" className="space-y-2">
          {traslados.length === 0 && <p className="text-sm text-muted-foreground">Sin traslados recientes.</p>}
          {traslados.map((t) => (
            <Card key={t.id}><CardContent className="p-3 flex items-center gap-3">
              <Move className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t.motivo}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(t.fecha_traslado), "PPp")}</p>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="espera" className="space-y-2">
          {espera.length === 0 && <p className="text-sm text-muted-foreground">Sin pacientes en espera.</p>}
          {espera.map((e) => (
            <Card key={e.id}><CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{e.servicio_solicitado}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(e.fecha_solicitud), "PPp")} · {e.motivo}</p>
              </div>
              <Badge variant={e.prioridad === "emergencia" ? "destructive" : e.prioridad === "alta" ? "default" : "secondary"}>{e.prioridad}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
