import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, AlertTriangle, ShieldX, Search } from "lucide-react";

const sevColor: Record<string, string> = {
  leve: "bg-yellow-500/10 text-yellow-700",
  moderada: "bg-orange-500/10 text-orange-700",
  severa: "bg-red-500/10 text-red-700",
  contraindicada: "bg-destructive/20 text-destructive",
};

export default function VademecumInteracciones() {
  const [meds, setMeds] = useState<any[]>([]);
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: b }] = await Promise.all([
        (supabase as any).from("catalogo_medicamentos").select("*").eq("activo", true).order("nombre_comercial").limit(500),
        (supabase as any).from("interacciones_farmacologicas").select("*").order("severidad", { ascending: false }),
      ]);
      setMeds(a || []);
      setInteracciones(b || []);
    })();
  }, []);

  const toggleMed = (pa: string) => {
    setSeleccionados(prev => prev.includes(pa) ? prev.filter(x => x !== pa) : [...prev, pa]);
  };

  const interaccionesDetectadas = useMemo(() => {
    if (seleccionados.length < 2) return [];
    return interacciones.filter(i =>
      seleccionados.includes(i.principio_activo_a) && seleccionados.includes(i.principio_activo_b)
    );
  }, [seleccionados, interacciones]);

  const medsFilt = meds.filter(m => !q || m.nombre_comercial.toLowerCase().includes(q.toLowerCase()) || m.principio_activo.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Pill className="h-7 w-7 text-primary" /> Vademécum e Interacciones
        </h1>
        <p className="text-sm text-muted-foreground">Catálogo de medicamentos y verificación de interacciones farmacológicas</p>
      </div>

      <Tabs defaultValue="checker">
        <TabsList>
          <TabsTrigger value="checker">Verificador de Interacciones</TabsTrigger>
          <TabsTrigger value="meds">Medicamentos ({meds.length})</TabsTrigger>
          <TabsTrigger value="todas">Matriz completa ({interacciones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checker" className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2"><Search className="h-4 w-4" />Selecciona principios activos para verificar</div>
            <div className="flex gap-2 flex-wrap">
              {Array.from(new Set(meds.map(m => m.principio_activo))).map(pa => (
                <Badge
                  key={pa}
                  variant={seleccionados.includes(pa) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleMed(pa)}
                >{pa}</Badge>
              ))}
            </div>
          </Card>

          {seleccionados.length > 0 && (
            <Card className="p-4 space-y-2">
              <div className="font-medium text-sm">Seleccionados: {seleccionados.length}</div>
              <Button size="sm" variant="ghost" onClick={() => setSeleccionados([])}>Limpiar</Button>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              {interaccionesDetectadas.length > 0 ? <AlertTriangle className="h-5 w-5 text-orange-600" /> : <ShieldX className="h-5 w-5 text-emerald-600" />}
              {interaccionesDetectadas.length > 0 ? `${interaccionesDetectadas.length} interacción(es) detectada(s)` : seleccionados.length >= 2 ? "Sin interacciones conocidas" : "Selecciona al menos 2 principios activos"}
            </h3>
            {interaccionesDetectadas.map(i => (
              <Card key={i.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{i.principio_activo_a} ↔ {i.principio_activo_b}</div>
                  <Badge className={sevColor[i.severidad]}>{i.severidad.toUpperCase()}</Badge>
                </div>
                {i.mecanismo && <div className="text-sm"><span className="font-medium">Mecanismo:</span> {i.mecanismo}</div>}
                {i.efecto_clinico && <div className="text-sm"><span className="font-medium">Efecto:</span> {i.efecto_clinico}</div>}
                {i.recomendacion && <div className="text-sm bg-muted p-2 rounded"><span className="font-medium">Recomendación:</span> {i.recomendacion}</div>}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meds" className="space-y-3">
          <Input placeholder="Buscar medicamento..." value={q} onChange={e => setQ(e.target.value)} className="max-w-md" />
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Principio activo</TableHead><TableHead>Concentración</TableHead><TableHead>Vía</TableHead><TableHead>Grupo</TableHead></TableRow></TableHeader>
              <TableBody>
                {medsFilt.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nombre_comercial}</TableCell>
                    <TableCell>{m.principio_activo}</TableCell>
                    <TableCell className="text-sm">{m.concentracion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.via_administracion}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.grupo_terapeutico}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="todas">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Med A</TableHead><TableHead>Med B</TableHead><TableHead>Severidad</TableHead><TableHead>Recomendación</TableHead></TableRow></TableHeader>
              <TableBody>
                {interacciones.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.principio_activo_a}</TableCell>
                    <TableCell className="font-medium">{i.principio_activo_b}</TableCell>
                    <TableCell><Badge className={sevColor[i.severidad]}>{i.severidad}</Badge></TableCell>
                    <TableCell className="text-sm">{i.recomendacion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
