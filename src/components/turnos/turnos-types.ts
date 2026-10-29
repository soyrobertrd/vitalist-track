export type TipoTurno = "M" | "T" | "N" | "G24" | "L";

export interface DefinicionTurno {
  codigo: TipoTurno;
  nombre: string;
  horario: string;
  horas: number;
  colorBadge: string;
}

export const CATALOGO_TURNOS: Record<TipoTurno, DefinicionTurno> = {
  M: {
    codigo: "M",
    nombre: "Turno Mañana",
    horario: "07:00 - 15:00",
    horas: 8,
    colorBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  T: {
    codigo: "T",
    nombre: "Turno Tarde",
    horario: "15:00 - 23:00",
    horas: 8,
    colorBadge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  N: {
    codigo: "N",
    nombre: "Turno Noche / Guardia",
    horario: "23:00 - 07:00",
    horas: 8,
    colorBadge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
  G24: {
    codigo: "G24",
    nombre: "Guardia 24 Horas",
    horario: "07:00 - 07:00 (+1d)",
    horas: 24,
    colorBadge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold",
  },
  L: {
    codigo: "L",
    nombre: "Libre / Descanso Legal",
    horario: "Descanso obligatorio",
    horas: 0,
    colorBadge: "bg-muted text-muted-foreground border-border/60",
  },
};

export interface ProfesionalTurno {
  id: string;
  nombre: string;
  especialidad: string;
  servicio: "Emergencias" | "UCI" | "Hospitalización Piso" | "Quirófano";
  rol: "medico" | "enfermero" | "residente";
  turnosPorDia: Record<string, TipoTurno>; // e.g. { "2024-10-28": "M", "2024-10-29": "T" }
}

export interface SolicitudIntercambio {
  id: string;
  profesional_solicitante: string;
  profesional_receptor: string;
  fecha_turno: string;
  turno_ofrecido: TipoTurno;
  turno_deseado: TipoTurno;
  motivo: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha_solicitud: string;
}

export interface CoberturaMinimaServicio {
  servicio: string;
  turno: TipoTurno;
  medicos_minimos: number;
  enfermeros_minimos: number;
}
