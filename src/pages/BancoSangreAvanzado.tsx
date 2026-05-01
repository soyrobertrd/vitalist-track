import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Droplet, Users, Package, TestTube } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const TIPOS = ["O+","O-","A+","A-","B+","B-","AB+","AB-"];

export default function BancoSangreAvanzado() {
  const [donantes, setDonantes] = useState<any[]>([]);
  const [donaciones, setDonaciones] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [transfusiones, setTransfusiones] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [d, dn, inv, tr] = await Promise.all([
        supabase.from("donantes").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("donaciones_sangre").select("*").order("fecha_donacion", { ascending: false }).limit(30),
        supabase.from("inventario_hemocomponentes").select("*").eq("estado", "disponible").order("fecha_vencimiento"),
        supabase.from("transfusiones").select("*").order("hora_inicio", { ascending: false }).limit(20),
      ]);
      setDonantes(d.data || []);
      setDonaciones(dn.data || []);
      setInventario(inv.data || []);
      setTransfusiones(tr.data || []);
    })();
  }, []);

  const stockPorTipo = (tipo: string) => inventario.filter((i) => i.tipo_sangre === tipo).length;
  const proximosVencer = inventario.filter((i) => differenceInDays(new Date(i.fecha_vencimiento), new Date()) <= 7);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Droplet className="h-7 w-7 text-red-600" /> Banco de Sangre</h1>
        <p className="text-muted-foreground">Donantes, hemocomponentes, pruebas cruzadas y transfusiones.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4"/> Donantes</p><p className="text-2xl font-bold">{donantes.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><Droplet className="h-4 w-4"/> Donaciones</p><p className="text-2xl font-bold">{donaciones.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground flex items-center gap-1"><Package className="h-4 w-4"/> Stock disponible</p><p className="text-2xl font-bold">{inventario.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Por vencer (7d)</p><p className="text-2xl font-bold text-amber-600">{proximosVencer.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock por tipo</TabsTrigger>
          <TabsTrigger value="donantes">Donantes</TabsTrigger>
          <TabsTrigger value="donaciones">Donaciones</TabsTrigger>
          <TabsTrigger value="transfusiones">Transfusiones</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="grid grid-cols-4 gap-3">
          {TIPOS.map((t) => (
            <Card key={t} className={stockPorTipo(t) === 0 ? "border-red-300" : ""}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{t}</p>
                <p className="text-3xl font-bold">{stockPorTipo(t)}</p>
                <p className="text-xs text-muted-foreground">unidades</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="donantes" className="space-y-2">
          {donantes.length === 0 && <p className="text-sm text-muted-foreground">Sin donantes registrados.</p>}
          {donantes.map((d) => (
            <Card key={d.id}><CardContent className="p-3 flex justify-between items-center">
              <div><p className="font-semibold">{d.nombre} {d.apellido}</p><p className="text-xs text-muted-foreground">{d.cedula} · {d.telefono}</p></div>
              <Badge variant="outline" className="text-red-600 border-red-300">{d.tipo_sangre || "—"}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="donaciones" className="space-y-2">
          {donaciones.map((d) => (
            <Card key={d.id}><CardContent className="p-3 flex justify-between items-center">
              <div><p className="font-semibold">{d.tipo_donacion} · {d.volumen_ml}ml</p><p className="text-xs text-muted-foreground">{format(new Date(d.fecha_donacion), "PPp")}</p></div>
              <Badge variant={d.apta_uso ? "default" : "destructive"}>{d.apta_uso ? "Apta" : "Descartada"}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="transfusiones" className="space-y-2">
          {transfusiones.map((t) => (
            <Card key={t.id} className={t.reaccion_adversa ? "border-amber-400" : ""}>
              <CardContent className="p-3 flex justify-between items-center">
                <div><p className="font-semibold flex items-center gap-2"><TestTube className="h-4 w-4"/> Transfusión</p><p className="text-xs text-muted-foreground">{format(new Date(t.hora_inicio), "PPp")}</p></div>
                {t.reaccion_adversa && <Badge variant="destructive">Reacción adversa</Badge>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
