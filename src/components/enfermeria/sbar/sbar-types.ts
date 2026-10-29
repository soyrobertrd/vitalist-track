export type TurnoServicio = "mañana" | "tarde" | "noche" | "guardia_24h";

export interface PacienteNovedadSBAR {
  id: string;
  cama: string;
  paciente: string;
  diagnostico: string;
  condicion: "estable" | "cuidado_intermedio" | "critico" | "aislamiento";
  situacion: string; // S: Qué está ocurriendo con el paciente
  antecedentes: string; // B: Diagnósticos previos, cirugías, alergias
  evaluacion: string; // A: Hallazgos clínicos recientes, signos vitales, NEWS2
  recomendacion: string; // R: Pendientes prioritarios, laboratorios, cuidados de enfermería
  pendienteInmediato?: string;
  alertasActivas?: string[];
}

export interface RegistroPaseGuardiaSBAR {
  id: string;
  fecha: string;
  servicio: string;
  turnoEntregado: TurnoServicio;
  profesionalEntrega: {
    nombre: string;
    rol: string;
    firmaRegistrada: boolean;
    horaFirma: string;
  };
  profesionalRecibe: {
    nombre: string;
    rol: string;
    firmaRegistrada: boolean;
    horaFirma?: string;
  };
  censoCamas: {
    ocupadas: number;
    libres: number;
    aisladas: number;
    pendientesIngreso: number;
  };
  novedadesServicio: string;
  pacientes: PacienteNovedadSBAR[];
  estado: "borrador" | "entregado" | "recibido_conforme";
}
