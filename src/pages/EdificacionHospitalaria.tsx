import { useState } from "react";
import {
  EdificioHospital,
  CamaHospital,
  EstadoCama,
} from "@/components/edificacion/edificacion-types";
import { MOCK_EDIFICIOS_HOSPITAL } from "@/components/edificacion/edificacion-mock-data";
import { CensoCamasVisualTab } from "@/components/edificacion/CensoCamasVisualTab";
import { DirectorioAreasTab } from "@/components/edificacion/DirectorioAreasTab";
import { MapaEsquematicoPisosTab } from "@/components/edificacion/MapaEsquematicoPisosTab";
import { TrasladoCamaModal } from "@/components/edificacion/TrasladoCamaModal";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Bed,
  Layers,
  ArrowLeftRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

export default function EdificacionHospitalaria() {
  const [edificios, setEdificios] = useState<EdificioHospital[]>(MOCK_EDIFICIOS_HOSPITAL);
  const [activeTab, setActiveTab] = useState<string>("censo");

  // Aplanar todas las camas para el censo
  const todasLasCamas = edificios.flatMap(ed =>
    ed.pisos.flatMap(p => p.alas.flatMap(a => a.camas))
  );

  const [camaSeleccionadaParaTraslado, setCamaSeleccionadaParaTraslado] = useState<CamaHospital | null>(null);
  const [modalTrasladoOpen, setModalTrasladoOpen] = useState(false);

  // Manejador de cambio de estado de cama (ej. marcar como limpia / enviar a desinfección)
  const handleCambiarEstadoCama = (camaId: string, nuevoEstado: EstadoCama) => {
    setEdificios(prevEd =>
      prevEd.map(ed => ({
        ...ed,
        pisos: ed.pisos.map(p => ({
          ...p,
          alas: p.alas.map(a => ({
            ...a,
            camas: a.camas.map(c => (c.id === camaId ? { ...c, estado: nuevoEstado } : c)),
          })),
        })),
      }))
    );
  };

  // Manejador de traslado de paciente entre camas
  const handleConfirmarTraslado = (camaOrigenId: string, camaDestinoId: string, motivo: string) => {
    const camaOrigen = todasLasCamas.find(c => c.id === camaOrigenId);
    if (!camaOrigen || !camaOrigen.paciente) return;

    const pacienteTrasladado = { ...camaOrigen.paciente };

    setEdificios(prevEd =>
      prevEd.map(ed => ({
        ...ed,
        pisos: ed.pisos.map(p => ({
          ...p,
          alas: p.alas.map(a => ({
            ...a,
            camas: a.camas.map(c => {
              if (c.id === camaOrigenId) {
                // Cama origen queda en desinfección
                return { ...c, estado: "desinfeccion" as EstadoCama, paciente: undefined };
              }
              if (c.id === camaDestinoId) {
                // Cama destino queda ocupada con el paciente
                return { ...c, estado: "ocupada" as EstadoCama, paciente: pacienteTrasladado };
              }
              return c;
            }),
          })),
        })),
      }))
    );

    toast.success(`Traslado confirmado. Cama origen enviada a desinfección terminal.`);
  };

  // KPI Calculations
  const totalCamas = todasLasCamas.length;
  const camasLibres = todasLasCamas.filter(c => c.estado === "libre").length;
  const camasOcupadas = todasLasCamas.filter(c => c.estado === "ocupada" || c.estado === "aislamiento").length;
  const camasAislamiento = todasLasCamas.filter(c => c.estado === "aislamiento").length;
  const porcentajeOcupacion = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;

  const camasDisponibles = todasLasCamas.filter(c => c.estado === "libre");

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Edificación Hospitalaria & Censo de Camas"
        subtitle="Infraestructura intrahospitalaria por torres, pisos y servicios; censo visual en vivo y traslados"
        icon={Building2}
        variant="blue"
        badge="Gestión de Infraestructura Hospitalaria"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Capacidad Total de Camas"
          value={totalCamas}
          subtitle="Emergencias, UCI, Piso y Neonatología"
          icon={Bed}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Tasa de Ocupación"
          value={`${porcentajeOcupacion}%`}
          subtitle={`${camasOcupadas} camas ocupadas`}
          icon={Activity}
          variant={porcentajeOcupacion > 85 ? "rose" : "blue"}
          alert={porcentajeOcupacion > 85}
        />
        <ClinicalKpiCard
          title="Camas Libres Inmediatas"
          value={camasLibres}
          subtitle="Higienizadas y listas para ingreso"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Pacientes en Aislamiento"
          value={camasAislamiento}
          subtitle="Contacto, gotas y aerosoles"
          icon={ShieldAlert}
          variant="rose"
        />
      </div>

      {/* Tabs Principales de Edificación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="censo" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Bed className="h-4 w-4 text-blue-600" />
            Censo Visual de Camas en Vivo ({todasLasCamas.length})
          </TabsTrigger>
          <TabsTrigger value="directorio" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Building2 className="h-4 w-4 text-purple-600" />
            Directorio Tabular de Áreas & Servicios
          </TabsTrigger>
          <TabsTrigger value="plano" className="rounded-xl px-3.5 py-2 text-xs font-semibold gap-1.5">
            <Layers className="h-4 w-4 text-emerald-600" />
            Plano Esquemático de Pisos & Traslados
          </TabsTrigger>
        </TabsList>

        {/* 1. Censo Visual de Camas */}
        <TabsContent value="censo" className="space-y-4">
          <CensoCamasVisualTab
            camas={todasLasCamas}
            onIniciarTraslado={cama => {
              setCamaSeleccionadaParaTraslado(cama);
              setModalTrasladoOpen(true);
            }}
            onCambiarEstadoCama={handleCambiarEstadoCama}
          />
        </TabsContent>

        {/* 2. Directorio Tabular de Áreas */}
        <TabsContent value="directorio" className="space-y-4">
          <DirectorioAreasTab edificios={edificios} />
        </TabsContent>

        {/* 3. Plano Esquemático de Pisos */}
        <TabsContent value="plano" className="space-y-4">
          <MapaEsquematicoPisosTab
            edificio={edificios[0]}
            onIniciarTraslado={cama => {
              setCamaSeleccionadaParaTraslado(cama);
              setModalTrasladoOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Traslado de Cama */}
      <TrasladoCamaModal
        open={modalTrasladoOpen}
        onOpenChange={setModalTrasladoOpen}
        camaOrigen={camaSeleccionadaParaTraslado}
        camasDisponibles={camasDisponibles}
        onConfirmarTraslado={handleConfirmarTraslado}
      />
    </div>
  );
}
