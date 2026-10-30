import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Receipt,
  Camera,
  DollarSign,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  BarChart3,
  TrendingDown,
  History,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const RANGOS_INFO: Record<string, { label: string; color: string; badgeClass: string; variant: "emerald" | "blue" | "amber" | "rose" }> = {
  "0-30": {
    label: "0 a 30 días (Corriente)",
    color: "#10b981",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    variant: "emerald",
  },
  "31-60": {
    label: "31 a 60 días (Mora temprana)",
    color: "#3b82f6",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    variant: "blue",
  },
  "61-90": {
    label: "61 a 90 días (Mora intermedia)",
    color: "#f59e0b",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    variant: "amber",
  },
  "90+": {
    label: "Más de 90 días (Mora crítica)",
    color: "#f43f5e",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    variant: "rose",
  },
};

export default function ARAging() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [aging, setAging] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const [{ data: a }, { data: b }] = await Promise.all([
      (supabase as any).rpc("calcular_ar_aging", { _workspace_id: wsId }),
      (supabase as any)
        .from("ar_aging_snapshots")
        .select("*")
        .eq("workspace_id", wsId)
        .order("fecha_corte", { ascending: false })
        .limit(20),
    ]);
    setAging(a || []);
    setSnapshots(b || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, [wsId]);

  const guardarSnapshot = async () => {
    if (!wsId) return;
    const map: any = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    aging.forEach((a) => (map[a.rango] = Number(a.monto || 0)));
    const total = Object.values(map).reduce((s: number, v: any) => s + v, 0);
    const { error } = await (supabase as any).from("ar_aging_snapshots").insert({
      workspace_id: wsId,
      fecha_corte: new Date().toISOString().slice(0, 10),
      rango_0_30: map["0-30"],
      rango_31_60: map["31-60"],
      rango_61_90: map["61-90"],
      rango_90_plus: map["90+"],
      total,
      detalle: aging,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Foto de cartera (snapshot) guardada exitosamente");
    cargar();
  };

  const totalActual = useMemo(
    () => aging.reduce((s, a) => s + Number(a.monto || 0), 0),
    [aging]
  );
  const cantTotal = useMemo(
    () => aging.reduce((s, a) => s + Number(a.cantidad || 0), 0),
    [aging]
  );

  // Datos para gráfico de barras por rango
  const dataBarras = useMemo(() => {
    return ["0-30", "31-60", "61-90", "90+"].map((rangoKey) => {
      const fila = aging.find((a) => a.rango === rangoKey);
      const conf = RANGOS_INFO[rangoKey];
      const monto = Number(fila?.monto || 0);
      const cantidad = Number(fila?.cantidad || 0);
      return {
        rango: `${rangoKey} d`,
        nombreLargo: conf.label,
        monto,
        cantidad,
        color: conf.color,
      };
    });
  }, [aging]);

  // Datos para Donut chart de composición
  const dataPie = useMemo(() => {
    return dataBarras
      .filter((d) => d.monto > 0)
      .map((d) => ({
        name: d.nombreLargo,
        value: d.monto,
        color: d.color,
      }));
  }, [dataBarras]);

  // Datos para gráfico histórico de snapshots
  const dataHistorica = useMemo(() => {
    return [...snapshots]
      .reverse()
      .map((s) => ({
        fecha: s.fecha_corte,
        "0-30 d": Number(s.rango_0_30 || 0),
        "31-60 d": Number(s.rango_31_60 || 0),
        "61-90 d": Number(s.rango_61_90 || 0),
        "90+ d": Number(s.rango_90_plus || 0),
        Total: Number(s.total || 0),
      }));
  }, [snapshots]);

  // Montos por bucket
  const monto0_30 = Number(aging.find((a) => a.rango === "0-30")?.monto || 0);
  const monto31_60 = Number(aging.find((a) => a.rango === "31-60")?.monto || 0);
  const monto61_90 = Number(aging.find((a) => a.rango === "61-90")?.monto || 0);
  const monto90Plus = Number(aging.find((a) => a.rango === "90+")?.monto || 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="AR Aging & Cartera de Cuentas por Cobrar"
        subtitle="Estratificación de saldos pendientes por antigüedad, auditoría de morosidad y snapshots históricos"
        icon={Receipt}
        badge="Tesorería & Facturación"
        action={
          <Button onClick={guardarSnapshot} className="rounded-xl shadow-sm gap-2">
            <Camera className="h-4 w-4" /> Guardar Snapshot
          </Button>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ClinicalKpiCard
          title="Cartera Total"
          value={`$${totalActual.toLocaleString("es-DO")}`}
          subtitle={`${cantTotal} facturas pendientes`}
          icon={DollarSign}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Corriente (0-30d)"
          value={`$${monto0_30.toLocaleString("es-DO")}`}
          subtitle="En plazo ordinario"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Mora (31-60d)"
          value={`$${monto31_60.toLocaleString("es-DO")}`}
          subtitle="Primer aviso de cobro"
          icon={Clock}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Mora (61-90d)"
          value={`$${monto61_90.toLocaleString("es-DO")}`}
          subtitle="Gestión pre-jurídica"
          icon={AlertTriangle}
          variant="amber"
          alert={monto61_90 > 0}
        />
        <ClinicalKpiCard
          title="Crítica (90+d)"
          value={`$${monto90Plus.toLocaleString("es-DO")}`}
          subtitle="Riesgo de incobrabilidad"
          icon={AlertOctagon}
          variant="rose"
          alert={monto90Plus > 0}
        />
      </div>

      {/* Vistas en Pestañas */}
      <Tabs defaultValue="analitica" className="space-y-4">
        <TabsList className="bg-card border border-border/80 rounded-xl p-1">
          <TabsTrigger value="analitica" className="rounded-lg gap-2">
            <BarChart3 className="w-4 h-4" /> Distribución & Gráficos
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-lg gap-2">
            <History className="w-4 h-4" /> Historial de Snapshots ({snapshots.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Gráficos y Estratificación Actual */}
        <TabsContent value="analitica" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Barras por Rango */}
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Monto por Cubeta de Vencimiento
                </CardTitle>
                <CardDescription>Distribución del saldo pendiente según días transcurridos</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataBarras} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="rango" tickLine={false} />
                      <YAxis
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(val: number) => [`$${val.toLocaleString("es-DO")}`, "Saldo"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                        {dataBarras.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 2: Composición Porcentual */}
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-amber-600" /> Proporción de la Cartera
                </CardTitle>
                <CardDescription>Porcentaje relativo de cada rango sobre el total adeudado</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  {dataPie.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No hay saldos pendientes registrados
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dataPie.map((entry, index) => (
                            <Cell key={`pie-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [
                            `$${val.toLocaleString("es-DO")} (${((val / totalActual) * 100).toFixed(1)}%)`,
                            "Total",
                          ]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Cartera Actual */}
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Detalle de Cartera por Período de Vencimiento</CardTitle>
              <CardDescription>Resumen de montos, cantidad de documentos y participación</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Rango de Antigüedad</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-right">Facturas / Recibos</TableHead>
                    <TableHead className="text-right">Participación (%)</TableHead>
                    <TableHead className="text-center w-36">Nivel de Riesgo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["0-30", "31-60", "61-90", "90+"].map((rangoKey) => {
                    const row = aging.find((a) => a.rango === rangoKey);
                    const conf = RANGOS_INFO[rangoKey];
                    const monto = Number(row?.monto || 0);
                    const cantidad = Number(row?.cantidad || 0);
                    const pct = totalActual > 0 ? (monto / totalActual) * 100 : 0;

                    return (
                      <TableRow key={rangoKey} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className={`rounded-lg font-medium text-xs ${conf.badgeClass}`}>
                            {conf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-foreground">
                          ${monto.toLocaleString("es-DO")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">{cantidad}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{pct.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              rangoKey === "90+"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                                : rangoKey === "61-90"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : rangoKey === "31-60"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {rangoKey === "90+"
                              ? "Muy Alto"
                              : rangoKey === "61-90"
                              ? "Moderado"
                              : rangoKey === "31-60"
                              ? "Bajo"
                              : "Normal"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Histórico de Snapshots */}
        <TabsContent value="historico" className="space-y-6 mt-0">
          {dataHistorica.length > 0 && (
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" /> Curva Histórica de Morosidad
                </CardTitle>
                <CardDescription>Evolución de los saldos registrados a través de snapshots</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dataHistorica} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="fecha" tickLine={false} />
                      <YAxis
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(val: number) => [`$${val.toLocaleString("es-DO")}`, ""]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="0-30 d" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="31-60 d" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="61-90 d" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="90+ d" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Registro Histórico de Cortes de Cartera</CardTitle>
              <CardDescription>Cortes almacenados para auditoría y seguimiento financiero</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Fecha de Corte</TableHead>
                    <TableHead className="text-right">0-30 días</TableHead>
                    <TableHead className="text-right">31-60 días</TableHead>
                    <TableHead className="text-right">61-90 días</TableHead>
                    <TableHead className="text-right">90+ días</TableHead>
                    <TableHead className="text-right">Saldo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">
                        {new Date(s.fecha_corte + "T12:00:00").toLocaleDateString("es-DO")}
                      </TableCell>
                      <TableCell className="text-right font-mono">${Number(s.rango_0_30).toLocaleString("es-DO")}</TableCell>
                      <TableCell className="text-right font-mono">${Number(s.rango_31_60).toLocaleString("es-DO")}</TableCell>
                      <TableCell className="text-right font-mono">${Number(s.rango_61_90).toLocaleString("es-DO")}</TableCell>
                      <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                        ${Number(s.rango_90_plus).toLocaleString("es-DO")}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        ${Number(s.total).toLocaleString("es-DO")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!snapshots.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No hay snapshots guardados aún. Presiona "Guardar Snapshot" para registrar el estado de hoy.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

