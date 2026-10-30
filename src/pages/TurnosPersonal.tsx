import { useState } from "react";
import {
  ProfesionalTurno,
  TipoTurno,
  SolicitudIntercambio,
} from "@/components/turnos/turnos-types";
import { CuadranteTurnosTab } from "@/components/turnos/CuadranteTurnosTab";
import { IntercambioGuardiasModal } from "@/components/turnos/IntercambioGuardiasModal";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ShieldCheck, Clock, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function TurnosPersonal() {
  const [profesionales, setProfesionales] = useState<ProfesionalTurno[]>([
    {
      id: "p-1",
      nombre: "Dr. Carlos Mendoza",
      especialidad: "Neurología / Emergencias",
      servicio: "Emergencias",
      rol: "medico",
      turnosPorDia: {
        "2024-10-28": "G24",
        "2024-10-29": "L",
        "2024-10-30": "M",
        "2024-10-31": "T",
        "2024-11-01": "G24",
        "2024-11-02": "L",
        "2024-11-03": "M",
      },
    },
    {
      id: "p-2",
      nombre: "Dra. Sofía Rivas",
      especialidad: "Medicina Interna",
      servicio: "Emergencias",
      rol: "medico",
      turnosPorDia: {
        "2024-10-28": "M",
        "2024-10-29": "M",
        "2024-10-30": "T",
        "2024-10-31": "G24",
        "2024-11-01": "L",
        "2024-11-02": "M",
        "2024-11-03": "T",
      },
    },
    {
      id: "p-3",
      nombre: "Dr. Marcos Tavárez",
      especialidad: "Medicina Intensiva (UCI)",
      servicio: "UCI",
      rol: "medico",
      turnosPorDia: {
        "2024-10-28": "G24",
        "2024-10-29": "L",
        "2024-10-30": "G24",
        "2024-10-31": "L",
        "2024-11-01": "M",
        "2024-11-02": "T",
        "2024-11-03": "N",
      },
    },
    {
      id: "p-4",
      nombre: "Lic. Andrea Morales",
      especialidad: "Enfermería Crítica",
      servicio: "UCI",
      rol: "enfermero",
      turnosPorDia: {
        "2024-10-28": "M",
        "2024-10-29": "T",
        "2024-10-30": "N",
        "2024-10-31": "L",
        "2024-11-01": "M",
        "2024-11-02": "T",
        "2024-11-03": "N",
      },
    },
    {
      id: "p-5",
      nombre: "Lic. Miguel Cruz",
      especialidad: "Enfermería Emergencias",
      servicio: "Emergencias",
      rol: "enfermero",
      turnosPorDia: {
        "2024-10-28": "T",
        "2024-10-29": "N",
        "2024-10-30": "L",
        "2024-10-31": "M",
        "2024-11-01": "T",
        "2024-11-02": "N",
        "2024-11-03": "L",
      },
    },
    {
      id: "p-6",
      nombre: "Lic. Raquel Soto",
      especialidad: "Enfermería Hospitalización",
      servicio: "Hospitalización Piso",
      rol: "enfermero",
      turnosPorDia: {
        "2024-10-28": "M",
        "2024-10-29": "M",
        "2024-10-30": "T",
        "2024-10-31": "T",
        "2024-11-01": "N",
        "2024-11-02": "L",
        "2024-11-03": "L",
      },
    },
  ]);

  const [solicitudes, setSolicitudes] = useState<SolicitudIntercambio[]>([
    {
      id: "sol-1",
      profesional_solicitante: "Dr. Carlos Mendoza",
      profesional_receptor: "Dra. Sofía Rivas",
      fecha_turno: "2024-11-01",
      turno_ofrecido: "G24",
      turno_deseado: "M",
      motivo: "Asistencia a simposio internacional de neurología",
      estado: "pendiente",
      fecha_solicitud: "2024-10-27T10:00:00Z",
    },
  ]);

  const [modalIntercambioOpen, setModalIntercambioOpen] = useState(false);

  const handleCambiarTurno = (profesionalId: string, fecha: string, nuevoTurno: TipoTurno) => {
    setProfesionales(prev =>
      prev.map(p => {
        if (p.id !== profesionalId) return p;
        return {
          ...p,
          turnosPorDia: {
            ...p.turnosPorDia,
            [fecha]: nuevoTurno,
          },
        };
      })
    );
  };

  const handleAprobarSolicitud = (id: string) => {
    setSolicitudes(prev =>
      prev.map(s => (s.id === id ? { ...s, estado: "aprobado" } : s))
    );
    toast.success("Solicitud aprobada y cuadrante actualizado con firma de supervisión.");
  };

  const handleCrearSolicitud = (nueva: SolicitudIntercambio) => {
    setSolicitudes([nueva, ...solicitudes]);
  };

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Gestión de Turnos & Guardias Médicas"
        subtitle="Cuadrante rotativo hospitalario 24/7 (Mañana, Tarde, Noche, Guardias 24h), descansos legales y cobertura mínima"
        icon={Calendar}
        badge="Planificación Asistencial"
        action={
          <Button
            size="sm"
            className="rounded-xl text-xs gap-1.5 shadow-none"
            onClick={() => setModalIntercambioOpen(true)}
          >
            <ArrowLeftRight className="h-4 w-4" /> Intercambio de Guardias
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Personal en Turno Activo"
          value={profesionales.length}
          subtitle="Médicos y enfermería"
          icon={Users}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Guardias de 24h Esta Semana"
          value="8"
          subtitle="Emergencias y UCI"
          icon={Clock}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Cobertura de Servicios"
          value="100%"
          subtitle="Sin déficit en servicios críticos"
          icon={ShieldCheck}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Intercambios Pendientes"
          value={solicitudes.filter(s => s.estado === "pendiente").length}
          subtitle="Solicitudes entre colegas"
          icon={ArrowLeftRight}
          variant="blue"
        />
      </div>

      {/* Cuadrante Semanal */}
      <CuadranteTurnosTab
        profesionales={profesionales}
        onCambiarTurno={handleCambiarTurno}
        onAbrirIntercambio={() => setModalIntercambioOpen(true)}
      />

      {/* Modal de Intercambios */}
      <IntercambioGuardiasModal
        open={modalIntercambioOpen}
        onOpenChange={setModalIntercambioOpen}
        solicitudes={solicitudes}
        onAprobar={handleAprobarSolicitud}
        onCrearSolicitud={handleCrearSolicitud}
      />
    </div>
  );
}
