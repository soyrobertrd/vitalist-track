import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pill,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Search,
  X,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const SEVERIDAD_INFO: Record<
  string,
  { label: string; badgeClass: string; cardClass: string; icon: any }
> = {
  leve: {
    label: "Leve",
    badgeClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    cardClass: "border-yellow-500/30 bg-yellow-500/5",
    icon: Info,
  },
  moderada: {
    label: "Moderada",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    cardClass: "border-amber-500/30 bg-amber-500/5",
    icon: AlertTriangle,
  },
  severa: {
    label: "Severa",
    badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
    cardClass: "border-orange-500/30 bg-orange-500/5",
    icon: AlertTriangle,
  },
  contraindicada: {
    label: "Contraindicada",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40",
    cardClass: "border-rose-500/40 bg-rose-500/5",
    icon: AlertOctagon,
  },
};

export default function VademecumInteracciones() {
  const [meds, setMeds] = useState<any[]>([]);
  const [interacciones, setInteracciones] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filtroPa, setFiltroPa] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: b }] = await Promise.all([
        (supabase as any)
          .from("catalogo_medicamentos")
          .select("*")
          .eq("activo", true)
          .order("nombre_comercial")
          .limit(500),
        (supabase as any)
          .from("interacciones_farmacologicas")
          .select("*")
          .order("severidad", { ascending: false }),
      ]);
      setMeds(a || []);
      setInteracciones(b || []);
      setLoading(false);
    })();
  }, []);

  const toggleMed = (pa: string) => {
    setSeleccionados((prev) =>
      prev.includes(pa) ? prev.filter((x) => x !== pa) : [...prev, pa]
    );
  };

  const interaccionesDetectadas = useMemo(() => {
    if (seleccionados.length < 2) return [];
    return interacciones.filter(
      (i) =>
        seleccionados.includes(i.principio_activo_a) &&
        seleccionados.includes(i.principio_activo_b)
    );
  }, [seleccionados, interacciones]);

  // Principios activos únicos
  const principiosActivos = useMemo(() => {
    const set = new Set<string>();
    meds.forEach((m) => {
      if (m.principio_activo) set.add(m.principio_activo);
    });
    return Array.from(set).sort();
  }, [meds]);

  const principiosFiltrados = useMemo(() => {
    if (!filtroPa.trim()) return principiosActivos;
    const term = filtroPa.toLowerCase();
    return principiosActivos.filter((pa) => pa.toLowerCase().includes(term));
  }, [principiosActivos, filtroPa]);

  const medsFilt = useMemo(() => {
    if (!q.trim()) return meds;
    const term = q.toLowerCase();
    return meds.filter(
      (m) =>
        m.nombre_comercial.toLowerCase().includes(term) ||
        m.principio_activo.toLowerCase().includes(term) ||
        (m.grupo_terapeutico && m.grupo_terapeutico.toLowerCase().includes(term))
    );
  }, [meds, q]);

  // KPIs
  const kpis = useMemo(() => {
    const contraindicadas = interacciones.filter((i) => i.severidad === "contraindicada").length;
    return {
      totalMeds: meds.length,
      totalInteracciones: interacciones.length,
      contraindicadas,
      totalPrincipios: principiosActivos.length,
    };
  }, [meds, interacciones, principiosActivos]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Vademécum & Verificador de Interacciones"
        subtitle="Catálogo farmacéutico institucional, detección cruzada de interacciones y guías de administración segura"
        icon={Pill}
        badge="Farmacovigilancia"
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Fármacos en Vademécum"
          value={kpis.totalMeds}
          subtitle="Medicamentos homologados"
          icon={Pill}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Principios Activos"
          value={kpis.totalPrincipios}
          subtitle="Moléculas registradas"
          icon={ShieldCheck}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Pares de Interacción"
          value={kpis.totalInteracciones}
          subtitle="Reglas farmacológicas cargadas"
          icon={Layers}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Contraindicaciones Críticas"
          value={kpis.contraindicadas}
          subtitle="Pares de riesgo vital (alerta roja)"
          icon={AlertOctagon}
          variant="rose"
          alert={kpis.contraindicadas > 0}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checker" className="space-y-4">
        <TabsList className="bg-card border border-border/80 rounded-xl p-1">
          <TabsTrigger value="checker" className="rounded-lg gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-primary" /> Verificador de Interacción
            {interaccionesDetectadas.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                {interaccionesDetectadas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="meds" className="rounded-lg gap-2 text-xs">
            <Pill className="w-4 h-4 text-emerald-600" /> Catálogo de Medicamentos ({meds.length})
          </TabsTrigger>
          <TabsTrigger value="todas" className="rounded-lg gap-2 text-xs">
            <Layers className="w-4 h-4 text-blue-600" /> Matriz Farmacológica ({interacciones.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Verificador */}
        <TabsContent value="checker" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Selecciona 2 o más principios activos para cruzar interacciones
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar principio activo..."
                  className="pl-8 h-8 text-xs rounded-xl"
                  value={filtroPa}
                  onChange={(e) => setFiltroPa(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap max-h-48 overflow-y-auto p-1 border rounded-xl border-border/60 bg-muted/20">
              {principiosFiltrados.map((pa) => {
                const activo = seleccionados.includes(pa);
                return (
                  <Badge
                    key={pa}
                    variant={activo ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-all ${
                      activo
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted/80 text-foreground"
                    }`}
                    onClick={() => toggleMed(pa)}
                  >
                    {pa}
                  </Badge>
                );
              })}
              {!principiosFiltrados.length && (
                <div className="p-4 text-xs text-muted-foreground text-center w-full">
                  No se encontraron principios con "{filtroPa}"
                </div>
              )}
            </div>

            {seleccionados.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">Seleccionados:</span>
                  {seleccionados.map((pa) => (
                    <Badge
                      key={pa}
                      variant="secondary"
                      className="rounded-lg text-xs gap-1 pl-2 pr-1 py-0.5"
                    >
                      {pa}
                      <button
                        onClick={() => toggleMed(pa)}
                        className="hover:text-destructive rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSeleccionados([])}
                  className="text-xs text-muted-foreground hover:text-foreground h-7"
                >
                  Limpiar todos
                </Button>
              </div>
            )}
          </Card>

          {/* Resultado de la evaluación */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {interaccionesDetectadas.length > 0 ? (
                  <AlertOctagon className="h-5 w-5 text-rose-600" />
                ) : seleccionados.length >= 2 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Info className="h-5 w-5 text-muted-foreground" />
                )}
                {interaccionesDetectadas.length > 0
                  ? `Se detectaron ${interaccionesDetectadas.length} interacción(es) farmacológica(s)`
                  : seleccionados.length >= 2
                  ? "Combinación segura: no se encontraron interacciones adversas reportadas"
                  : "Selecciona al menos 2 principios activos para ejecutar el análisis"}
              </h3>
            </div>

            {interaccionesDetectadas.map((i) => {
              const conf = SEVERIDAD_INFO[i.severidad] || SEVERIDAD_INFO.moderada;
              const IconComp = conf.icon;

              return (
                <Card
                  key={i.id}
                  className={`rounded-2xl border p-4 space-y-3 shadow-sm transition-all ${conf.cardClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-base flex items-center gap-2 text-foreground">
                        <IconComp className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>
                          {i.principio_activo_a} <span className="text-muted-foreground font-normal">↔</span>{" "}
                          {i.principio_activo_b}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`rounded-lg font-bold text-xs uppercase ${conf.badgeClass}`}>
                      {conf.label}
                    </Badge>
                  </div>

                  {i.efecto_clinico && (
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">Efecto Clínico: </span>
                      <span className="text-muted-foreground">{i.efecto_clinico}</span>
                    </div>
                  )}

                  {i.mecanismo && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Mecanismo farmacológico: </span>
                      {i.mecanismo}
                    </div>
                  )}

                  {i.recomendacion && (
                    <div className="text-xs p-3 rounded-xl border border-border/60 bg-background/80 space-y-1">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Recomendación Terapéutica:
                      </span>
                      <p className="text-muted-foreground">{i.recomendacion}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Catálogo de Medicamentos */}
        <TabsContent value="meds" className="space-y-4 mt-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, principio activo o grupo..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 rounded-xl h-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Mostrando {medsFilt.length} de {meds.length} medicamentos
            </span>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Nombre Comercial</TableHead>
                    <TableHead>Principio Activo</TableHead>
                    <TableHead>Concentración</TableHead>
                    <TableHead>Vía</TableHead>
                    <TableHead>Grupo Terapéutico</TableHead>
                    <TableHead className="text-center w-24">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medsFilt.map((m) => {
                    const isSelected = seleccionados.includes(m.principio_activo);
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold text-foreground">{m.nombre_comercial}</TableCell>
                        <TableCell className="font-mono text-xs text-foreground font-medium">
                          {m.principio_activo}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.concentracion || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.via_administracion || "Oral"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {m.grupo_terapeutico || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant={isSelected ? "secondary" : "outline"}
                            className="rounded-xl h-7 text-xs"
                            onClick={() => toggleMed(m.principio_activo)}
                          >
                            {isSelected ? "Quitar" : "Evaluar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!medsFilt.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No se encontraron medicamentos con los filtros aplicados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Matriz de Interacciones */}
        <TabsContent value="todas" className="mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Base de Conocimiento de Farmacovigilancia</CardTitle>
              <CardDescription>Pares de principios activos con riesgo documentado y conducta recomendada</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Fármaco A</TableHead>
                    <TableHead>Fármaco B</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Efecto Clínico</TableHead>
                    <TableHead>Recomendación Médica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interacciones.map((i) => {
                    const conf = SEVERIDAD_INFO[i.severidad] || SEVERIDAD_INFO.moderada;
                    return (
                      <TableRow key={i.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold font-mono text-xs">{i.principio_activo_a}</TableCell>
                        <TableCell className="font-semibold font-mono text-xs">{i.principio_activo_b}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-lg font-bold text-xs uppercase ${conf.badgeClass}`}>
                            {conf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-foreground max-w-xs">{i.efecto_clinico || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-sm">{i.recomendacion || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!interacciones.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                        No hay interacciones registradas en la base de datos.
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

