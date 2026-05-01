import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Activity, Bell, Plus, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props { verticalTipo: string; }

export default function VerticalIoTTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: dispositivos = [] } = useQuery({
    queryKey: ["dispositivos_iot", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("dispositivos_iot")
        .select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: lecturas = [] } = useQuery({
    queryKey: ["lecturas_iot_recientes", wsId],
    enabled: !!wsId && dispositivos.length > 0,
    queryFn: async () => {
      const ids = dispositivos.map((d: any) => d.id);
      const { data } = await supabase
        .from("lecturas_iot")
        .select("*, dispositivos_iot(tipo, pacientes(nombre, apellido))")
        .in("dispositivo_id", ids)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const conexionIcon = (estado: string) => {
    if (estado === "conectado") return <Wifi className="h-4 w-4 text-green-600" />;
    return <WifiOff className="h-4 w-4 text-muted-foreground" />;
  };

  const tipoLabel: Record<string, string> = {
    oximetro: "Oxímetro",
    tensiometro: "Tensiómetro",
    glucometro: "Glucómetro",
    bascula: "Báscula",
    termometro: "Termómetro",
    ecg: "ECG",
    wearable: "Wearable",
    otro: "Otro",
  };

  return (
    <Tabs defaultValue="dispositivos" className="space-y-4">
      <TabsList>
        <TabsTrigger value="dispositivos"><Cpu className="h-4 w-4 mr-1" /> Dispositivos</TabsTrigger>
        <TabsTrigger value="lecturas"><Activity className="h-4 w-4 mr-1" /> Lecturas</TabsTrigger>
        <TabsTrigger value="umbrales"><Bell className="h-4 w-4 mr-1" /> Umbrales</TabsTrigger>
      </TabsList>

      <TabsContent value="dispositivos" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar Dispositivo</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {dispositivos.map((d: any) => (
            <Card key={d.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tipoLabel[d.tipo] || d.tipo}</CardTitle>
                  {conexionIcon(d.estado_conexion)}
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Modelo:</span> {d.modelo || "—"}</p>
                <p><span className="text-muted-foreground">Serial:</span> {d.serial_number || "—"}</p>
                <p><span className="text-muted-foreground">Paciente:</span> {d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "Sin asignar"}</p>
                {d.bateria_pct != null && <p><span className="text-muted-foreground">Batería:</span> {d.bateria_pct}%</p>}
                <Badge className={d.estado_conexion === "conectado" ? "bg-green-100 text-green-800" : "bg-muted"}>{d.estado_conexion}</Badge>
              </CardContent>
            </Card>
          ))}
          {dispositivos.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">No hay dispositivos registrados</p>}
        </div>
      </TabsContent>

      <TabsContent value="lecturas" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Medición</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecturas.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>{tipoLabel[l.dispositivos_iot?.tipo] || "—"}</TableCell>
                <TableCell>{l.tipo_medicion}</TableCell>
                <TableCell className="font-mono">{l.valor}</TableCell>
                <TableCell>{l.unidad}</TableCell>
                <TableCell>{format(new Date(l.created_at), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
              </TableRow>
            ))}
            {lecturas.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin lecturas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="umbrales">
        <Card><CardContent className="py-8 text-center text-muted-foreground">Configuración de umbrales de alerta por dispositivo y paciente — alertas automáticas cuando los valores salen de rango</CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}
