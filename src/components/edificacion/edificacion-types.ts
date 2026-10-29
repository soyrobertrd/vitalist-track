export type EstadoCama = "libre" | "ocupada" | "aislamiento" | "desinfeccion" | "mantenimiento";

export type TipoAislamiento = "contacto" | "gotas" | "aerosoles" | "inverso_protector";

export interface CamaHospital {
  id: string;
  codigo: string; // ej: "CAMA-301-A"
  edificioId: string;
  pisoId: string;
  alaServicioId: string;
  estado: EstadoCama;
  tipoCama: "electrica_uci" | "hospitalizacion_estandar" | "cuna_neonatal" | "camilla_urgencias";
  paciente?: {
    id: string;
    nombre: string;
    edad: string;
    diagnostico: string;
    fechaIngreso: string;
    medicoTratante: string;
    tipoAislamiento?: TipoAislamiento;
  };
}

export interface AlaServicio {
  id: string;
  nombre: string;
  tipo: "emergencias" | "uci" | "quirofano" | "hospitalizacion" | "maternidad" | "pediatria" | "diagnostico";
  pisoId: string;
  capacidadTotalCamas: number;
  camas: CamaHospital[];
  jefeServicio: string;
  telefonoInterno: string;
}

export interface PisoHospital {
  id: string;
  numero: number;
  nombre: string; // ej: "Piso 1 - Urgencias y Resonancia", "Piso 2 - Bloque Quirúrgico y UCI"
  edificioId: string;
  alas: AlaServicio[];
}

export interface EdificioHospital {
  id: string;
  nombre: string; // ej: "Torre Médica Central", "Torre de Paciente Crítico"
  codigo: string;
  pisos: PisoHospital[];
}
