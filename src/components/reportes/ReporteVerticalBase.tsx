import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { VerticalTipo } from "@/contexts/VerticalContext";

interface Props {
  vertical: VerticalTipo;
  titulo: string;
  descripcion?: string;
  acento?: string;
}

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#06b6d4"];

export default function ReporteVerticalBase({ vertical, titulo, descripcion, acento = "#2563eb" }: Props) {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState(30);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);

  const desde = useMemo(() => startOfDay(subDays(new Date(), dias)), [dias]);
  const hasta = useMemo(() => endOfDay(new Date()), []);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    (async () => {
      setLoading(true);
      const wsId = currentWorkspace.id;
      const [p, c, f] = await Promise.all([
        supabase.from("pacientes").select("id, sexo, fecha_nacimiento, activo, created_at")
          .eq("workspace_id", wsId).eq("vertical", vertical as any),
        supabase.from("citas_universales").select("id, fecha_inicio, estado, profesional_id")
          .eq("workspace_id", wsId).eq("vertical", vertical as any)
          .gte("fecha_inicio", desde.toISOString()).lte("fecha_inicio", hasta.toISOString()),
        supabase.from("facturas").select("id, total, estado, fecha_emision, vertical")
          .eq("workspace_id", wsId).eq("vertical", vertical as any)
          .gte("fecha_emision", desde.toISOString().slice(0, 10)),
      ]);
      setPacientes(p.data || []);
      setCitas(c.data || []);
      setFacturas(f.data || []);
      setLoading(false);
    })();
  }, [currentWorkspace?.id, vertical, dias]);

  const kpis = useMemo(() => {
    const pacActivos = pacientes.filter((x) => x.activo !== false).length;
    const pacNuevos = pacientes.filter((x) => new Date(x.created_at) >= desde).length;
    const completadas = citas.filter((x) => ["completada", "asistida", "finalizada"].includes(String(x.estado))).length;
    const noShow = citas.filter((x) => ["no_asistio", "no_show"].includes(String(x.estado))).length;
    const ingresos = facturas
      .filter((x) => ["pagada", "cobrada", "emitida"].includes(String(x.estado)))
      .reduce((s, f) => s + Number(f.total || 0), 0);
    const tasaAsis = citas.length ? (completadas / citas.length) * 100 : 0;
    return { pacActivos, pacNuevos, completadas, noShow, ingresos, tasaAsis, totalCitas: citas.length };
  }, [pacientes, citas, facturas, desde]);

  const serieDiaria = useMemo(() => {
    const map = new Map<string, number>();
    eachDayOfInterval({ start: desde, end: hasta }).forEach((d) =>
      map.set(format(d, "yyyy-MM-dd"), 0)
    );
    citas.forEach((c) => {
      const k = format(new Date(c.fecha_inicio), "yyyy-MM-dd");
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([fecha, total]) => ({
      fecha: format(new Date(fecha + "T12:00:00"), "dd MMM", { locale: es }),
      total,
    }));
  }, [citas, desde, hasta]);

  const distEstado = useMemo(() => {
    const c: Record<string, number> = {};
    citas.forEach((x) => (c[x.estado || "sin estado"] = (c[x.estado || "sin estado"] || 0) + 1));
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [citas]);

  const exportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
        Vertical: vertical, Desde: format(desde, "yyyy-MM-dd"), Hasta: format(hasta, "yyyy-MM-dd"),
        "Pacientes activos": kpis.pacActivos, "Pacientes nuevos": kpis.pacNuevos,
        "Citas totales": kpis.totalCitas, "Completadas": kpis.completadas, "No-show": kpis.noShow,
        "Tasa asistencia %": kpis.tasaAsis.toFixed(1), "Ingresos": kpis.ingresos,
      }]), "Resumen");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serieDiaria), "Citas por día");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(distEstado), "Estados");
      XLSX.writeFile(wb, `reporte-${vertical}-${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success("Reporte exportado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: acento }}>{titulo}</h1>
          {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={dias === d ? "default" : "outline"} onClick={() => setDias(d)}>
              {d}d
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={exportarExcel}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pacientes activos", value: kpis.pacActivos, icon: Users },
          { label: "Pacientes nuevos", value: kpis.pacNuevos, icon: TrendingUp },
          { label: "Citas totales", value: kpis.totalCitas, icon: Calendar },
          { label: "Ingresos", value: `$${kpis.ingresos.toLocaleString()}`, icon: DollarSign },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-normal">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Citas por día</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            {loading ? <p className="text-muted-foreground">Cargando…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieDiaria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="total" fill={acento} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribución por estado</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            {loading ? <p className="text-muted-foreground">Cargando…</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distEstado} dataKey="value" nameKey="name" outerRadius={90} label>
                    {distEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Indicadores operativos</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tasa de asistencia</p>
            <p className="text-xl font-semibold">{kpis.tasaAsis.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">No-show</p>
            <p className="text-xl font-semibold">{kpis.noShow}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Citas completadas</p>
            <p className="text-xl font-semibold">{kpis.completadas}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
