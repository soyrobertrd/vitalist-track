import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Calendar, Phone, MapPin } from "lucide-react";

export default function ReporteSospechosos() {
  const { data: pacientesSospechosos, isLoading } = useQuery({
    queryKey: ["pacientes-sospechosos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select(`
          *,
          profesional:personal_salud!profesional_asignado_id(nombre, apellido),
          llamadas:registro_llamadas(fecha_agendada, fecha_hora_realizada, estado, motivo),
          visitas:control_visitas(fecha_hora_visita, estado, motivo_visita)
        `)
        .eq("es_sospechoso", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["stats-sospechosos"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("es_sospechoso", true);

      const { count: conSeguimiento } = await supabase
        .from("pacientes")
        .select(`
          id,
          llamadas:registro_llamadas(id)
        `, { count: "exact", head: true })
        .eq("es_sospechoso", true);

      return { total, conSeguimiento };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes Sospechosos</h1>
          <p className="text-muted-foreground">
            Seguimiento de pacientes candidatos para ingreso al programa
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sospechosos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Seguimiento</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conSeguimiento || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.total || 0) - (stats?.conSeguimiento || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pacientes Sospechosos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Profesional Asignado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Llamadas</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientesSospechosos?.map((paciente: any) => (
                  <TableRow key={paciente.id}>
                    <TableCell className="font-medium">
                      {paciente.nombre} {paciente.apellido}
                    </TableCell>
                    <TableCell>{paciente.cedula}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {paciente.zona?.replace(/_/g, " ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {paciente.profesional ? (
                        `${paciente.profesional.nombre} ${paciente.profesional.apellido}`
                      ) : (
                        <span className="text-muted-foreground">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(paciente.created_at), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {paciente.llamadas?.length || 0} llamadas
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {paciente.visitas?.length || 0} visitas
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Sospechoso</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
