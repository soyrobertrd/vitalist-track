import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ClipboardCheck, ListChecks, HeartPulse } from "lucide-react";
import { format } from "date-fns";

export default function QuirofanoAvanzado() {
  const [salas, setSalas] = useState<any[]>([]);
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [urpa, setUrpa] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, p, u] = await Promise.all([
        supabase.from("quirofanos").select("*").order("nombre"),
        supabase.from("programaciones_quirurgicas").select("*").order("fecha_programada", { ascending: false }).limit(50),
        supabase.from("recuperacion_post_anestesica").select("*").order("hora_ingreso_urpa", { ascending: false }).limit(20),
      ]);
      setSalas(s.data || []);
      setProgramaciones(p.data || []);
      setUrpa(u.data || []);
    })();
  }, []);

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      disponible: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
      ocupado: "bg-red-500/10 text-red-700 border-red-300",
      limpieza: "bg-amber-500/10 text-amber-700 border-amber-300",
      mantenimiento: "bg-slate-500/10 text-slate-700 border-slate-300",
      reservado: "bg-blue-500/10 text-blue-700 border-blue-300",
    };
    return map[estado] || "";
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Activity className="h-7 w-7 text-primary" /> Quirófano & Cirugía</h1>
        <p className="text-muted-foreground">Programación quirúrgica, checklist OMS, conteo de gasas y URPA.</p>
      </div>

      <Tabs defaultValue="salas">
        <TabsList>
          <TabsTrigger value="salas">Salas</TabsTrigger>
          <TabsTrigger value="programacion">Programación</TabsTrigger>
          <TabsTrigger value="checklist">Checklist OMS</TabsTrigger>
          <TabsTrigger value="urpa">Recuperación (URPA)</TabsTrigger>
        </TabsList>

        <TabsContent value="salas" className="grid gap-4 md:grid-cols-3">
          {salas.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Sin salas registradas. Crea quirófanos para empezar.</p>}
          {salas.map((s) => (
            <Card key={s.id}>
              <CardHeader><CardTitle className="text-lg flex justify-between items-center">{s.nombre}<Badge variant="outline" className={estadoBadge(s.estado)}>{s.estado}</Badge></CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground capitalize">{s.tipo}</p></CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="programacion" className="space-y-2">
          {programaciones.length === 0 && <p className="text-muted-foreground text-sm">Sin cirugías programadas.</p>}
          {programaciones.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{p.procedimiento}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.fecha_programada), "PPp")} · {p.duracion_estimada_min} min · {p.tipo_anestesia}</p>
                </div>
                <Badge>{p.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="checklist">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Checklist Quirúrgico OMS</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">3 fases: Entrada, Pausa quirúrgica, Salida. Selecciona una programación para verificar ítems.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="urpa" className="space-y-2">
          {urpa.length === 0 && <p className="text-muted-foreground text-sm">Sin pacientes en URPA.</p>}
          {urpa.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold flex items-center gap-2"><HeartPulse className="h-4 w-4 text-red-500" /> Aldrete: {u.aldrete_total ?? "—"}/10</p>
                  <p className="text-xs text-muted-foreground">Ingreso: {format(new Date(u.hora_ingreso_urpa), "Pp")} {u.hora_alta_urpa && `· Alta: ${format(new Date(u.hora_alta_urpa), "Pp")}`}</p>
                </div>
                <Badge variant={u.aldrete_total >= 9 ? "default" : "secondary"}>{u.destino || "en URPA"}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
