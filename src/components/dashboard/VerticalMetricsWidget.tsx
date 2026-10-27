import { useMemo } from "react";
import { DonutCard, type DonutDataItem } from "@/components/charts/DonutCard";
import { BarCard, type BarSeriesConfig } from "@/components/charts/BarCard";
import { TrendCard } from "@/components/charts/TrendCard";
import { calculateForecast, type TimeSeriesPoint } from "@/lib/forecast";
import { useVerticalFilter } from "@/hooks/useVerticalFilter";
import { Badge } from "@/components/ui/badge";
import { VERTICAL_LABELS } from "@/config/verticales";

interface VerticalMetricsWidgetProps {
  verticalOverride?: string;
  className?: string;
}

export function VerticalMetricsWidget({ verticalOverride, className = "" }: VerticalMetricsWidgetProps) {
  const { verticalActiva } = useVerticalFilter();
  const vertical = verticalOverride || (verticalActiva === "todas" ? "clinica" : verticalActiva);

  // 1. Datos para DonutCard por vertical
  const donutConfig = useMemo((): { title: string; data: DonutDataItem[]; label: string } => {
    switch (vertical) {
      case "dental":
        return {
          title: "Tratamientos Odontológicos por Tipo",
          label: "Tratamientos",
          data: [
            { name: "Limpiezas / Profilaxis", value: 42, fill: "hsl(var(--chart-1))" },
            { name: "Endodoncias", value: 18, fill: "hsl(var(--chart-2))" },
            { name: "Ortodoncia / Brackets", value: 27, fill: "hsl(var(--chart-3))" },
            { name: "Implantes & Cirugía", value: 14, fill: "hsl(var(--chart-4))" },
            { name: "Restauraciones / Resinas", value: 35, fill: "hsl(var(--chart-5))" },
          ],
        };
      case "aesthetic":
        return {
          title: "Procedimientos Estéticos más Solicitados",
          label: "Procedimientos",
          data: [
            { name: "Toxina Botulínica", value: 38, fill: "hsl(var(--chart-1))" },
            { name: "Ácido Hialurónico", value: 29, fill: "hsl(var(--chart-2))" },
            { name: "Bioestimuladores", value: 21, fill: "hsl(var(--chart-3))" },
            { name: "Peelings Químicos", value: 17, fill: "hsl(var(--chart-4))" },
            { name: "Láser & IPL", value: 24, fill: "hsl(var(--chart-5))" },
          ],
        };
      case "vision":
        return {
          title: "Tipos de Refracción y Recetas Oftalmológicas",
          label: "Refracciones",
          data: [
            { name: "Monofocales Lejos", value: 45, fill: "hsl(var(--chart-1))" },
            { name: "Progresivos Digitales", value: 32, fill: "hsl(var(--chart-2))" },
            { name: "Lentes de Contacto", value: 22, fill: "hsl(var(--chart-3))" },
            { name: "Filtro Luz Azul", value: 28, fill: "hsl(var(--chart-4))" },
            { name: "Lectura Cerca", value: 15, fill: "hsl(var(--chart-5))" },
          ],
        };
      case "recovery":
        return {
          title: "Modalidades de Terapia y Rehabilitación",
          label: "Sesiones",
          data: [
            { name: "Terapia Física Post-QX", value: 48, fill: "hsl(var(--chart-1))" },
            { name: "Neurológica", value: 20, fill: "hsl(var(--chart-2))" },
            { name: "Hidroterapia", value: 16, fill: "hsl(var(--chart-3))" },
            { name: "Terapia Ocupacional", value: 22, fill: "hsl(var(--chart-4))" },
            { name: "Descarga Muscular", value: 14, fill: "hsl(var(--chart-5))" },
          ],
        };
      case "psicologia":
        return {
          title: "Pacientes por Motivo de Consulta",
          label: "Motivos",
          data: [
            { name: "Ansiedad / Estrés", value: 44, fill: "hsl(var(--chart-1))" },
            { name: "Depresión / Estado Ánimo", value: 26, fill: "hsl(var(--chart-2))" },
            { name: "Terapia de Pareja", value: 18, fill: "hsl(var(--chart-3))" },
            { name: "Duelo / Pérdida", value: 12, fill: "hsl(var(--chart-4))" },
            { name: "Desarrollo Personal", value: 20, fill: "hsl(var(--chart-5))" },
          ],
        };
      default: // clinica
        return {
          title: "Pacientes por Estado Clínico",
          label: "Pacientes",
          data: [
            { name: "Activos en Tratamiento", value: 58, fill: "hsl(var(--chart-1))" },
            { name: "En Seguimiento Preventivo", value: 32, fill: "hsl(var(--chart-2))" },
            { name: "Alta Médica", value: 19, fill: "hsl(var(--chart-3))" },
            { name: "Inactivos", value: 11, fill: "hsl(var(--chart-4))" },
          ],
        };
    }
  }, [vertical]);

  // 2. Datos para BarCard por vertical
  const barConfig = useMemo((): {
    title: string;
    data: any[];
    series: BarSeriesConfig[];
  } => {
    switch (vertical) {
      case "dental":
        return {
          title: "Presupuestos Clínicos (Aceptados vs Rechazados)",
          series: [
            { key: "aceptados", label: "Aceptados", color: "hsl(var(--chart-1))" },
            { key: "pendientes", label: "En Revisión", color: "hsl(var(--chart-2))" },
          ],
          data: [
            { label: "Sem 1", aceptados: 14, pendientes: 5 },
            { label: "Sem 2", aceptados: 19, pendientes: 7 },
            { label: "Sem 3", aceptados: 16, pendientes: 4 },
            { label: "Sem 4", aceptados: 23, pendientes: 6 },
          ],
        };
      case "aesthetic":
        return {
          title: "Membresías Estéticas (Nuevas vs Renovadas)",
          series: [
            { key: "nuevas", label: "Nuevas", color: "hsl(var(--chart-1))" },
            { key: "renovadas", label: "Renovadas", color: "hsl(var(--chart-2))" },
          ],
          data: [
            { label: "Sem 1", nuevas: 8, renovadas: 15 },
            { label: "Sem 2", nuevas: 12, renovadas: 18 },
            { label: "Sem 3", nuevas: 10, renovadas: 16 },
            { label: "Sem 4", nuevas: 14, renovadas: 22 },
          ],
        };
      case "vision":
        return {
          title: "Ventas de Óptica (Monturas vs Cristales)",
          series: [
            { key: "monturas", label: "Monturas", color: "hsl(var(--chart-1))" },
            { key: "cristales", label: "Cristales", color: "hsl(var(--chart-2))" },
          ],
          data: [
            { label: "Sem 1", monturas: 12, cristales: 18 },
            { label: "Sem 2", monturas: 15, cristales: 21 },
            { label: "Sem 3", monturas: 11, cristales: 17 },
            { label: "Sem 4", monturas: 18, cristales: 26 },
          ],
        };
      case "recovery":
        return {
          title: "Sesiones de Recuperación (Completadas vs Reprogramadas)",
          series: [
            { key: "completadas", label: "Completadas", color: "hsl(var(--chart-1))" },
            { key: "reprogramadas", label: "Reprogramadas", color: "hsl(var(--chart-2))" },
          ],
          data: [
            { label: "Sem 1", completadas: 34, reprogramadas: 4 },
            { label: "Sem 2", completadas: 41, reprogramadas: 6 },
            { label: "Sem 3", completadas: 38, reprogramadas: 5 },
            { label: "Sem 4", completadas: 47, reprogramadas: 3 },
          ],
        };
      case "psicologia":
        return {
          title: "Asistencia Semanal a Sesiones Psicológicas",
          series: [
            { key: "asistidas", label: "Asistidas", color: "hsl(var(--chart-1))" },
            { key: "canceladas", label: "Canceladas / No-Show", color: "hsl(var(--chart-3))" },
          ],
          data: [
            { label: "Sem 1", asistidas: 22, canceladas: 3 },
            { label: "Sem 2", asistidas: 26, canceladas: 2 },
            { label: "Sem 3", asistidas: 24, canceladas: 4 },
            { label: "Sem 4", asistidas: 29, canceladas: 1 },
          ],
        };
      default: // clinica
        return {
          title: "Citas Médicas Semanales (Atendidas vs No-Show)",
          series: [
            { key: "atendidas", label: "Atendidas", color: "hsl(var(--chart-1))" },
            { key: "canceladas", label: "No-Show / Canceladas", color: "hsl(var(--chart-2))" },
          ],
          data: [
            { label: "Sem 1", atendidas: 45, canceladas: 6 },
            { label: "Sem 2", atendidas: 52, canceladas: 5 },
            { label: "Sem 3", atendidas: 48, canceladas: 7 },
            { label: "Sem 4", atendidas: 61, canceladas: 4 },
          ],
        };
    }
  }, [vertical]);

  // 3. Proyección estadística mediante forecast.ts
  const trendConfig = useMemo((): { title: string; points: TimeSeriesPoint[]; prefix?: string } => {
    let historical: { periodo: string; valor: number }[] = [];
    let title = "Proyección de Consultas";
    let prefix = "";

    switch (vertical) {
      case "dental":
        title = "Proyección de Ingresos por Tratamientos Dentales";
        prefix = "$";
        historical = [
          { periodo: "May", valor: 3200 },
          { periodo: "Jun", valor: 3600 },
          { periodo: "Jul", valor: 3900 },
          { periodo: "Ago", valor: 4200 },
          { periodo: "Sep", valor: 4600 },
          { periodo: "Oct", valor: 5100 },
        ];
        break;
      case "aesthetic":
        title = "Proyección de Ingresos por Procedimientos y Membresías";
        prefix = "$";
        historical = [
          { periodo: "May", valor: 4100 },
          { periodo: "Jun", valor: 4400 },
          { periodo: "Jul", valor: 4800 },
          { periodo: "Ago", valor: 5200 },
          { periodo: "Sep", valor: 5700 },
          { periodo: "Oct", valor: 6300 },
        ];
        break;
      case "vision":
        title = "Proyección de Ventas Ópticas y Consultas";
        prefix = "$";
        historical = [
          { periodo: "May", valor: 2800 },
          { periodo: "Jun", valor: 3100 },
          { periodo: "Jul", valor: 3350 },
          { periodo: "Ago", valor: 3700 },
          { periodo: "Sep", valor: 4050 },
          { periodo: "Oct", valor: 4500 },
        ];
        break;
      case "recovery":
        title = "Proyección de Ocupación de Terapias";
        historical = [
          { periodo: "May", valor: 120 },
          { periodo: "Jun", valor: 135 },
          { periodo: "Jul", valor: 148 },
          { periodo: "Ago", valor: 160 },
          { periodo: "Sep", valor: 175 },
          { periodo: "Oct", valor: 192 },
        ];
        break;
      case "psicologia":
        title = "Proyección de Sesiones Psicológicas";
        historical = [
          { periodo: "May", valor: 85 },
          { periodo: "Jun", valor: 92 },
          { periodo: "Jul", valor: 101 },
          { periodo: "Ago", valor: 110 },
          { periodo: "Sep", valor: 118 },
          { periodo: "Oct", valor: 127 },
        ];
        break;
      default:
        title = "Proyección de Citas y Consultas Clínicas";
        historical = [
          { periodo: "May", valor: 180 },
          { periodo: "Jun", valor: 195 },
          { periodo: "Jul", valor: 215 },
          { periodo: "Ago", valor: 230 },
          { periodo: "Sep", valor: 250 },
          { periodo: "Oct", valor: 275 },
        ];
    }

    const forecast = calculateForecast(historical, 3, (step) => `Mes +${step}`);
    return { title, points: forecast.points, prefix };
  }, [vertical]);

  const verticalName = VERTICAL_LABELS[vertical as keyof typeof VERTICAL_LABELS] || "Clínica General";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Encabezado de métricas por vertical */}
      <div className="flex items-center justify-between border-b pb-2.5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Métricas Especializadas: {verticalName}
          </h3>
          <p className="text-xs text-muted-foreground">
            Indicadores y proyección estadística adaptados al flujo de {verticalName.toLowerCase()}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-medium capitalize border-primary/30 text-primary">
          Especialidad: {vertical}
        </Badge>
      </div>

      {/* Cuadrícula de gráficos especializados */}
      <div className="grid gap-6 md:grid-cols-2">
        <DonutCard
          title={donutConfig.title}
          periodo="Mes actual"
          data={donutConfig.data}
          centerLabel={donutConfig.label}
        />

        <BarCard
          title={barConfig.title}
          periodo="Últimas 4 semanas"
          data={barConfig.data}
          xAxisKey="label"
          series={barConfig.series}
        />
      </div>

      {/* Gráfico de Proyección con Intervalo de Confianza */}
      <TrendCard
        title={trendConfig.title}
        periodo="Histórico 6 meses + Proyección a 3 meses (Regresión Lineal)"
        data={trendConfig.points}
        valuePrefix={trendConfig.prefix}
      />
    </div>
  );
}
