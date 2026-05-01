import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Video, FileText, Monitor, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props { verticalTipo: string; }

export default function VerticalTelemedicinaAvanzadaTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: sesiones = [] } = useQuery({
    queryKey: ["telemedicina_sesiones", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("telemedicina_sesiones")
        .select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: recetas = [] } = useQuery({
    queryKey: ["telemedicina_recetas_digitales", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("telemedicina_recetas_digitales")
        .select("*, pacientes(nombre, apellido), personal_salud(nombre, apellido)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const estadoColor: Record<string, string> = {
    programada: "bg-blue-100 text-blue-800",
    en_curso: "bg-yellow-100 text-yellow-800",
    finalizada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
  };

  return (
    <Tabs defaultValue="sesiones" className="space-y-4">
      <TabsList>
        <TabsTrigger value="sesiones"><Video className="h-4 w-4 mr-1" /> Sesiones</TabsTrigger>
        <TabsTrigger value="recetas"><FileText className="h-4 w-4 mr-1" /> Recetas Digitales</TabsTrigger>
      </TabsList>

      <TabsContent value="sesiones" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva Sesión</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Pantalla</TableHead>
              <TableHead>Grabación</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sesiones.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>{s.pacientes ? `${s.pacientes.nombre} ${s.pacientes.apellido}` : "—"}</TableCell>
                <TableCell>{s.personal_salud ? `${s.personal_salud.nombre} ${s.personal_salud.apellido}` : "—"}</TableCell>
                <TableCell>{s.fecha_inicio ? format(new Date(s.fecha_inicio), "dd/MM/yy HH:mm", { locale: es }) : "—"}</TableCell>
                <TableCell>{s.duracion_minutos ? `${s.duracion_minutos} min` : "—"}</TableCell>
                <TableCell>{s.compartir_pantalla ? <Monitor className="h-4 w-4 text-primary" /> : "—"}</TableCell>
                <TableCell>{s.grabacion_url ? <Badge variant="outline">Disponible</Badge> : "—"}</TableCell>
                <TableCell><Badge className={estadoColor[s.estado] || ""}>{s.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {sesiones.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin sesiones</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="recetas" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Medicamentos</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>QR</TableHead>
              <TableHead>Válida hasta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recetas.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.pacientes ? `${r.pacientes.nombre} ${r.pacientes.apellido}` : "—"}</TableCell>
                <TableCell>{r.personal_salud ? `${r.personal_salud.nombre} ${r.personal_salud.apellido}` : "—"}</TableCell>
                <TableCell>{Array.isArray(r.medicamentos) ? r.medicamentos.length : 0} items</TableCell>
                <TableCell>{r.firma_digital ? <Badge className="bg-green-100 text-green-800">Firmada</Badge> : <Badge variant="outline">Pendiente</Badge>}</TableCell>
                <TableCell>{r.qr_verificacion ? "✓" : "—"}</TableCell>
                <TableCell>{r.valida_hasta || "—"}</TableCell>
              </TableRow>
            ))}
            {recetas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin recetas digitales</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
