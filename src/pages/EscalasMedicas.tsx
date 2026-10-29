import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Activity,
  Calculator,
  Brain,
  ShieldAlert,
  HeartPulse,
  Flame,
  Copy,
  AlertTriangle,
  History,
  User,
  Layers,
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { format } from "date-fns";
import { GlasgowTab } from "@/components/clinical/escalas/GlasgowTab";
import { BradenTab } from "@/components/clinical/escalas/BradenTab";
import { News2Tab } from "@/components/clinical/escalas/News2Tab";
import { EvaTab } from "@/components/clinical/escalas/EvaTab";
import { BarthelTab } from "@/components/clinical/escalas/BarthelTab";

export interface EscalaEvaluada {
  id: string;
  paciente_nombre: string;
  paciente_id?: string;
  escala: string;
  categoria: string;
  puntuacion: number | string;
  interpretacion: string;
  nivel_riesgo: "bajo" | "moderado" | "alto" | "critico";
  fecha: string;
  profesional: string;
  detalles?: string;
}

export default function EscalasMedicas() {
  const { currentWorkspace } = useWorkspace();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>("");
  const [historial, setHistorial] = useState<EscalaEvaluada[]>([
    {
      id: "ev-1",
      paciente_nombre: "María Altagracia Pérez",
      escala: "Glasgow (GCS)",
      categoria: "Neurología / Conciencia",
      puntuacion: "15/15",
      interpretacion: "Conciencia normal, alerta y orientada",
      nivel_riesgo: "bajo",
      fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
      profesional: "Dr. Carlos Mendoza (Neurología)",
      detalles: "Ocular: 4 | Verbal: 5 | Motor: 6",
    },
    {
      id: "ev-2",
      paciente_nombre: "Juan Antonio Morales",
      escala: "Braden",
      categoria: "Enfermería / Úlceras",
      puntuacion: "11/23",
      interpretacion: "Alto riesgo de úlceras por presión",
      nivel_riesgo: "alto",
      fecha: new Date(Date.now() - 3600000 * 12).toISOString(),
      profesional: "Lic. Ana Reyes (Enfermería)",
      detalles: "Movilidad limitada, humedad constante",
    },
    {
      id: "ev-3",
      paciente_nombre: "Elena Gómez",
      escala: "NEWS2",
      categoria: "Deterioro / Sepsis",
      puntuacion: "2/20",
      interpretacion: "Bajo riesgo de deterioro clínico agudo",
      nivel_riesgo: "bajo",
      fecha: new Date(Date.now() - 3600000 * 24).toISOString(),
      profesional: "Dra. Sofía Rivas (Medicina Interna)",
    },
  ]);

  const [activeTab, setActiveTab] = useState("glasgow");

  // Cargar pacientes
  useEffect(() => {
    if (!currentWorkspace) return;
    (supabase as any)
      .from("pacientes")
      .select("id, nombre, apellido")
      .eq("workspace_id", currentWorkspace.id)
      .eq("activo", true)
      .order("nombre")
      .limit(100)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPacientes(data);
          setPacienteSeleccionado(data[0].id);
        } else {
          setPacientes([
            { id: "demo-1", nombre: "María Altagracia", apellido: "Pérez" },
            { id: "demo-2", nombre: "Juan Antonio", apellido: "Morales" },
            { id: "demo-3", nombre: "Elena", apellido: "Gómez" },
            { id: "demo-4", nombre: "Roberto", apellido: "Hernández" },
          ]);
          setPacienteSeleccionado("demo-1");
        }
      });
  }, [currentWorkspace]);

  // Guardar escala
  const handleGuardarEscala = (
    nombreEscala: string,
    categoria: string,
    puntuacion: string | number,
    interpretacion: string,
    riesgo: "bajo" | "moderado" | "alto" | "critico",
    detalles?: string
  ) => {
    const pacienteObj = pacientes.find(p => p.id === pacienteSeleccionado);
    const nombreCompleto = pacienteObj ? `${pacienteObj.nombre} ${pacienteObj.apellido}` : "Paciente en evaluación";

    const nuevaEvaluacion: EscalaEvaluada = {
      id: `ev-${Date.now()}`,
      paciente_id: pacienteSeleccionado,
      paciente_nombre: nombreCompleto,
      escala: nombreEscala,
      categoria,
      puntuacion,
      interpretacion,
      nivel_riesgo: riesgo,
      fecha: new Date().toISOString(),
      profesional: "Equipo Clínico Evaluador",
      detalles,
    };

    setHistorial([nuevaEvaluacion, ...historial]);
    toast.success(`Escala ${nombreEscala} registrada para ${nombreCompleto}`);
  };

  // Copiar al portapapeles para nota de evolución
  const handleCopiarResumen = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Resumen clínico copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Escalas Médicas & Calculadoras Clínicas"
        subtitle="Evaluación estandarizada por especialidad: Neurología, Deterioro Sepsis, Braden, Dolor EVA y Barthel"
        icon={Calculator}
        variant="purple"
        badge="Catálogo Clínico Internacional"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Paciente activo:</span>
            <Select value={pacienteSeleccionado} onValueChange={setPacienteSeleccionado}>
              <SelectTrigger className="w-56 rounded-xl border-border/80 text-xs">
                <SelectValue placeholder="Seleccionar paciente..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {pacientes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Escalas Disponibles"
          value="8"
          subtitle="GCS, Braden, NEWS2, EVA, Barthel..."
          icon={Layers}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Evaluaciones Registradas"
          value={historial.length}
          subtitle="En expediente clínico"
          icon={Activity}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Casos Alto Riesgo"
          value={historial.filter(h => h.nivel_riesgo === "alto" || h.nivel_riesgo === "critico").length}
          subtitle="Atención y alertas preventivas"
          icon={AlertTriangle}
          variant="rose"
          alert={historial.some(h => h.nivel_riesgo === "alto" || h.nivel_riesgo === "critico")}
        />
        <ClinicalKpiCard
          title="Paciente Actual"
          value={pacientes.find(p => p.id === pacienteSeleccionado)?.nombre?.split(" ")[0] || "Seleccionar"}
          subtitle="Asignado para cálculo directo"
          icon={User}
          variant="emerald"
        />
      </div>

      {/* Contenido Principal con Tabs de Escalas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="glasgow" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Brain className="h-4 w-4 text-purple-500" />
            Glasgow (GCS)
          </TabsTrigger>
          <TabsTrigger value="braden" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Braden (UPP)
          </TabsTrigger>
          <TabsTrigger value="news2" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            NEWS2 (Sepsis/Deterioro)
          </TabsTrigger>
          <TabsTrigger value="eva" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            Dolor EVA (0-10)
          </TabsTrigger>
          <TabsTrigger value="barthel" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Activity className="h-4 w-4 text-emerald-500" />
            Barthel (Dependencia)
          </TabsTrigger>
          <TabsTrigger value="historial" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <History className="h-4 w-4 text-blue-500" />
            Historial de Evaluaciones ({historial.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. GLASGOW */}
        <TabsContent value="glasgow" className="space-y-4">
          <GlasgowTab onGuardar={handleGuardarEscala} onCopiar={handleCopiarResumen} />
        </TabsContent>

        {/* 2. BRADEN */}
        <TabsContent value="braden" className="space-y-4">
          <BradenTab onGuardar={handleGuardarEscala} />
        </TabsContent>

        {/* 3. NEWS2 */}
        <TabsContent value="news2" className="space-y-4">
          <News2Tab onGuardar={handleGuardarEscala} />
        </TabsContent>

        {/* 4. DOLOR EVA */}
        <TabsContent value="eva" className="space-y-4">
          <EvaTab onGuardar={handleGuardarEscala} />
        </TabsContent>

        {/* 5. BARTHEL */}
        <TabsContent value="barthel" className="space-y-4">
          <BarthelTab onGuardar={handleGuardarEscala} />
        </TabsContent>

        {/* 6. HISTORIAL DE EVALUACIONES */}
        <TabsContent value="historial" className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <CardHeader className="bg-muted/20 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Registro Histórico de Escalas Clínicas</CardTitle>
                  <p className="text-xs text-muted-foreground">Evaluaciones completadas vinculadas a expedientes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {historial.map(item => (
                  <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{item.escala}</span>
                        <Badge variant="outline" className="text-[10px] rounded-full">
                          {item.categoria}
                        </Badge>
                        <Badge
                          className={`text-[10px] rounded-full border-0 ${
                            item.nivel_riesgo === "critico"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : item.nivel_riesgo === "alto"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {item.nivel_riesgo.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paciente: <strong className="text-foreground">{item.paciente_nombre}</strong> • {item.interpretacion}
                      </p>
                      {item.detalles && <p className="text-[11px] text-muted-foreground font-mono">{item.detalles}</p>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-bold text-base text-primary font-mono tabular-nums">{item.puntuacion}</span>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(item.fecha), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl h-8 w-8 p-0"
                        title="Copiar resumen"
                        onClick={() =>
                          handleCopiarResumen(
                            `${item.escala} para ${item.paciente_nombre}: ${item.puntuacion} - ${item.interpretacion} (${format(new Date(item.fecha), "dd/MM/yyyy HH:mm")})`
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
