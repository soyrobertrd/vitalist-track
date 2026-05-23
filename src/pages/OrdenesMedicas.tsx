import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Zap } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useProfessionalVertical } from "@/hooks/useProfessionalVertical";

const PRIORIDAD_COLOR: Record<string, string> = {
  rutina: "bg-slate-100 text-slate-700",
  urgente: "bg-amber-100 text-amber-700",
  stat: "bg-red-100 text-red-700 animate-pulse",
};

export default function OrdenesMedicas() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<string>("pendiente");
  const { canActHere, verticalProfesional } = useProfessionalVertical();

  const cargar = async () => {
    const { data } = await supabase
      .from("ordenes_medicas")
      .select("*, pacientes(nombre, apellido)")
      .eq("estado", filtro)
      .order("prioridad", { ascending: false })
      .order("fecha_solicitud", { ascending: false })
      .limit(100);
    setOrdenes(data || []);
  };

  useEffect(() => { cargar(); }, [filtro]);

  const cambiarEstado = async (id: string, nuevo: string) => {
    const updates: any = { estado: nuevo };
    if (nuevo === "completada") updates.fecha_completada = new Date().toISOString();
    const { error } = await supabase.from("ordenes_medicas").update(updates).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Orden actualizada" });
    cargar();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" /> Órdenes Médicas (CPOE)
        </h1>
        <p className="text-muted-foreground">
          Motor centralizado de órdenes que fluye a Lab, Imagen, Farmacia, Banco de Sangre, Nutrición y Enfermería.
        </p>
        {!canActHere && verticalProfesional && (
          <p className="text-xs text-amber-600 mt-1">Modo solo lectura: tu vertical asignada es <b>{verticalProfesional}</b>.</p>
        )}
      </div>


      <Tabs value={filtro} onValueChange={setFiltro}>
        <TabsList>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="aceptada">Aceptadas</TabsTrigger>
          <TabsTrigger value="en_proceso">En proceso</TabsTrigger>
          <TabsTrigger value="completada">Completadas</TabsTrigger>
          <TabsTrigger value="cancelada">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value={filtro} className="space-y-2 mt-4">
          {ordenes.length === 0 && <p className="text-sm text-muted-foreground">Sin órdenes en este estado.</p>}
          {ordenes.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={PRIORIDAD_COLOR[o.prioridad]}>
                      {o.prioridad === "stat" && <Zap className="h-3 w-3 mr-1" />}
                      {o.prioridad.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{o.tipo}</Badge>
                    <span className="font-semibold text-sm">
                      {o.pacientes?.nombre} {o.pacientes?.apellido}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{o.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(o.fecha_solicitud), "Pp")}
                    {o.modulo_destino && ` · → ${o.modulo_destino}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {o.estado === "pendiente" && (
                    <Button size="sm" variant="outline" disabled={!canActHere} onClick={() => cambiarEstado(o.id, "aceptada")}>Aceptar</Button>
                  )}
                  {o.estado === "aceptada" && (
                    <Button size="sm" variant="outline" disabled={!canActHere} onClick={() => cambiarEstado(o.id, "en_proceso")}>Iniciar</Button>
                  )}
                  {o.estado === "en_proceso" && (
                    <Button size="sm" disabled={!canActHere} onClick={() => cambiarEstado(o.id, "completada")}>Completar</Button>
                  )}
                  {["pendiente","aceptada"].includes(o.estado) && (
                    <Button size="sm" variant="ghost" disabled={!canActHere} onClick={() => cambiarEstado(o.id, "cancelada")}>Cancelar</Button>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
