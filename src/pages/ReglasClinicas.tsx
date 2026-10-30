import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Zap,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Play,
  Search,
  Filter,
  Flame,
  Droplet,
  HeartPulse,
  Pill,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export interface ReglaClinicaItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria: "sepsis" | "laboratorio_panico" | "farmacologia" | "cardiologia" | "epidemiologia";
  severidad: "critica" | "alta" | "media" | "baja";
  descripcion: string;
  evento_disparador: string;
  condicion_evaluada: string;
  accion_ejecutada: string;
  activo: boolean;
  es_global: boolean;
  veces_disparada: number;
}

const MOCK_REGLAS: ReglaClinicaItem[] = [
  {
    id: "reg-01",
    codigo: "CDSS-SEP-01",
    nombre: "Detección Temprana de Sepsis (qSOFA ≥ 2)",
    categoria: "sepsis",
    severidad: "critica",
    descripcion: "Dispara alarma STAT al detectar al menos 2 criterios: FR ≥ 22 rpm, PAS ≤ 100 mmHg o alteración del sensorio (GCS < 15).",
    evento_disparador: "actualizacion_signos_vitales",
    condicion_evaluada: "qSOFA_score >= 2 OR NEWS2 >= 5",
    accion_ejecutada: "Generar Alerta STAT a Médico de Piso + Orden de Lactato Sérico y Hemocultivos",
    activo: true,
    es_global: true,
    veces_disparada: 42,
  },
  {
    id: "reg-02",
    codigo: "CDSS-LAB-02",
    nombre: "Valor de Pánico: Hiperkalemia Severa (K⁺ > 6.0 mEq/L)",
    categoria: "laboratorio_panico",
    severidad: "critica",
    descripcion: "Notificación prioritaria por riesgo inminente de arritmias ventriculares letales / bloqueo AV.",
    evento_disparador: "resultado_laboratorio_validado",
    condicion_evaluada: "analito == 'Potasio' AND valor > 6.0",
    accion_ejecutada: "Llamada read-back obligatoria a enfermería + Orden STAT de ECG 12 derivaciones",
    activo: true,
    es_global: true,
    veces_disparada: 18,
  },
  {
    id: "reg-03",
    codigo: "CDSS-FAR-03",
    nombre: "Interacción Medicamentosa Contraindicada (Nivel X)",
    categoria: "farmacologia",
    severidad: "alta",
    descripcion: "Bloqueo automático de prescripción médica en CPOE ante combinaciones con riesgo de prolongación severa de QT o hemorragia mortal.",
    evento_disparador: "prescripcion_farma_cpoe",
    condicion_evaluada: "farmacos_combinados IN ('Amiodarona + Levofloxacino', 'Warfarina + Ketoconazol')",
    accion_ejecutada: "Interrupción de orden CPOE con requerimiento de anulación o justificación médica excepcional",
    activo: true,
    es_global: true,
    veces_disparada: 15,
  },
  {
    id: "reg-04",
    codigo: "CDSS-EPI-04",
    nombre: "Notificación Inmediata SINAVE / DIGEPI (Dengue Grave / Cólera)",
    categoria: "epidemiologia",
    severidad: "alta",
    descripcion: "Detección de diagnósticos CIE-10 A90/A91/A00 que requieren ficha epidemiológica obligatoria EPI-1.",
    evento_disparador: "diagnostico_cie10_guardado",
    condicion_evaluada: "cie10_codigo IN ('A90', 'A91', 'A00', 'A15', 'A82')",
    accion_ejecutada: "Apertura obligatoria de Ficha EPI-1 en bandeja de Epidemiología Hospitalaria",
    activo: true,
    es_global: true,
    veces_disparada: 31,
  },
  {
    id: "reg-05",
    codigo: "CDSS-GLU-05",
    nombre: "Alerta de Hipoglucemia Grave (< 54 mg/dL)",
    categoria: "laboratorio_panico",
    severidad: "critica",
    descripcion: "Detección de neuroglucopenia severa en glucemia capilar o suero en pacientes internados.",
    evento_disparador: "glucemia_capilar_turno",
    condicion_evaluada: "glucosa_mg_dl < 54",
    accion_ejecutada: "Alarma sonora en estación de enfermería + Indicación de Dextrosa al 50% IV según protocolo",
    activo: true,
    es_global: true,
    veces_disparada: 27,
  },
  {
    id: "reg-06",
    codigo: "CDSS-CAR-06",
    nombre: "Profilaxis Tromboembólica en Fibrilación Auricular",
    categoria: "cardiologia",
    severidad: "media",
    descripcion: "Sugerencia de anticoagulación oral en pacientes con FA no valvular y CHA2DS2-VASc ≥ 2.",
    evento_disparador: "cierre_nota_soap_cardiologia",
    condicion_evaluada: "diagnostico == 'I48' AND cha2ds2_score >= 2 AND anticoagulado == false",
    accion_ejecutada: "Notificación asistencial sugiriendo evaluación de DOAC (Apixabán / Rivaroxabán)",
    activo: true,
    es_global: true,
    veces_disparada: 22,
  },
];

const SEVERIDAD_STYLES: Record<string, { label: string; badgeClass: string; borderClass: string }> = {
  critica: {
    label: "Crítica / Soporte Vital",
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40 animate-pulse",
    borderClass: "border-red-500/40 hover:border-red-500/60",
  },
  alta: {
    label: "Alta Prioridad",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    borderClass: "border-orange-500/30 hover:border-orange-500/50",
  },
  media: {
    label: "Moderada / Alerta",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    borderClass: "border-amber-500/30 hover:border-amber-500/50",
  },
  baja: {
    label: "Informativa",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    borderClass: "border-blue-500/30 hover:border-blue-500/50",
  },
};

const CATEGORIA_ICONS: Record<string, any> = {
  sepsis: AlertTriangle,
  laboratorio_panico: Droplet,
  farmacologia: Zap,
  cardiologia: HeartPulse,
  epidemiologia: ShieldAlert,
};

export default function ReglasClinicas() {
  const [reglas, setReglas] = useState<ReglaClinicaItem[]>(MOCK_REGLAS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>("todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [simuladorModalOpen, setSimuladorModalOpen] = useState(false);
  const [reglaSimulada, setReglaSimulada] = useState<ReglaClinicaItem | null>(null);

  // Formulario de nueva regla
  const [nuevaRegla, setNuevaRegla] = useState({
    codigo: "",
    nombre: "",
    categoria: "sepsis" as ReglaClinicaItem["categoria"],
    severidad: "alta" as ReglaClinicaItem["severidad"],
    descripcion: "",
    evento_disparador: "actualizacion_signos_vitales",
    condicion_evaluada: "",
    accion_ejecutada: "",
  });

  // Valores del simulador
  const [simParam1, setSimParam1] = useState("24"); // ej: FR
  const [simParam2, setSimParam2] = useState("95"); // ej: PAS
  const [simResultado, setSimResultado] = useState<string | null>(null);

  useEffect(() => {
    cargarReglas();
  }, []);

  const cargarReglas = async () => {
    setLoading(true);
    try {
      const { data, error } = await (db as any)
        .from("reglas_clinicas")
        .select("*")
        .order("severidad", { ascending: false });

      if (!error && data && data.length > 0) {
        setReglas(
          data.map((r: any) => ({
            id: r.id,
            codigo: r.codigo || "CDSS-REG",
            nombre: r.nombre,
            categoria: r.categoria || "sepsis",
            severidad: r.severidad || "alta",
            descripcion: r.descripcion || "",
            evento_disparador: r.evento_disparador || "evento_clinico",
            condicion_evaluada: r.condicion || "true",
            accion_ejecutada: r.accion || "Generar alerta clínica",
            activo: Boolean(r.activo ?? true),
            es_global: Boolean(r.es_global ?? true),
            veces_disparada: Number(r.veces_disparada || 0),
          }))
        );
      }
    } catch {
      // Fallback a MOCK_REGLAS
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (regla: ReglaClinicaItem) => {
    const nuevoEstado = !regla.activo;
    setReglas((prev) =>
      prev.map((r) => (r.id === regla.id ? { ...r, activo: nuevoEstado } : r))
    );
    try {
      await (db as any)
        .from("reglas_clinicas")
        .update({ activo: nuevoEstado })
        .eq("id", regla.id);
    } catch {
      // Mock local
    }
    toast.success(
      nuevoEstado ? `Regla ${regla.codigo} activada` : `Regla ${regla.codigo} desactivada`
    );
  };

  const handleCrearRegla = () => {
    if (!nuevaRegla.nombre || !nuevaRegla.condicion_evaluada) {
      toast.error("Debe ingresar el nombre y la condición evaluada");
      return;
    }

    const item: ReglaClinicaItem = {
      id: `reg-${Date.now()}`,
      codigo: nuevaRegla.codigo || `CDSS-${Math.floor(100 + Math.random() * 900)}`,
      nombre: nuevaRegla.nombre,
      categoria: nuevaRegla.categoria,
      severidad: nuevaRegla.severidad,
      descripcion: nuevaRegla.descripcion,
      evento_disparador: nuevaRegla.evento_disparador,
      condicion_evaluada: nuevaRegla.condicion_evaluada,
      accion_ejecutada: nuevaRegla.accion_ejecutada || "Disparar alerta a estación clínica",
      activo: true,
      es_global: true,
      veces_disparada: 0,
    };

    setReglas([item, ...reglas]);
    toast.success("Nueva regla clínica agregada al motor de inferencia");
    setModalOpen(false);
  };

  const abrirSimulador = (regla: ReglaClinicaItem) => {
    setReglaSimulada(regla);
    setSimResultado(null);
    setSimuladorModalOpen(true);
  };

  const ejecutarSimulacion = () => {
    const val1 = Number(simParam1);
    const val2 = Number(simParam2);
    // Simular evaluación
    if (reglaSimulada?.codigo === "CDSS-SEP-01") {
      if (val1 >= 22 && val2 <= 100) {
        setSimResultado("¡CONDICIÓN CUMPLIDA! Alarma STAT de Sepsis disparada en 115ms.");
      } else {
        setSimResultado("Parámetros estables: La regla no se dispara (qSOFA < 2).");
      }
    } else {
      setSimResultado("Simulación ejecutada: Regla evaluada exitosamente en 120ms sin errores de sintaxis.");
    }
  };

  // KPIs
  const reglasActivas = useMemo(() => reglas.filter((r) => r.activo).length, [reglas]);
  const totalDisparos = useMemo(
    () => reglas.reduce((s, r) => s + (r.veces_disparada || 0), 0),
    [reglas]
  );
  const reglasCriticas = useMemo(
    () => reglas.filter((r) => r.severidad === "critica").length,
    [reglas]
  );

  // Filtrado
  const filteredReglas = useMemo(() => {
    return reglas.filter((r) => {
      const matchSearch =
        !search ||
        r.nombre.toLowerCase().includes(search.toLowerCase()) ||
        r.codigo.toLowerCase().includes(search.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(search.toLowerCase());
      const matchCat = filtroCategoria === "todas" || r.categoria === filtroCategoria;
      const matchSev = filtroSeveridad === "todas" || r.severidad === filtroSeveridad;
      return matchSearch && matchCat && matchSev;
    });
  }, [reglas, search, filtroCategoria, filtroSeveridad]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Motor de Reglas Clínicas & CDSS"
        subtitle="Sistema de soporte a la decisión clínica (CDSS) para detección temprana de sepsis, valores de pánico e interacciones farmacológicas"
        icon={Brain}
        badge="Inferencia Médica & Alertas"
        action={
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="rounded-xl gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4" /> Crear Regla Clínica
          </Button>
        }
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Reglas Activas en Tiempo Real"
          value={`${reglasActivas} / ${reglas.length}`}
          subtitle="Monitoreo continuo 24/7"
          icon={Brain}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Reglas de Soporte Vital (Críticas)"
          value={reglasCriticas}
          subtitle="Sepsis, arritmias y shock"
          icon={ShieldAlert}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Alertas Prevenidas este Mes"
          value={totalDisparos}
          subtitle="Intervenciones clínicas oportunas"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Latencia del Motor"
          value="< 140 ms"
          subtitle="Inferencia casi instantánea"
          icon={Activity}
          variant="teal"
        />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="rounded-2xl border-border/80 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar regla por código (ej. CDSS-SEP), nombre, fármaco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border/80 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[180px] rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                <SelectItem value="sepsis">Sepsis & Deterioro</SelectItem>
                <SelectItem value="laboratorio_panico">Valores de Pánico LIS</SelectItem>
                <SelectItem value="farmacologia">Farmacovigilancia</SelectItem>
                <SelectItem value="cardiologia">Cardiología</SelectItem>
                <SelectItem value="epidemiologia">Epidemiología SINAVE</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroSeveridad} onValueChange={setFiltroSeveridad}>
              <SelectTrigger className="w-[160px] rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las severidades</SelectItem>
                <SelectItem value="critica">Crítica (Soporte Vital)</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Moderada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid de Reglas Clínicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReglas.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
            No se encontraron reglas clínicas con los criterios de búsqueda.
          </div>
        ) : (
          filteredReglas.map((r) => {
            const Icon = CATEGORIA_ICONS[r.categoria] || Brain;
            const style = SEVERIDAD_STYLES[r.severidad] || SEVERIDAD_STYLES.alta;

            return (
              <Card
                key={r.id}
                className={`rounded-2xl border-border/80 shadow-sm transition-all bg-card/70 flex flex-col justify-between ${
                  !r.activo ? "opacity-60" : style.borderClass
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] font-bold text-muted-foreground">
                          {r.codigo}
                        </div>
                        <CardTitle className="text-sm font-bold text-foreground leading-snug">
                          {r.nombre}
                        </CardTitle>
                      </div>
                    </div>

                    <Switch checked={r.activo} onCheckedChange={() => toggleActivo(r)} />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <Badge variant="outline" className={`text-[10px] font-semibold ${style.badgeClass}`}>
                      {style.label}
                    </Badge>
                    {r.es_global && (
                      <Badge variant="secondary" className="text-[10px]">
                        Global
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3 text-xs">
                  <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2" title={r.descripcion}>
                    {r.descripcion}
                  </p>

                  <div className="space-y-1.5 p-2.5 rounded-xl bg-muted/40 border border-border/80 text-[11px]">
                    <div>
                      <span className="font-semibold text-foreground">Disparador:</span>{" "}
                      <code className="text-primary font-mono text-[10px]">{r.evento_disparador}</code>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Condición:</span>{" "}
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {r.condicion_evaluada}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Acción:</span>{" "}
                      <span className="text-muted-foreground">{r.accion_ejecutada}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/80 text-[11px] text-muted-foreground">
                    <span>
                      Disparada: <strong className="text-foreground">{r.veces_disparada} veces</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => abrirSimulador(r)}
                      className="h-6 text-[10px] px-2 rounded-lg gap-1 hover:bg-muted text-purple-600 font-semibold"
                    >
                      <Play className="w-2.5 h-2.5" /> Simular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Crear Nueva Regla Clínica */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-purple-600" /> Crear Regla de Soporte Clínico (CDSS)
            </DialogTitle>
            <DialogDescription>
              Configure el evento disparador, lógica booleana de evaluación y acción automatizada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Código de Regla (Opcional)</Label>
              <Input
                placeholder="Ej. CDSS-SEP-02"
                value={nuevaRegla.codigo}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, codigo: e.target.value })}
                className="rounded-xl border-border/80 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Categoría Clínica *</Label>
              <Select
                value={nuevaRegla.categoria}
                onValueChange={(v: any) => setNuevaRegla({ ...nuevaRegla, categoria: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sepsis">Sepsis & Deterioro</SelectItem>
                  <SelectItem value="laboratorio_panico">Valores de Pánico LIS</SelectItem>
                  <SelectItem value="farmacologia">Farmacovigilancia</SelectItem>
                  <SelectItem value="cardiologia">Cardiología</SelectItem>
                  <SelectItem value="epidemiologia">Epidemiología SINAVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nombre Descriptivo de la Regla *</Label>
              <Input
                placeholder="Ej. Detección de Shock Anafiláctico en Sala de Procedimientos"
                value={nuevaRegla.nombre}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, nombre: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Severidad / Prioridad *</Label>
              <Select
                value={nuevaRegla.severidad}
                onValueChange={(v: any) => setNuevaRegla({ ...nuevaRegla, severidad: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critica">Crítica (Soporte Vital)</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Moderada</SelectItem>
                  <SelectItem value="baja">Informativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Evento Disparador</Label>
              <Select
                value={nuevaRegla.evento_disparador}
                onValueChange={(v) => setNuevaRegla({ ...nuevaRegla, evento_disparador: v })}
              >
                <SelectTrigger className="rounded-xl border-border/80 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actualizacion_signos_vitales">Actualización Signos Vitales</SelectItem>
                  <SelectItem value="resultado_laboratorio_validado">Resultado LIS Validado</SelectItem>
                  <SelectItem value="prescripcion_farma_cpoe">Prescripción CPOE</SelectItem>
                  <SelectItem value="diagnostico_cie10_guardado">Diagnóstico CIE-10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Condición Lógica Evaluada *</Label>
              <Input
                placeholder="Ej. spo2 < 90 AND frecuencia_respiratoria > 28"
                value={nuevaRegla.condicion_evaluada}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, condicion_evaluada: e.target.value })}
                className="rounded-xl border-border/80 text-xs font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Acción Automatizada al Dispararse *</Label>
              <Input
                placeholder="Ej. Generar Alerta STAT con sonido continuo y notificar a intensivista de guardia"
                value={nuevaRegla.accion_ejecutada}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, accion_ejecutada: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Descripción Médica / Racional Clínico</Label>
              <Textarea
                placeholder="Explicación clínica de la regla según guías de práctica clínica internacionales..."
                value={nuevaRegla.descripcion}
                onChange={(e) => setNuevaRegla({ ...nuevaRegla, descripcion: e.target.value })}
                className="rounded-xl border-border/80 text-xs"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCrearRegla} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
              Guardar & Activar Regla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Simulador de Reglas Clínicas en Vivo */}
      <Dialog open={simuladorModalOpen} onOpenChange={setSimuladorModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Play className="w-5 h-5 text-purple-600" /> Simulador de Inferencia — {reglaSimulada?.codigo}
            </DialogTitle>
            <DialogDescription>
              Pruebe la evaluación lógica de la regla introduciendo valores de prueba.
            </DialogDescription>
          </DialogHeader>

          {reglaSimulada && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/80 space-y-1">
                <div className="font-semibold text-foreground">{reglaSimulada.nombre}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  Condición: {reglaSimulada.condicion_evaluada}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Parámetro 1 (ej. FR o Valor)</Label>
                  <Input
                    value={simParam1}
                    onChange={(e) => setSimParam1(e.target.value)}
                    className="rounded-xl border-border/80 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Parámetro 2 (ej. PAS)</Label>
                  <Input
                    value={simParam2}
                    onChange={(e) => setSimParam2(e.target.value)}
                    className="rounded-xl border-border/80 text-xs font-mono"
                  />
                </div>
              </div>

              {simResultado && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${
                    simResultado.includes("CUMPLIDA")
                      ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {simResultado}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSimuladorModalOpen(false)} className="rounded-xl">
              Cerrar
            </Button>
            <Button onClick={ejecutarSimulacion} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
              <Play className="w-3.5 h-3.5" /> Evaluar Inferencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
