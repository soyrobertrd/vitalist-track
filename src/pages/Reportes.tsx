import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";

const Reportes = () => {
  const [tipoReporte, setTipoReporte] = useState("profesionales");
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [dataProfesionales, setDataProfesionales] = useState<any[]>([]);
  const [dataLlamadas, setDataLlamadas] = useState<any[]>([]);
  const [dataVisitas, setDataVisitas] = useState<any[]>([]);
  const [dataPacientes, setDataPacientes] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateReportData();
  }, [tipoReporte, profesionales]);

  const fetchData = async () => {
    const [profRes, llamadasRes, visitasRes, pacientesRes] = await Promise.all([
      supabase.from("personal_salud").select("*").eq("activo", true),
      supabase.from("registro_llamadas").select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido)"),
      supabase.from("control_visitas").select("*, personal_salud(nombre, apellido), pacientes(nombre, apellido)"),
      supabase.from("pacientes").select("*"),
    ]);

    if (profRes.data) setProfesionales(profRes.data);
    if (llamadasRes.data) setDataLlamadas(llamadasRes.data);
    if (visitasRes.data) setDataVisitas(visitasRes.data);
    if (pacientesRes.data) {
      const activos = pacientesRes.data.filter(p => p.status_px === 'activo').length;
      const inactivos = pacientesRes.data.filter(p => p.status_px === 'inactivo').length;
      const zonas = pacientesRes.data.reduce((acc: any, p: any) => {
        acc[p.zona || 'Sin zona'] = (acc[p.zona || 'Sin zona'] || 0) + 1;
        return acc;
      }, {});
      setDataPacientes({ total: pacientesRes.data.length, activos, inactivos, zonas });
    }
  };

  const generateReportData = () => {
    if (tipoReporte === "profesionales") {
      const data = profesionales.map(prof => ({
        nombre: `${prof.nombre} ${prof.apellido}`,
        llamadas: dataLlamadas.filter(l => l.profesional_id === prof.id).length,
        visitas: dataVisitas.filter(v => v.profesional_id === prof.id).length,
      }));
      setDataProfesionales(data);
    }
  };

  const exportToExcel = () => {
    let data: any[] = [];
    let sheetName = "";

    if (tipoReporte === "profesionales") {
      data = dataProfesionales;
      sheetName = "Reporte Profesionales";
    } else if (tipoReporte === "llamadas") {
      data = dataLlamadas.map(l => ({
        Paciente: l.pacientes ? `${l.pacientes.nombre} ${l.pacientes.apellido}` : 'N/A',
        Profesional: l.personal_salud ? `${l.personal_salud.nombre} ${l.personal_salud.apellido}` : 'N/A',
        Estado: l.estado,
        Resultado: l.resultado_seguimiento || 'N/A',
        Fecha: l.fecha_agendada || l.fecha_hora_realizada,
      }));
      sheetName = "Reporte Llamadas";
    } else if (tipoReporte === "visitas") {
      data = dataVisitas.map(v => ({
        Paciente: v.pacientes ? `${v.pacientes.nombre} ${v.pacientes.apellido}` : 'N/A',
        Profesional: v.personal_salud ? `${v.personal_salud.nombre} ${v.personal_salud.apellido}` : 'N/A',
        Tipo: v.tipo_visita,
        Estado: v.estado,
        Fecha: v.fecha_hora_visita,
      }));
      sheetName = "Reporte Visitas";
    } else if (tipoReporte === "pacientes") {
      data = Object.entries(dataPacientes.zonas || {}).map(([zona, count]) => ({
        Zona: zona,
        Cantidad: count,
      }));
      sheetName = "Reporte Pacientes";
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Reporte exportado a Excel");
  };

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Análisis y estadísticas del sistema</p>
        </div>
        <Button onClick={exportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={tipoReporte} onValueChange={setTipoReporte}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profesionales">Por Profesional</SelectItem>
              <SelectItem value="llamadas">Por Llamadas</SelectItem>
              <SelectItem value="visitas">Por Visitas</SelectItem>
              <SelectItem value="pacientes">Por Pacientes</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reporte de Profesionales */}
      {tipoReporte === "profesionales" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Llamadas por Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataProfesionales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="llamadas" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitas por Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataProfesionales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visitas" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Resumen por Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dataProfesionales.map((prof, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{prof.nombre}</span>
                    <div className="flex gap-4 text-sm">
                      <span>Llamadas: <strong>{prof.llamadas}</strong></span>
                      <span>Visitas: <strong>{prof.visitas}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Llamadas */}
      {tipoReporte === "llamadas" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estados de Llamadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Realizadas', value: dataLlamadas.filter(l => l.estado === 'realizada').length },
                      { name: 'Agendadas', value: dataLlamadas.filter(l => l.estado === 'agendada').length },
                      { name: 'Canceladas', value: dataLlamadas.filter(l => l.estado === 'cancelada').length },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados de Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-success/10 rounded">
                  <span>Contactados</span>
                  <strong>{dataLlamadas.filter(l => l.resultado_seguimiento === 'contactado').length}</strong>
                </div>
                <div className="flex justify-between p-2 bg-warning/10 rounded">
                  <span>No Contesta</span>
                  <strong>{dataLlamadas.filter(l => l.resultado_seguimiento === 'no_contesta').length}</strong>
                </div>
                <div className="flex justify-between p-2 bg-primary/10 rounded">
                  <span>Visita Agendada</span>
                  <strong>{dataLlamadas.filter(l => l.resultado_seguimiento === 'visita_agendada').length}</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Visitas */}
      {tipoReporte === "visitas" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estados de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Realizadas', value: dataVisitas.filter(v => v.estado === 'realizada').length },
                  { name: 'Pendientes', value: dataVisitas.filter(v => v.estado === 'pendiente').length },
                  { name: 'Canceladas', value: dataVisitas.filter(v => v.estado === 'cancelada').length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Control', value: dataVisitas.filter(v => v.tipo_visita === 'control').length },
                      { name: 'Seguimiento', value: dataVisitas.filter(v => v.tipo_visita === 'seguimiento').length },
                      { name: 'Emergencia', value: dataVisitas.filter(v => v.tipo_visita === 'emergencia').length },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Pacientes */}
      {tipoReporte === "pacientes" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="text-lg">Total</span>
                  <strong className="text-2xl">{dataPacientes.total}</strong>
                </div>
                <div className="flex justify-between p-4 bg-success/10 rounded-lg">
                  <span className="text-lg">Activos</span>
                  <strong className="text-2xl">{dataPacientes.activos}</strong>
                </div>
                <div className="flex justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-lg">Inactivos</span>
                  <strong className="text-2xl">{dataPacientes.inactivos}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Zona</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(dataPacientes.zonas || {}).map(([zona, count]) => ({
                      name: zona,
                      value: count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reportes;
