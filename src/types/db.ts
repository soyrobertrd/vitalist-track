/**
 * Tipos derivados del esquema de Supabase para uso en componentes.
 */
import type { Tables } from "@/integrations/supabase/types";

export type Paciente = Tables<"pacientes">;
export type Personal = Tables<"personal_salud">;
export type Visita = Tables<"control_visitas">;
export type Llamada = Tables<"registro_llamadas">;
export type PlantillaCorreo = Tables<"plantillas_correo">;
export type Encuesta = Tables<"encuestas">;
export type RespuestaEncuesta = Tables<"respuestas_encuestas">;
export type Automatizacion = Tables<"automatizaciones">;
export type Profile = Tables<"profiles">;
export type AtencionPacienteRow = Tables<"atencion_paciente">;
export type Factura = Tables<"facturas">;
export type Pago = Tables<"pagos">;
export type Medicamento = Tables<"medicamentos_paciente">;
export type Ausencia = Tables<"ausencias_profesionales">;
export type HorarioProfesional = Tables<"horarios_profesionales">;

// Pacientes embebidos para reportes (con datos demográficos)
type PacienteReporte = Pick<
  Paciente,
  "nombre" | "apellido" | "sexo" | "fecha_nacimiento" | "grado_dificultad"
>;

// Pacientes embebidos para listados de visitas (con contactos)
type PacienteContacto = Pick<
  Paciente,
  "nombre" | "apellido" | "contacto_px" | "contacto_cuidador" | "whatsapp_px" | "whatsapp_cuidador" | "numero_principal"
>;

type PersonalMin = Pick<Personal, "nombre" | "apellido">;

export interface VisitaConRelaciones extends Visita {
  pacientes: PacienteContacto | null;
  personal_salud: PersonalMin | null;
  profesionales_adicionales?: Array<{
    profesional_id: string | null;
    personal_salud: PersonalMin | null;
  }>;
}

export interface VisitaReporte extends Visita {
  pacientes: PacienteReporte | null;
  personal_salud: PersonalMin | null;
}

export interface LlamadaConRelaciones extends Llamada {
  pacientes: Pick<Paciente, "nombre" | "apellido"> | null;
  personal_salud: PersonalMin | null;
}

export interface LlamadaReporte extends Llamada {
  pacientes: PacienteReporte | null;
  personal_salud: PersonalMin | null;
}

export interface PacienteConProfesional extends Paciente {
  personal_salud?: PersonalMin | null;
}
