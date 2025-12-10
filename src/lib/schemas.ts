import { z } from "zod";

// Regex patterns
export const TELEFONO_DOMINICANO_REGEX = /^(809|829|849)[-\s]?\d{3}[-\s]?\d{4}$/;
export const TELEFONO_ERROR_MESSAGE = "Formato inválido. Use: 809/829/849-XXX-XXXX";

// Reusable phone validation
const phoneSchema = z.string()
  .trim()
  .max(20, { message: "El contacto debe tener menos de 20 caracteres" })
  .refine(
    (val) => !val || TELEFONO_DOMINICANO_REGEX.test(val.replace(/\s+/g, '')),
    { message: TELEFONO_ERROR_MESSAGE }
  )
  .optional();

// Paciente Schema
export const pacienteSchema = z.object({
  cedula: z.string()
    .trim()
    .length(11, { message: "La cédula debe tener exactamente 11 dígitos" })
    .regex(/^\d+$/, { message: "La cédula solo debe contener números" }),
  nombre: z.string()
    .trim()
    .min(1, { message: "El nombre es requerido" })
    .max(100, { message: "El nombre debe tener menos de 100 caracteres" }),
  apellido: z.string()
    .trim()
    .min(1, { message: "El apellido es requerido" })
    .max(100, { message: "El apellido debe tener menos de 100 caracteres" }),
  fecha_nacimiento: z.string().optional(),
  contacto_px: phoneSchema,
  whatsapp_px: z.boolean().optional(),
  nombre_cuidador: z.string()
    .trim()
    .max(200, { message: "El nombre del cuidador debe tener menos de 200 caracteres" })
    .optional(),
  contacto_cuidador: phoneSchema,
  whatsapp_cuidador: z.boolean().optional(),
  numero_principal: z.enum(["paciente", "cuidador"]).optional(),
  direccion_domicilio: z.string()
    .trim()
    .max(500, { message: "La dirección debe tener menos de 500 caracteres" })
    .optional(),
  zona: z.enum(["santo_domingo_oeste", "santo_domingo_este", "santo_domingo_norte", "distrito_nacional"]).optional(),
  barrio: z.string()
    .trim()
    .max(100, { message: "El barrio debe tener menos de 100 caracteres" })
    .optional(),
  grado_dificultad: z.enum(["bajo", "medio", "alto"]),
  historia_medica_basica: z.string()
    .trim()
    .max(2000, { message: "La historia médica debe tener menos de 2000 caracteres" })
    .optional(),
  periodo_llamada_ciclico: z.number().min(1).max(365),
  periodo_visita_ciclico: z.number().min(1).max(730),
});

// Personal Schema
export const personalSchema = z.object({
  cedula: z.string()
    .trim()
    .length(11, { message: "La cédula debe tener exactamente 11 dígitos" })
    .regex(/^\d+$/, { message: "La cédula solo debe contener números" }),
  nombre: z.string()
    .trim()
    .min(1, { message: "El nombre es requerido" })
    .max(100, { message: "El nombre debe tener menos de 100 caracteres" }),
  apellido: z.string()
    .trim()
    .min(1, { message: "El apellido es requerido" })
    .max(100, { message: "El apellido debe tener menos de 100 caracteres" }),
  especialidad: z.string().optional(),
  contacto: phoneSchema,
  email_contacto: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  zona: z.string().optional(),
  barrio: z.string().optional(),
  direccion: z.string().max(500).optional(),
});

// Visita Schema
export const visitaSchema = z.object({
  paciente_id: z.string().uuid({ message: "Paciente inválido" }),
  profesional_id: z.string().uuid({ message: "Profesional inválido" }),
  fecha_hora_visita: z.string().min(1, { message: "Fecha y hora requeridos" }),
  tipo_visita: z.enum(["ambulatorio", "domicilio"]),
  motivo_visita: z.string().max(500).optional(),
});

// Llamada Schema
export const llamadaSchema = z.object({
  paciente_id: z.string().uuid({ message: "Paciente inválido" }),
  profesional_id: z.string().uuid({ message: "Profesional inválido" }),
  fecha_agendada: z.string().min(1, { message: "Fecha requerida" }),
  motivo: z.string().max(500).optional(),
  duracion_estimada: z.number().min(1).max(120).optional(),
});

export type PacienteFormData = z.infer<typeof pacienteSchema>;
export type PersonalFormData = z.infer<typeof personalSchema>;
export type VisitaFormData = z.infer<typeof visitaSchema>;
export type LlamadaFormData = z.infer<typeof llamadaSchema>;
