import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Baby, Heart, Stethoscope, Syringe } from "lucide-react";
import { format } from "date-fns";

export default function MaternidadNeonatologia() {
  const [prenatal, setPrenatal] = useState<any[]>([]);
  const [partogramas, setPartogramas] = useState<any[]>([]);
  const [partos, setPartos] = useState<any[]>([]);
  const [rn, setRn] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [pr, pg, pa, r, v] = await Promise.all([
        supabase.from("control_prenatal").select("*").order("fecha", { ascending: false }).limit(30),
        supabase.from("partogramas").select("*").eq("estado", "activo").order("fecha_inicio_trabajo", { ascending: false }),
        supabase.from("registros_parto").select("*").order("fecha_parto", { ascending: false }).limit(30),
        supabase.from("recien_nacidos").select("*").order("fecha_nacimiento", { ascending: false }).limit(30),
        supabase.from("vacunacion_neonatal").select("*").order("fecha", { ascending: false }).limit(20),
      ]);
      setPrenatal(pr.data || []);
      setPartogramas(pg.data || []);
      setPartos(pa.data || []);
      setRn(r.data || []);
      setVacunas(v.data || []);
    })();
  }, []);

  const apgarColor = (a: number) => a >= 7 ? "default" : a >= 4 ? "secondary" : "destructive";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Baby className="h-7 w-7 text-pink-600" /> Maternidad & Neonatología</h1>
        <p className="text-muted-foreground">Control prenatal, partograma, parto, recién nacidos, lactancia y vacunación neonatal.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Controles prenatales</p><p className="text-2xl font-bold">{prenatal.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Partogramas activos</p><p className="text-2xl font-bold text-pink-600">{partogramas.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Partos (reciente)</p><p className="text-2xl font-bold">{partos.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Recién nacidos</p><p className="text-2xl font-bold">{rn.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="prenatal">
        <TabsList>
          <TabsTrigger value="prenatal">Prenatal</TabsTrigger>
          <TabsTrigger value="partograma">Partogramas</TabsTrigger>
          <TabsTrigger value="partos">Partos</TabsTrigger>
          <TabsTrigger value="rn">Recién nacidos</TabsTrigger>
          <TabsTrigger value="vacunas">Vacunación</TabsTrigger>
        </TabsList>

        <TabsContent value="prenatal" className="space-y-2">
          {prenatal.length === 0 && <p className="text-sm text-muted-foreground">Sin controles prenatales.</p>}
          {prenatal.map((p) => (
            <Card key={p.id}><CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Consulta #{p.numero_consulta} · {p.edad_gestacional_semanas}sem</p>
                <p className="text-xs text-muted-foreground">{format(new Date(p.fecha + "T12:00:00"), "PP")} · TA {p.presion_arterial} · FCF {p.fcf_lpm} lpm</p>
              </div>
              <Badge variant="outline">{p.presentacion}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="partograma" className="space-y-2">
          {partogramas.length === 0 && <p className="text-sm text-muted-foreground">Sin partogramas activos.</p>}
          {partogramas.map((pg) => (
            <Card key={pg.id} className="border-pink-300"><CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" /> Trabajo de parto activo</p>
                <p className="text-xs text-muted-foreground">Inicio: {format(new Date(pg.fecha_inicio_trabajo), "PPp")}</p>
              </div>
              <Badge>{pg.estado}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="partos" className="space-y-2">
          {partos.map((p) => (
            <Card key={p.id}><CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold capitalize">{p.tipo_parto?.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(p.fecha_parto), "PPp")} · Sangrado: {p.sangrado_ml ?? "—"}ml</p>
              </div>
              {p.complicaciones && <Badge variant="destructive">Con complicaciones</Badge>}
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="rn" className="grid gap-3 md:grid-cols-2">
          {rn.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Sin recién nacidos.</p>}
          {rn.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold capitalize">{n.sexo} · {n.peso_g}g · {n.talla_cm}cm</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(n.fecha_nacimiento), "PPp")} · {n.edad_gestacional_semanas} sem</p>
                  </div>
                  <Badge variant={n.estado === "vivo" ? "default" : "destructive"}>{n.estado}</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={apgarColor(n.apgar_1min)}>APGAR 1' = {n.apgar_1min ?? "—"}</Badge>
                  <Badge variant={apgarColor(n.apgar_5min)}>5' = {n.apgar_5min ?? "—"}</Badge>
                  {n.apgar_10min && <Badge variant={apgarColor(n.apgar_10min)}>10' = {n.apgar_10min}</Badge>}
                </div>
                {n.destino && <p className="text-xs text-muted-foreground mt-2">Destino: {n.destino}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vacunas" className="space-y-2">
          {vacunas.length === 0 && <p className="text-sm text-muted-foreground">Sin vacunas registradas.</p>}
          {vacunas.map((v) => (
            <Card key={v.id}><CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-semibold uppercase">{v.vacuna.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(v.fecha), "PPp")} · Lote {v.lote || "—"}</p>
                </div>
              </div>
              <Badge variant="outline">{v.via || v.dosis}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
