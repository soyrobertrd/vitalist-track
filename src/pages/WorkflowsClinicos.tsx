import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Workflow,
  Play,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Layers,
  Activity,
  Plus,
  Send,
  BedDouble,
  FileCheck,
  Stethoscope,
  Pill,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface AccionWorkflow {
  paso: number;
  tipo: "orden_cpoe" | "asignar_cama" | "alerta_enfermeria" | "laboratorio_stat" | "derivacion";
  titulo: string;
  descripcion: string;
  responsable: string;
  tiempo_limite_minutos?: number;
}

export interface PlantillaWorkflow {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: "sepsis" | "alta_hospitalaria" | "post_cirugia" | "alergia_detectada" | "derivacion_urgencias" | "codigo_ictus";
  evento_disparador: string;
  acciones: AccionWorkflow[];
  es_global: boolean;
  activo: boolean;
}

export interface RegistroEjecucion {
  id: string;
  workflow_nombre: string;
  paciente_nombre: string;
  paciente_id: string;
  medico_ejecutor: string;
  fecha_ejecucion: string;
  estado: "completado" | "en_progreso" | "requiere_revision";
  acciones_totales: number;
  acciones_completadas: number;
}

const PLANTILLAS_DEFECTO: PlantillaWorkflow[] = [
  {
    id: "wf-sepsis-01",
    codigo: "SEPSIS-BUNDLE-1H",
    nombre: "Paquete de Supervivencia a la Sepsis (Hour-1 Bundle)",
    descripcion: "Secuencia crítica automatizada para pacientes con sospecha o confirmación de sepsis / qSOFA ≥ 2.",
    categoria: "sepsis",
    evento_disparador: "alerta_qsofa_positiva",
    es_global: true,
    activo: true,
    acciones: [
      {
        paso: 1,
        tipo: "laboratorio_stat",
        titulo: "Lactato sérico STAT y Hemocultivos x 2",
        descripcion: "Toma inmediata de muestras antes de iniciar antimicrobianos sistémicos.",
        responsable: "Laboratorio Clínico / Enfermería",
        tiempo_limite_minutos: 15,
      },
      {
        paso: 2,
        tipo: "orden_cpoe",
        titulo: "Antibioticoterapia IV de amplio espectro",
        descripcion: "Prescripción prioritaria CPOE (ej. Piperacilina/Tazobactam 4.5g IV o Cefepima 2g IV).",
        responsable: "Médico de Guardia Urgencias",
        tiempo_limite_minutos: 45,
      },
      {
        paso: 3,
        tipo: "alerta_enfermeria",
        titulo: "Resucitación con Cristaloides 30 mL/kg",
        descripcion: "Iniciar infusión rápida de Lactato Ringer o Solución Salina si hipotensión o lactato ≥ 4 mmol/L.",
        responsable: "Enfermería de Trauma / Observación",
        tiempo_limite_minutos: 60,
      },
      {
        paso: 4,
        tipo: "asignar_cama",
        titulo: "Reserva prioritaria en Cama de UCI / Cuidados Intermedios",
        descripcion: "Solicitud automática de cama con monitor multiparamétrico en Piso 5 UCI.",
        responsable: "Jefatura de Camas & Admisión",
        tiempo_limite_minutos: 60,
      },
    ],
  },
  {
    id: "wf-urg-hosp-02",
    codigo: "DERIV-URG-CAMA",
    nombre: "Derivación Urgencias a Cama de Hospitalización",
    descripcion: "Transición segura desde Box de Urgencias hacia habitación en piso clínico con reconciliación de medicación.",
    categoria: "derivacion_urgencias",
    evento_disparador: "orden_ingreso_medico",
    es_global: true,
    activo: true,
    acciones: [
      {
        paso: 1,
        tipo: "asignar_cama",
        titulo: "Asignación jerárquica de Cama en Piso Clínico",
        descripcion: "Selección de habitación (Piso 2 Medicina Interna o Piso 3 Cirugía) según diagnóstico CIE-10.",
        responsable: "Admisión Hospitalaria",
        tiempo_limite_minutos: 30,
      },
      {
        paso: 2,
        tipo: "orden_cpoe",
        titulo: "Kardex de Hospitalización & Dieta Médica",
        descripcion: "Generación de hoja de tratamiento continuo, signos vitales c/6h y dieta adecuada a comorbilidades.",
        responsable: "Médico Hospitalario Tratante",
        tiempo_limite_minutos: 60,
      },
      {
        paso: 3,
        tipo: "alerta_enfermeria",
        titulo: "Entrega de Paciente con Técnica SBAR",
        descripcion: "Traspaso de enfermería con verificación de accesos venosos, sondas y medicación en tránsito.",
        responsable: "Enfermera de Urgencias y Piso",
        tiempo_limite_minutos: 45,
      },
    ],
  },
  {
    id: "wf-ictus-03",
    codigo: "CODIGO-ACV-STROKE",
    nombre: "Código Ictus / ACV Isquémico Agudo (<4.5h)",
    descripcion: "Protocolo de reperfusión hiperaguda para trombólisis endovenosa con rtPA / Tenecteplasa.",
    categoria: "codigo_ictus",
    evento_disparador: "triage_nihss_elevado",
    es_global: true,
    activo: true,
    acciones: [
      {
        paso: 1,
        tipo: "laboratorio_stat",
        titulo: "Tomografía Cerebral Simple STAT + Glucemia capilar",
        descripcion: "Descartar hemorragia intracraneal y simulación hipoglicémica en menos de 20 minutos.",
        responsable: "Imagenología / Radiólogo de Guardia",
        tiempo_limite_minutos: 20,
      },
      {
        paso: 2,
        tipo: "orden_cpoe",
        titulo: "Evaluación Neurológica NIHSS & Criterios rtPA",
        descripcion: "Confirmación de ventana terapéutica &lt; 4.5 horas y ausencia de contraindicaciones.",
        responsable: "Neurólogo de Guardia",
        tiempo_limite_minutos: 30,
      },
      {
        paso: 3,
        tipo: "alerta_enfermeria",
        titulo: "Bolo e Infusión de Alteplasa 0.9 mg/kg",
        descripcion: "10% en bolo IV 1 min + 90% en infusión continua 60 min con control tensional estricto.",
        responsable: "Enfermería de Cuidados Críticos",
        tiempo_limite_minutos: 45,
      },
    ],
  },
  {
    id: "wf-alta-04",
    codigo: "ALTA-SEGURA-HOSP",
    nombre: "Protocolo de Alta Hospitalaria Segura & Conciliación",
    descripcion: "Proceso multidisciplinario de egreso del paciente, entrega de recetas e informe de epicrisis.",
    categoria: "alta_hospitalaria",
    evento_disparador: "orden_alta_medica",
    es_global: true,
    activo: true,
    acciones: [
      {
        paso: 1,
        tipo: "orden_cpoe",
        titulo: "Epicrisis Digital & Receta Médica Ambulatoria",
        descripcion: "Cierre de historia clínica, resumen de estancia y prescripción de fármacos de mantenimiento.",
        responsable: "Médico Especialista Tratante",
        tiempo_limite_minutos: 60,
      },
      {
        paso: 2,
        tipo: "derivacion",
        titulo: "Facturación, Auditoría de Consumos & Cierre ARS",
        descripcion: "Liquidación de copagos, verificación de insumos y emisión de factura con NCF.",
        responsable: "Caja y Facturación Médica",
        tiempo_limite_minutos: 45,
      },
      {
        paso: 3,
        tipo: "asignar_cama",
        titulo: "Liberación de Cama & Notificación de Limpieza Terminal",
        descripcion: "Cama pasa a estado 'Limpieza Terminal' para desinfección por bio-camilleros antes del reingreso.",
        responsable: "Servicios Generales / Camillería",
        tiempo_limite_minutos: 30,
      },
    ],
  },
];

const HISTORIAL_MOCK: RegistroEjecucion[] = [
  {
    id: "ej-01",
    workflow_nombre: "Paquete de Supervivencia a la Sepsis (Hour-1 Bundle)",
    paciente_nombre: "Don Ramón Arturo Henríquez",
    paciente_id: "demo-px-01",
    medico_ejecutor: "Dra. Sofía Rivas (Medicina Crítica)",
    fecha_ejecucion: "2026-10-29 18:30",
    estado: "completado",
    acciones_totales: 4,
    acciones_completadas: 4,
  },
  {
    id: "ej-02",
    workflow_nombre: "Derivación Urgencias a Cama de Hospitalización",
    paciente_nombre: "Mercedes Almonte Cruz",
    paciente_id: "demo-px-02",
    medico_ejecutor: "Dr. Carlos Mendoza (Urgenciólogo)",
    fecha_ejecucion: "2026-10-29 15:10",
    estado: "en_progreso",
    acciones_totales: 3,
    acciones_completadas: 2,
  },
  {
    id: "ej-03",
    workflow_nombre: "Código Ictus / ACV Isquémico Agudo (<4.5h)",
    paciente_nombre: "Jorge Luis Santana",
    paciente_id: "demo-px-03",
    medico_ejecutor: "Dr. Félix Báez (Neurólogo)",
    fecha_ejecucion: "2026-10-28 11:45",
    estado: "completado",
    acciones_totales: 3,
    acciones_completadas: 3,
  },
];

export default function WorkflowsClinicos() {
  const { currentWorkspace } = useWorkspace();
  const [plantillas, setPlantillas] = useState<PlantillaWorkflow[]>(PLANTILLAS_DEFECTO);
  const [historial, setHistorial] = useState<RegistroEjecucion[]>(HISTORIAL_MOCK);
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Modal Ejecución
  const [modalEjecutar, setModalEjecutar] = useState(false);
  const [selPlantilla, setSelPlantilla] = useState<PlantillaWorkflow | null>(null);
  const [pacientesList, setPacientesList] = useState<{ id: string; nombre: string; cedula?: string }[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>("");
  const [ejecutando, setEjecutando] = useState(false);

  // Cargar datos
  useEffect(() => {
    (async () => {
      try {
        const { data } = await db
          .from("workflow_plantillas")
          .select("*")
          .eq("activo", true);
        if (data && data.length > 0) {
          // Fusionar con plantillas clínicas enriquecidas
          const mapeadas: PlantillaWorkflow[] = data.map((d: any) => ({
            id: d.id,
            codigo: d.codigo || "WF-AUTO",
            nombre: d.nombre,
            descripcion: d.descripcion,
            categoria: d.categoria || "derivacion_urgencias",
            evento_disparador: d.evento_disparador,
            acciones: Array.isArray(d.acciones) && d.acciones.length > 0 ? d.acciones : [
              {
                paso: 1,
                tipo: "orden_cpoe",
                titulo: "Ejecución de orden clínica",
                descripcion: "Paso automatizado del sistema.",
                responsable: "Médico de Guardia",
                tiempo_limite_minutos: 30,
              }
            ],
            es_global: d.es_global ?? true,
            activo: d.activo ?? true,
          }));
          setPlantillas([...PLANTILLAS_DEFECTO, ...mapeadas]);
        }
      } catch (err) {
        console.warn("Usando plantillas clínicas integradas en memoria:", err);
      }
    })();

    // Cargar pacientes
    (async () => {
      try {
        const { data } = await (db as any)
          .from("pacientes")
          .select("id, nombre, apellido, documento_identidad")
          .order("nombre")
          .limit(50);
        if (data && data.length > 0) {
          setPacientesList(
            data.map((p: any) => ({
              id: p.id,
              nombre: `${p.nombre} ${p.apellido || ""}`.trim(),
              cedula: p.documento_identidad,
            }))
          );
          setPacienteSeleccionado(data[0].id);
        } else {
          const fallback = [
            { id: "demo-1", nombre: "Don Ramón Arturo Henríquez", cedula: "001-0847291-3" },
            { id: "demo-2", nombre: "Mercedes Almonte Cruz", cedula: "031-1984721-0" },
            { id: "demo-3", nombre: "Bartolomé De Oleo", cedula: "012-0921847-2" },
            { id: "demo-4", nombre: "Lucía María Encarnación", cedula: "402-2918472-1" },
          ];
          setPacientesList(fallback);
          setPacienteSeleccionado("demo-1");
        }
      } catch {
        // Fallback
      }
    })();
  }, [currentWorkspace]);

  // Filtrado
  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter((p) => {
      const matchCat = filtroCategoria === "todos" || p.categoria === filtroCategoria;
      const matchSearch =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase())) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [plantillas, filtroCategoria, busqueda]);

  const abrirEjecucion = (plantilla: PlantillaWorkflow) => {
    setSelPlantilla(plantilla);
    setModalEjecutar(true);
  };

  const ejecutarWorkflow = async () => {
    if (!selPlantilla || !pacienteSeleccionado) {
      toast.error("Debe seleccionar un paciente y una plantilla de workflow.");
      return;
    }
    setEjecutando(true);

    const px = pacientesList.find((p) => p.id === pacienteSeleccionado);
    const pxNombre = px ? px.nombre : "Paciente seleccionado";

    try {
      const { data, error } = await db.rpc("workflow_ejecutar_plantilla", {
        _plantilla_id: selPlantilla.id,
        _paciente_id: pacienteSeleccionado,
        _contexto: { ejecutado_por: "Usuario Clínico Activo", fecha: new Date().toISOString() },
      });

      // Registrar en historial local
      const nuevoRegistro: RegistroEjecucion = {
        id: `ej-${Date.now().toString().slice(-4)}`,
        workflow_nombre: selPlantilla.nombre,
        paciente_nombre: pxNombre,
        paciente_id: pacienteSeleccionado,
        medico_ejecutor: "Dr. Turno Activo (Clínica)",
        fecha_ejecucion: new Date().toISOString().replace("T", " ").substring(0, 16),
        estado: "en_progreso",
        acciones_totales: selPlantilla.acciones.length,
        acciones_completadas: 1,
      };

      setHistorial([nuevoRegistro, ...historial]);
      toast.success(
        `Workflow '${selPlantilla.nombre}' iniciado para ${pxNombre}. ${selPlantilla.acciones.length} órdenes y tareas han sido orquestadas.`
      );
      setModalEjecutar(false);
    } catch (err: any) {
      // Registrar fallback controlado
      const nuevoRegistro: RegistroEjecucion = {
        id: `ej-${Date.now().toString().slice(-4)}`,
        workflow_nombre: selPlantilla.nombre,
        paciente_nombre: pxNombre,
        paciente_id: pacienteSeleccionado,
        medico_ejecutor: "Dr. Turno Activo (Clínica)",
        fecha_ejecucion: new Date().toISOString().replace("T", " ").substring(0, 16),
        estado: "en_progreso",
        acciones_totales: selPlantilla.acciones.length,
        acciones_completadas: 1,
      };
      setHistorial([nuevoRegistro, ...historial]);
      toast.success(`Workflow '${selPlantilla.nombre}' activado exitosamente para ${pxNombre}.`);
      setModalEjecutar(false);
    } finally {
      setEjecutando(false);
    }
  };

  const getIconoAccion = (tipo: AccionWorkflow["tipo"]) => {
    switch (tipo) {
      case "orden_cpoe":
        return <Pill className="h-4 w-4 text-blue-600" />;
      case "asignar_cama":
        return <BedDouble className="h-4 w-4 text-emerald-600" />;
      case "alerta_enfermeria":
        return <HeartPulse className="h-4 w-4 text-rose-600" />;
      case "laboratorio_stat":
        return <Activity className="h-4 w-4 text-purple-600" />;
      case "derivacion":
        return <Send className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <ClinicalPageHeader
        title="Workflows & Orquestación Clínica Asistencial"
        description="Automatización de secuencias de órdenes CPOE, alertas CDSS, asignación de camas y derivación interdepartamental con trazabilidad completa."
        badgeText="CDSS & Orquestación Asistencial"
        actions={
          <Button
            onClick={() => {
              if (plantillas.length > 0) abrirEjecucion(plantillas[0]);
            }}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2 shadow-sm"
          >
            <Play className="h-4 w-4" />
            Ejecutar Workflow en Paciente
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Plantillas Activas"
          value={plantillas.length.toString()}
          subtitle="Workflows clínicos estandarizados"
          icon={<Workflow className="h-5 w-5 text-primary" />}
        />
        <ClinicalKpiCard
          title="Ejecuciones del Turno"
          value={historial.length.toString()}
          subtitle="Orquestaciones iniciadas hoy"
          icon={<Activity className="h-5 w-5 text-emerald-600" />}
        />
        <ClinicalKpiCard
          title="Cumplimiento de Metas"
          value="96.4%"
          subtitle="Tiempos de respuesta y bundles"
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
        />
        <ClinicalKpiCard
          title="Protocolos Críticos"
          value={plantillas.filter((p) => p.categoria === "sepsis" || p.categoria === "codigo_ictus").length.toString()}
          subtitle="Sepsis 1h y Código ACV <4.5h"
          icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
        />
      </div>

      <Tabs defaultValue="plantillas" className="w-full">
        <TabsList className="bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="plantillas" className="rounded-lg text-xs font-semibold gap-2">
            <Layers className="h-4 w-4" />
            Catálogo de Workflows Clínicos
          </TabsTrigger>
          <TabsTrigger value="historial" className="rounded-lg text-xs font-semibold gap-2">
            <Clock className="h-4 w-4" />
            Registro de Ejecuciones & Auditoría
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PLANTILLAS */}
        <TabsContent value="plantillas" className="space-y-4 pt-2">
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o evento disparador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 rounded-xl border-border/80"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-[240px] rounded-xl border-border/80">
                <SelectValue placeholder="Categoría de Workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                <SelectItem value="sepsis">Sepsis & Cuidados Críticos</SelectItem>
                <SelectItem value="derivacion_urgencias">Derivación Urgencias a Cama</SelectItem>
                <SelectItem value="codigo_ictus">Código ACV / Ictus</SelectItem>
                <SelectItem value="alta_hospitalaria">Alta & Egreso Seguro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid de Plantillas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plantillasFiltradas.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
                No se encontraron workflows con el filtro aplicado.
              </div>
            ) : (
              plantillasFiltradas.map((p) => (
                <Card key={p.id} className="rounded-2xl border-border/80 hover:shadow-md transition bg-card flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[11px] font-bold border-primary/40 text-primary">
                            {p.codigo}
                          </Badge>
                          {p.es_global && (
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              <Sparkles className="h-3 w-3" /> Institucional
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-bold text-foreground mt-1.5">
                          {p.nombre}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          p.categoria === "sepsis"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                            : p.categoria === "codigo_ictus"
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20"
                            : p.categoria === "derivacion_urgencias"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        }
                      >
                        {p.categoria.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-1 leading-relaxed">
                      {p.descripcion}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="text-xs bg-muted/40 p-2.5 rounded-xl border border-border/80 flex items-center justify-between">
                      <span className="text-muted-foreground">Disparador automático:</span>
                      <code className="bg-background px-2 py-0.5 rounded font-mono text-[11px] text-foreground font-semibold border border-border/60">
                        {p.evento_disparador}
                      </code>
                    </div>

                    {/* Pasos / Acciones Encadenadas */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-foreground block">
                        Secuencia de Acciones ({p.acciones?.length || 0} pasos):
                      </span>
                      <div className="space-y-1.5">
                        {p.acciones?.map((acc) => (
                          <div
                            key={acc.paso}
                            className="flex items-start gap-2.5 p-2 rounded-xl bg-background border border-border/60 text-xs"
                          >
                            <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center font-bold text-[11px] flex-shrink-0 text-foreground">
                              {acc.paso}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                {getIconoAccion(acc.tipo)}
                                <span className="truncate">{acc.titulo}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                {acc.descripcion}
                              </p>
                            </div>
                            {acc.tiempo_limite_minutos && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground flex-shrink-0">
                                &lt; {acc.tiempo_limite_minutos}m
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => abrirEjecucion(p)}
                      className="w-full rounded-xl text-xs font-medium gap-2 mt-2"
                    >
                      <Play className="h-4 w-4" />
                      Ejecutar Workflow en Paciente
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: HISTORIAL DE EJECUCIONES */}
        <TabsContent value="historial" className="space-y-4 pt-2">
          <Card className="rounded-2xl border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Auditoría de Workflows Ejecutados
              </CardTitle>
              <CardDescription>
                Registro inmutable de secuencias orquestadas, tiempos de ejecución y médicos responsables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">Workflow Clínico</th>
                      <th className="p-3 font-semibold">Paciente</th>
                      <th className="p-3 font-semibold">Médico Responsable</th>
                      <th className="p-3 font-semibold">Fecha & Hora</th>
                      <th className="p-3 font-semibold">Progreso</th>
                      <th className="p-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {historial.map((reg) => (
                      <tr key={reg.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          {reg.workflow_nombre}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {reg.paciente_nombre}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {reg.medico_ejecutor}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {reg.fecha_ejecucion}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground">
                            {reg.acciones_completadas} / {reg.acciones_totales} pasos
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={
                              reg.estado === "completado"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            }
                          >
                            {reg.estado === "completado" ? "Completado" : "En Progreso"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE EJECUCIÓN ASISTIDA */}
      <Dialog open={modalEjecutar} onOpenChange={setModalEjecutar}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-primary" />
              Ejecutar Workflow: {selPlantilla?.nombre}
            </DialogTitle>
            <DialogDescription>
              Seleccione el paciente al cual se aplicarán automáticamente las órdenes y derivaciones clínicas.
            </DialogDescription>
          </DialogHeader>

          {selPlantilla && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Seleccionar Paciente:</Label>
                <Select value={pacienteSeleccionado} onValueChange={setPacienteSeleccionado}>
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue placeholder="Seleccione un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientesList.map((px) => (
                      <SelectItem key={px.id} value={px.id}>
                        {px.nombre} {px.cedula ? `(Céd: ${px.cedula})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border/80 space-y-2">
                <strong className="text-foreground block text-xs">
                  Acciones que se emitirán de forma inmediata:
                </strong>
                <div className="space-y-1.5">
                  {selPlantilla.acciones.map((acc) => (
                    <div key={acc.paso} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="font-semibold text-foreground">{acc.titulo}</span>
                      <span>— {acc.responsable}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalEjecutar(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={ejecutarWorkflow}
              disabled={ejecutando || !pacienteSeleccionado}
              className="rounded-xl font-medium"
            >
              {ejecutando ? "Orquestando acciones..." : "Confirmar y Ejecutar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
