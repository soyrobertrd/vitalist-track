import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ShieldAlert, BellRing } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const SEV_COLOR: Record<string, string> = {
  baja: "bg-blue-100 text-blue-700",
  media: "bg-amber-100 text-amber-700",
  alta: "bg-orange-100 text-orange-700",
  critica: "bg-red-100 text-red-700 animate-pulse",
};

export default function AlertasClinicas() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("activa");

  const cargar = async () => {
    const { data } = await supabase
      .from("alertas_clinicas")
      .select("*, pacientes(nombre, apellido)")
      .eq("estado", filtro)
      .order("severidad", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    setAlertas(data || []);
  };

  useEffect(() => { cargar(); }, [filtro]);

  const actualizar = async (id: string, estado: string) => {
    const updates: any = { estado };
    const now = new Date().toISOString();
    if (estado === "reconocida") { updates.reconocida_at = now; }
    if (estado === "atendida") { updates.atendida_at = now; }
    const { error } = await supabase.from("alertas_clinicas").update(updates).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    cargar();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-primary" /> Alertas Clínicas Inter-módulos
        </h1>
        <p className="text-muted-foreground">
          Sepsis, deterioro, valores pánico, alergias, vencimientos críticos y triage rojo.
        </p>
      </div>

      <Tabs value={filtro} onValueChange={setFiltro}>
        <TabsList>
          <TabsTrigger value="activa"><BellRing className="h-3 w-3 mr-1" /> Activas</TabsTrigger>
          <TabsTrigger value="reconocida">Reconocidas</TabsTrigger>
          <TabsTrigger value="atendida">Atendidas</TabsTrigger>
          <TabsTrigger value="descartada">Descartadas</TabsTrigger>
        </TabsList>

        <TabsContent value={filtro} className="space-y-2 mt-4">
          {alertas.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas en este estado.</p>}
          {alertas.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={SEV_COLOR[a.severidad]}>
                        <AlertTriangle className="h-3 w-3 mr-1" /> {a.severidad.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{a.tipo.replace("_", " ")}</Badge>
                      {a.modulo_origen && <Badge variant="secondary" className="text-xs">{a.modulo_origen}</Badge>}
                    </div>
                    <p className="font-semibold mt-2">{a.titulo}</p>
                    {a.descripcion && <p className="text-sm text-muted-foreground">{a.descripcion}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.pacientes && `${a.pacientes.nombre} ${a.pacientes.apellido} · `}
                      {format(new Date(a.created_at), "Pp")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {a.estado === "activa" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => actualizar(a.id, "reconocida")}>Reconocer</Button>
                        <Button size="sm" variant="ghost" onClick={() => actualizar(a.id, "descartada")}>Descartar</Button>
                      </>
                    )}
                    {a.estado === "reconocida" && (
                      <Button size="sm" onClick={() => actualizar(a.id, "atendida")}>Marcar atendida</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
