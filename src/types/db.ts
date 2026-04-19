/**
 * Tipos derivados del esquema de Supabase para uso en componentes.
 * Centraliza los tipos de filas de tablas para evitar `any[]` disperso.
 */
import type { Tables } from "@/integrations/supabase/types";

// Tipos directos de filas
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

// Embeds frecuentes (relaciones)
export interface VisitaConRelaciones extends Visita {
  pacientes: Pick<
    Paciente,
    "nombre" | "apellido" | "contacto_px" | "contacto_cuidador" | "whatsapp_px" | "whatsapp_cuidador" | "numero_principal" | "sexo" | "fecha_nacimiento" | "grado_dificultad"
  > | null;
  personal_salud: Pick<Personal, "nombre" | "apellido"> | null;
  profesionales_adicionales?: Array<{
    profesional_id: string | null;
    personal_salud: Pick<Personal, "nombre" | "apellido"> | null;
  }>;
}

export interface LlamadaConRelaciones extends Llamada {
  pacientes: Pick<
    Paciente,
    "nombre" | "apellido" | "sexo" | "fecha_nacimiento" | "grado_dificultad"
  > | null;
  personal_salud: Pick<Personal, "nombre" | "apellido"> | null;
}

export interface PacienteConProfesional extends Paciente {
  personal_salud?: Pick<Personal, "nombre" | "apellido"> | null;
}
