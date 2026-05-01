import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pill, Activity, AlertTriangle, Armchair } from "lucide-react";
import { format } from "date-fns";

export default function Oncologia() {
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [sillones, setSillones] = useState<any[]>([]);
  const [toxicidades, setToxicidades] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [p, c, s, t] = await Promise.all([
        supabase.from("protocolos_quimio").select("*").eq("activo", true).order("nombre"),
        supabase.from("ciclos_quimio").select("*").order("fecha_programada", { ascending: false }).limit(50),
        supabase.from("sillones_infusion").select("*").eq("activo", true).order("numero"),
        supabase.from("toxicidades_oncologicas").select("*").order("fecha_evaluacion", { ascending: false }).limit(20),
      ]);
      setProtocolos(p.data || []);
      setCiclos(c.data || []);
      setSillones(s.data || []);
      setToxicidades(t.data || []);
    })();
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Pill className="h-7 w-7 text-purple-600" /> Oncología & Quimioterapia</h1>
        <p className="text-muted-foreground">Protocolos, ciclos por paciente, sillones de infusión y toxicidades CTCAE.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Protocolos activos</p><p className="text-2xl font-bold">{protocolos.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ciclos en curso</p><p className="text-2xl font-bold">{ciclos.filter(c=>c.estado==="en_curso").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Sillones libres</p><p className="text-2xl font-bold text-emerald-600">{sillones.filter(s=>s.estado==="libre").length}/{sillones.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Toxicidades grado ≥3</p><p className="text-2xl font-bold text-red-600">{toxicidades.filter(t=>t.grado_ctcae>=3).length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="ciclos">
        <TabsList>
          <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
          <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
          <TabsTrigger value="sillones">Sillones</TabsTrigger>
          <TabsTrigger value="toxicidades">Toxicidades</TabsTrigger>
        </TabsList>

        <TabsContent value="ciclos" className="space-y-2">
          {ciclos.length === 0 && <p className="text-sm text-muted-foreground">Sin ciclos registrados.</p>}
          {ciclos.map((c) => (
            <Card key={c.id}><CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">Ciclo #{c.numero_ciclo} · BSA {c.bsa_m2 ?? "—"} m²</p>
                <p className="text-xs text-muted-foreground">{format(new Date(c.fecha_programada + "T12:00:00"), "PP")}</p>
              </div>
              <Badge variant={c.estado === "completado" ? "default" : c.estado === "en_curso" ? "secondary" : "outline"}>{c.estado}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="protocolos" className="grid gap-3 md:grid-cols-2">
          {protocolos.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Sin protocolos. Registra esquemas (FOLFOX, AC-T, etc).</p>}
          {protocolos.map((p) => (
            <Card key={p.id}>
              <CardHeader><CardTitle className="text-base">{p.nombre}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.tipo_cancer} · {p.intencion}</p>
                <p className="text-xs mt-1">{p.duracion_ciclos} ciclos cada {p.intervalo_dias} días</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sillones" className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {sillones.map((s) => (
            <Card key={s.id} className={s.estado === "libre" ? "border-emerald-300" : "border-red-300"}>
              <CardContent className="p-4 text-center">
                <Armchair className="h-6 w-6 mx-auto mb-1" />
                <p className="font-bold">{s.numero}</p>
                <Badge variant={s.estado === "libre" ? "default" : "secondary"} className="mt-1 text-xs">{s.estado}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="toxicidades" className="space-y-2">
          {toxicidades.length === 0 && <p className="text-sm text-muted-foreground">Sin toxicidades registradas.</p>}
          {toxicidades.map((t) => (
            <Card key={t.id} className={t.grado_ctcae >= 3 ? "border-red-300" : ""}>
              <CardContent className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {t.grado_ctcae >= 3 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <div>
                    <p className="font-semibold text-sm">{t.tipo_toxicidad}</p>
                    <p className="text-xs text-muted-foreground">{t.manejo}</p>
                  </div>
                </div>
                <Badge variant={t.grado_ctcae >= 3 ? "destructive" : "secondary"}>Grado {t.grado_ctcae}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
