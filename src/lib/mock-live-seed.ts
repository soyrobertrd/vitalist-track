/**
 * Seed Canónico para Pruebas en Vivo Autónomas
 * Multi-Vertical (6 centros), Multi-Plan (4 planes), Multi-Doctor (6 especialistas)
 * Enfoque: Citas y Consultas (Ambulatorias por defecto / Domiciliarias cuando aplique)
 */

import type { Plan, Workspace, WorkspaceRole } from "@/contexts/WorkspaceContext";
import type { VerticalTipo } from "@/contexts/VerticalContext";

export interface DemoDoctor {
  id: string;
  workspace_id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  exequatur: string;
  telefono: string;
  email: string;
  dias_laborables?: number[];
  color?: string;
}

export interface DemoPatient {
  id: string;
  workspace_id: string;
  vertical: VerticalTipo;
  cedula: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  status_px: "activo" | "inactivo" | "alta";
  grado_dificultad: "bajo" | "medio" | "alto";
  contacto_px: string;
  numero_principal: string;
  whatsapp_px: boolean;
  direccion_domicilio: string;
  historia_medica_basica: string;
  profesional_asignado_id: string;
  clinica_origen?: string;
  zona?: string;
  barrio?: string;
}

export interface DemoCita {
  id: string;
  workspace_id: string;
  paciente_id: string;
  profesional_id: string;
  fecha_hora_visita: string; // formato ISO
  tipo_visita: "ambulatorio" | "domicilio"; // Por defecto 'ambulatorio'
  modalidad: "presencial" | "virtual";
  motivo_visita: string;
  estado: "pendiente" | "confirmada" | "realizada" | "cancelada";
  notas_visita?: string;
  confirmada_por_paciente?: boolean;
  token_confirmacion?: string;
  consultorio_sala?: string;
  pacientes?: {
    nombre: string;
    apellido: string;
    contacto_px?: string;
    numero_principal?: string;
    whatsapp_px?: boolean;
    clinica_origen?: string;
  };
  personal_salud?: {
    nombre: string;
    apellido: string;
    especialidad?: string;
  };
}

// 1. LOS 4 PLANES CON PRECIOS Y CUOTAS EXACTAS
export const DEMO_PLANES: Plan[] = [
  {
    codigo: "solo",
    nombre: "Básico",
    descripcion: "Para médicos individuales y consultorios independientes.",
    precio_mensual_usd: 15,
    precio_mensual_dop: 900,
    limite_pacientes: 85,
    limite_usuarios: 1,
    limite_profesionales: 1,
    limite_dispositivos: 2,
    caracteristicas: {
      citas_ambulatorias: true,
      recetas_digitales: true,
      historial_clinico: true,
      recordatorios_basicos: true,
      subdominio: false,
      portal_marca: false,
      base_datos_independiente: false,
    },
    orden: 1,
  },
  {
    codigo: "pro",
    nombre: "Pro Consultorios",
    descripcion: "Hasta 3 profesionales trabajando en hasta 3 clínicas asociadas.",
    precio_mensual_usd: 35,
    precio_mensual_dop: 2100,
    limite_pacientes: 500,
    limite_usuarios: 3,
    limite_profesionales: 5,
    limite_dispositivos: 5,
    caracteristicas: {
      citas_ambulatorias: true,
      multiclinica_asociada: true, // Hasta 3 clínicas para saber origen del paciente
      max_clinicas_asociadas: 3,
      caja_diaria: true,
      odontograma: true,
      recetas_opticas: true,
      fichas_especialidad: true,
      subdominio: false, // Pro Consultorios NO lleva subdominio propio
      portal_marca: false,
      base_datos_independiente: false,
    },
    orden: 2,
  },
  {
    codigo: "plus",
    nombre: "Clínica Plus",
    descripcion: "Para policlínicas y centros con portal de paciente y subdominio propio.",
    precio_mensual_usd: 85,
    precio_mensual_dop: 5100,
    limite_pacientes: 1500,
    limite_usuarios: 8,
    limite_profesionales: 15,
    limite_dispositivos: 10,
    caracteristicas: {
      citas_ambulatorias: true,
      citas_domiciliarias: true,
      rutas_optimizadas: true,
      subdominio: true, // Lleva subdominio propio
      portal_marca: true, // Portal con marca clínica
      facturacion_ars: true,
      telemedicina: true,
      turnos_sala_espera: true,
      base_datos_independiente: false,
    },
    orden: 3,
  },
  {
    codigo: "business",
    nombre: "Business Enterprise",
    descripcion: "Base de datos independiente dedicada (Turso/LibSQL) y volumen ilimitado.",
    precio_mensual_usd: 165,
    precio_mensual_dop: 9900,
    limite_pacientes: null,
    limite_usuarios: null,
    limite_profesionales: null,
    limite_dispositivos: null,
    caracteristicas: {
      base_datos_independiente: true, // Exclusivo Business Enterprise
      hospitalizacion_camas: true,
      uci_management: true,
      quirofano_cirugia: true,
      hl7_fhir_integraciones: true,
      subdominio: true,
      portal_marca: true,
      soporte_prioritario_247: true,
    },
    orden: 4,
  },
];

// 2. LOS 6 CENTROS DEMO (1 POR VERTICAL)
export const DEMO_WORKSPACES: Array<Workspace & { role: WorkspaceRole; vertical: VerticalTipo }> = [
  {
    id: "ws-clinica",
    nombre: "Hospital Metropolitano Especializado",
    slug: "hospital-metropolitano",
    owner_id: "usr-admin-demo",
    plan_codigo: "business", // $165 Enterprise
    estado: "activo",
    vertical: "clinica",
    trial_ends_at: null,
    role: "owner",
    configuracion: {
      vertical: "clinica",
      permite_domicilio: true,
      moneda: "DOP",
      duracion_cita_min: 30,
      subdominio: "metropolitano.vitalisttrack.com",
      turso_dedicated_db: "metropolitano-prod-db",
    },
  },
  {
    id: "ws-dental",
    nombre: "DentalCare & Ortodoncia Avanzada",
    slug: "dentalcare-pro",
    owner_id: "usr-admin-demo",
    plan_codigo: "pro", // $35 Pro Consultorios
    estado: "activo",
    vertical: "dental",
    trial_ends_at: null,
    role: "owner",
    configuracion: {
      vertical: "dental",
      permite_domicilio: false, // 100% ambulatorio en sillón dental
      moneda: "DOP",
      duracion_cita_min: 45,
      clinicas_asociadas: ["Hospiten Santo Domingo", "Clínica Corazones Unidos", "Centro Odontológico Bella Vista"],
    },
  },
  {
    id: "ws-aesthetic",
    nombre: "Aesthetic & Skin Studio",
    slug: "aesthetic-studio",
    owner_id: "usr-admin-demo",
    plan_codigo: "pro", // $35 Pro Consultorios
    estado: "activo",
    vertical: "aesthetic",
    trial_ends_at: null,
    role: "owner",
    configuracion: {
      vertical: "aesthetic",
      permite_domicilio: false, // 100% ambulatorio en cabinas estéticas
      moneda: "USD",
      duracion_cita_min: 60,
      clinicas_asociadas: ["Centro Médico Quirúrgico Abreu", "Torre Médica Piantini", "Clínica Dra. Valenzuela"],
    },
  },
  {
    id: "ws-recovery",
    nombre: "RecoveryCare & Rehabilitación Activa",
    slug: "recoverycare-rehab",
    owner_id: "usr-admin-demo",
    plan_codigo: "plus", // $85 Clínica Plus
    estado: "activo",
    vertical: "recovery",
    trial_ends_at: null,
    role: "owner",
    configuracion: {
      vertical: "recovery",
      permite_domicilio: true, // Sala ambulatoria y atención a domicilio
      moneda: "DOP",
      duracion_cita_min: 45,
      subdominio: "recoverycare.vitalisttrack.com",
    },
  },
  {
    id: "ws-vision",
    nombre: "Óptica & Oftalmología VistaPlus",
    slug: "vistaplus-optica",
    owner_id: "usr-admin-demo",
    plan_codigo: "solo", // $15 Básico
    estado: "activo",
    vertical: "vision",
    trial_ends_at: null,
    role: "owner",
    configuracion: {
      vertical: "vision",
      permite_domicilio: false, // 100% ambulatorio en gabinete óptico
      moneda: "DOP",
      duracion_cita_min: 20,
    },
  },
  {
    id: "ws-psicologia",
    nombre: "Centro Bienestar Emocional & Mente Sana",
    slug: "mentesana-psicologia",
    owner_id: "usr-admin-demo",
    plan_codigo: "solo", // $15 Básico
    estado: "activo",
    vertical: "psicologia",
    trial_ends_at: null,
    role: "owner",
    configuracion: {
      vertical: "psicologia",
      permite_domicilio: false, // Ambulatorio y Teleconsulta
      moneda: "DOP",
      duracion_cita_min: 50,
    },
  },
];

// 3. LOS 6 DOCTORES ESPECIALISTAS (1 POR CENTRO)
export const DEMO_DOCTORES: DemoDoctor[] = [
  {
    id: "prof-dr-ramos",
    workspace_id: "ws-clinica",
    nombre: "Dr. Alejandro",
    apellido: "Ramos",
    especialidad: "Medicina Interna & Cirugía",
    exequatur: "EX-10492-MED",
    telefono: "809-555-0101",
    email: "alejandro.ramos@metropolitano.com",
    dias_laborables: [1, 2, 3, 4, 5],
  },
  {
    id: "prof-dr-mendoza",
    workspace_id: "ws-dental",
    nombre: "Dr. Carlos",
    apellido: "Mendoza",
    especialidad: "Odontología & Implantología Oral",
    exequatur: "EX-22340-ODO",
    telefono: "809-555-0202",
    email: "carlos.mendoza@dentalcare.com",
    dias_laborables: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "prof-dra-valenzuela",
    workspace_id: "ws-aesthetic",
    nombre: "Dra. Sofía",
    apellido: "Valenzuela",
    especialidad: "Medicina Estética & Dermatología",
    exequatur: "EX-31980-DER",
    telefono: "809-555-0303",
    email: "sofia.valenzuela@aestheticstudio.com",
    dias_laborables: [2, 3, 4, 5, 6],
  },
  {
    id: "prof-lic-silva",
    workspace_id: "ws-recovery",
    nombre: "Lic. Marcos",
    apellido: "Silva",
    especialidad: "Fisioterapia & Kinesiología Motora",
    exequatur: "EX-45120-FIS",
    telefono: "809-555-0404",
    email: "marcos.silva@recoverycare.com",
    dias_laborables: [1, 2, 3, 4, 5],
  },
  {
    id: "prof-dr-pena",
    workspace_id: "ws-vision",
    nombre: "Dr. Roberto",
    apellido: "Peña",
    especialidad: "Oftalmología & Optometría Clínica",
    exequatur: "EX-58900-OFT",
    telefono: "809-555-0505",
    email: "roberto.pena@vistaplus.com",
    dias_laborables: [1, 2, 3, 4, 5],
  },
  {
    id: "prof-lic-morales",
    workspace_id: "ws-psicologia",
    nombre: "Licda. Elena",
    apellido: "Morales",
    especialidad: "Psicología Clínica & Terapia Cognitiva",
    exequatur: "EX-67210-PSI",
    telefono: "809-555-0606",
    email: "elena.morales@mentesana.com",
    dias_laborables: [1, 2, 3, 4],
  },
];

// 4. PACIENTES DEMO PARA CADA VERTICAL
export const DEMO_PACIENTES: DemoPatient[] = [
  // Clínica
  {
    id: "px-clinica-01",
    workspace_id: "ws-clinica",
    vertical: "clinica",
    cedula: "001-1827364-5",
    nombre: "Ramón",
    apellido: "Castillo Peña",
    fecha_nacimiento: "1968-04-12",
    status_px: "activo",
    grado_dificultad: "medio",
    contacto_px: "809-555-7101",
    numero_principal: "809-555-7101",
    whatsapp_px: true,
    direccion_domicilio: "Av. Winston Churchill 140, Piantini, Santo Domingo",
    historia_medica_basica: "Hipertensión arterial controlada y evaluación prequirúrgica.",
    profesional_asignado_id: "prof-dr-ramos",
    clinica_origen: "Clínica Abreu",
    zona: "Distrito Nacional",
    barrio: "Piantini",
  },
  // Dental
  {
    id: "px-dental-01",
    workspace_id: "ws-dental",
    vertical: "dental",
    cedula: "001-2948172-1",
    nombre: "Mariana",
    apellido: "Guzmán Santos",
    fecha_nacimiento: "1994-08-22",
    status_px: "activo",
    grado_dificultad: "bajo",
    contacto_px: "829-555-7202",
    numero_principal: "829-555-7202",
    whatsapp_px: true,
    direccion_domicilio: "Calle Sarasota 45, Bella Vista, Santo Domingo",
    historia_medica_basica: "Ortodoncia invisible en fase 2 y limpieza periódica.",
    profesional_asignado_id: "prof-dr-mendoza",
    clinica_origen: "Hospiten Santo Domingo",
    zona: "Distrito Nacional",
    barrio: "Bella Vista",
  },
  // Aesthetic
  {
    id: "px-aesthetic-01",
    workspace_id: "ws-aesthetic",
    vertical: "aesthetic",
    cedula: "402-1092837-4",
    nombre: "Camila",
    apellido: "Almonte Pimentel",
    fecha_nacimiento: "1989-11-15",
    status_px: "activo",
    grado_dificultad: "bajo",
    contacto_px: "849-555-7303",
    numero_principal: "849-555-7303",
    whatsapp_px: true,
    direccion_domicilio: "Av. Abraham Lincoln 902, Naco, Santo Domingo",
    historia_medica_basica: "Protocolo de bioestimulación dérmica y toxina botulínica.",
    profesional_asignado_id: "prof-dra-valenzuela",
    clinica_origen: "Torre Médica Piantini",
    zona: "Distrito Nacional",
    barrio: "Naco",
  },
  // Recovery
  {
    id: "px-recovery-01",
    workspace_id: "ws-recovery",
    vertical: "recovery",
    cedula: "001-0892716-8",
    nombre: "José",
    apellido: "Fernández Brea",
    fecha_nacimiento: "1955-02-28",
    status_px: "activo",
    grado_dificultad: "alto",
    contacto_px: "809-555-7404",
    numero_principal: "809-555-7404",
    whatsapp_px: true,
    direccion_domicilio: "Calle El Sol 12, Gazcue, Santo Domingo",
    historia_medica_basica: "Rehabilitación motora post-reemplazo total de cadera.",
    profesional_asignado_id: "prof-lic-silva",
    clinica_origen: "Clínica Corazones Unidos",
    zona: "Distrito Nacional",
    barrio: "Gazcue",
  },
  // Vision
  {
    id: "px-vision-01",
    workspace_id: "ws-vision",
    vertical: "vision",
    cedula: "002-3928173-9",
    nombre: "Lucía",
    apellido: "Rosario Mejía",
    fecha_nacimiento: "2001-06-18",
    status_px: "activo",
    grado_dificultad: "bajo",
    contacto_px: "829-555-7505",
    numero_principal: "829-555-7505",
    whatsapp_px: true,
    direccion_domicilio: "Av. Independencia km 8, Miramar, Santo Domingo",
    historia_medica_basica: "Miopía y astigmatismo progresivo. Actualización de cristales.",
    profesional_asignado_id: "prof-dr-pena",
    clinica_origen: "Centro Médico Real",
    zona: "Distrito Nacional",
    barrio: "Miramar",
  },
  // Psicologia
  {
    id: "px-psicologia-01",
    workspace_id: "ws-psicologia",
    vertical: "psicologia",
    cedula: "402-9988776-3",
    nombre: "Gabriel",
    apellido: "Herrera Tavárez",
    fecha_nacimiento: "1992-09-04",
    status_px: "activo",
    grado_dificultad: "medio",
    contacto_px: "849-555-7606",
    numero_principal: "849-555-7606",
    whatsapp_px: true,
    direccion_domicilio: "Calle Federico Geraldino 33, Piantini, Santo Domingo",
    historia_medica_basica: "Manejo de estrés ocupacional y terapia de enfoque cognitivo.",
    profesional_asignado_id: "prof-lic-morales",
    clinica_origen: "Clínica Abreu",
    zona: "Distrito Nacional",
    barrio: "Piantini",
  },
];

// Helper para generar fechas ISO relativas a hoy
const hoy = new Date();
const fechaRelativa = (dias: number, hora: number, min: number = 0) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + dias);
  d.setHours(hora, min, 0, 0);
  return d.toISOString();
};

// 5. CITAS Y CONSULTAS DEMO (AMBULATORIAS POR DEFECTO / DOMICILIARIAS CUANDO APLIQUE)
export const DEMO_CITAS: DemoCita[] = [
  // Citas Hospital Metropolitano (Clínica)
  {
    id: "cita-cli-01",
    workspace_id: "ws-clinica",
    paciente_id: "px-clinica-01",
    profesional_id: "prof-dr-ramos",
    fecha_hora_visita: fechaRelativa(0, 9, 30), // Hoy 09:30 AM
    tipo_visita: "ambulatorio", // Por defecto AMBULATORIA
    modalidad: "presencial",
    motivo_visita: "Consulta de Seguimiento Cardiológico y Ajuste Terapéutico",
    estado: "confirmada",
    confirmada_por_paciente: true,
    token_confirmacion: "tok_cli_conf_01",
    consultorio_sala: "Consultorio 304 - Cardiología",
    notas_visita: "Paciente confirmó asistencia vía link de recordatorio seguro.",
    pacientes: {
      nombre: "Ramón",
      apellido: "Castillo Peña",
      contacto_px: "809-555-7101",
      numero_principal: "809-555-7101",
      whatsapp_px: true,
      clinica_origen: "Clínica Abreu",
    },
    personal_salud: {
      nombre: "Dr. Alejandro",
      apellido: "Ramos",
      especialidad: "Medicina Interna & Cirugía",
    },
  },
  {
    id: "cita-cli-02",
    workspace_id: "ws-clinica",
    paciente_id: "px-clinica-01",
    profesional_id: "prof-dr-ramos",
    fecha_hora_visita: fechaRelativa(2, 14, 0), // Pasado mañana
    tipo_visita: "domicilio", // Domiciliaria en clínica general
    modalidad: "presencial",
    motivo_visita: "Visita de Evaluación Post-Quirúrgica Domiciliaria",
    estado: "pendiente",
    confirmada_por_paciente: false,
    token_confirmacion: "tok_cli_pend_02",
    consultorio_sala: "Atención a Domicilio - Zona Piantini",
    notas_visita: "Recordatorio programado para envío 24h antes.",
    pacientes: {
      nombre: "Ramón",
      apellido: "Castillo Peña",
      contacto_px: "809-555-7101",
      numero_principal: "809-555-7101",
      whatsapp_px: true,
      clinica_origen: "Clínica Abreu",
    },
    personal_salud: {
      nombre: "Dr. Alejandro",
      apellido: "Ramos",
      especialidad: "Medicina Interna & Cirugía",
    },
  },

  // Citas DentalCare (100% AMBULATORIAS en Consultorio / Sillón)
  {
    id: "cita-den-01",
    workspace_id: "ws-dental",
    paciente_id: "px-dental-01",
    profesional_id: "prof-dr-mendoza",
    fecha_hora_visita: fechaRelativa(0, 11, 0), // Hoy 11:00 AM
    tipo_visita: "ambulatorio", // AMBULATORIA
    modalidad: "presencial",
    motivo_visita: "Ajuste de Alineadores Invisibles y Profilaxis",
    estado: "confirmada",
    confirmada_por_paciente: true,
    token_confirmacion: "tok_den_conf_01",
    consultorio_sala: "Sillón Odontológico 2",
    notas_visita: "Check-in realizado en recepción. Paciente en sala.",
    pacientes: {
      nombre: "Mariana",
      apellido: "Guzmán Santos",
      contacto_px: "829-555-7202",
      numero_principal: "829-555-7202",
      whatsapp_px: true,
      clinica_origen: "Hospiten Santo Domingo",
    },
    personal_salud: {
      nombre: "Dr. Carlos",
      apellido: "Mendoza",
      especialidad: "Odontología & Implantología Oral",
    },
  },
  {
    id: "cita-den-02",
    workspace_id: "ws-dental",
    paciente_id: "px-dental-01",
    profesional_id: "prof-dr-mendoza",
    fecha_hora_visita: fechaRelativa(7, 16, 30), // En 7 días
    tipo_visita: "ambulatorio", // AMBULATORIA
    modalidad: "presencial",
    motivo_visita: "Control Radiográfico y Evaluación de Implante 3.6",
    estado: "pendiente",
    confirmada_por_paciente: false,
    token_confirmacion: "tok_den_pend_02",
    consultorio_sala: "Sillón Odontológico 1",
    notas_visita: "Recordatorio automatizado por WhatsApp activo.",
    pacientes: {
      nombre: "Mariana",
      apellido: "Guzmán Santos",
      contacto_px: "829-555-7202",
      numero_principal: "829-555-7202",
      whatsapp_px: true,
      clinica_origen: "Hospiten Santo Domingo",
    },
    personal_salud: {
      nombre: "Dr. Carlos",
      apellido: "Mendoza",
      especialidad: "Odontología & Implantología Oral",
    },
  },

  // Citas Aesthetic & Skin Studio (100% AMBULATORIAS en Cabina)
  {
    id: "cita-aes-01",
    workspace_id: "ws-aesthetic",
    paciente_id: "px-aesthetic-01",
    profesional_id: "prof-dra-valenzuela",
    fecha_hora_visita: fechaRelativa(1, 15, 0), // Mañana 3:00 PM
    tipo_visita: "ambulatorio", // AMBULATORIA
    modalidad: "presencial",
    motivo_visita: "Sesión Láser CO2 Fraccionado Facial",
    estado: "confirmada",
    confirmada_por_paciente: true,
    token_confirmacion: "tok_aes_conf_01",
    consultorio_sala: "Cabina Láser VIP",
    notas_visita: "Se envió consentimiento informado y guía pre-tratamiento.",
    pacientes: {
      nombre: "Camila",
      apellido: "Almonte Pimentel",
      contacto_px: "849-555-7303",
      numero_principal: "849-555-7303",
      whatsapp_px: true,
      clinica_origen: "Torre Médica Piantini",
    },
    personal_salud: {
      nombre: "Dra. Sofía",
      apellido: "Valenzuela",
      especialidad: "Medicina Estética & Dermatología",
    },
  },

  // Citas RecoveryCare (Ambulatorias en Sala y Domiciliarias de Rehabilitación)
  {
    id: "cita-rec-01",
    workspace_id: "ws-recovery",
    paciente_id: "px-recovery-01",
    profesional_id: "prof-lic-silva",
    fecha_hora_visita: fechaRelativa(0, 16, 0), // Hoy 04:00 PM
    tipo_visita: "domicilio", // Domiciliaria de fisioterapia
    modalidad: "presencial",
    motivo_visita: "Terapia Motora y Reeducación de la Marcha en Domicilio",
    estado: "confirmada",
    confirmada_por_paciente: true,
    token_confirmacion: "tok_rec_conf_01",
    consultorio_sala: "Ruta Domiciliaria Zona Gazcue",
    notas_visita: "Cuidador confirmó recepción del terapeuta a las 4:00 PM.",
    pacientes: {
      nombre: "José",
      apellido: "Fernández Brea",
      contacto_px: "809-555-7404",
      numero_principal: "809-555-7404",
      whatsapp_px: true,
      clinica_origen: "Clínica Corazones Unidos",
    },
    personal_salud: {
      nombre: "Lic. Marcos",
      apellido: "Silva",
      especialidad: "Fisioterapia & Kinesiología Motora",
    },
  },
  {
    id: "cita-rec-02",
    workspace_id: "ws-recovery",
    paciente_id: "px-recovery-01",
    profesional_id: "prof-lic-silva",
    fecha_hora_visita: fechaRelativa(3, 10, 0),
    tipo_visita: "ambulatorio", // Ambulatoria en gimnasio de rehabilitación
    modalidad: "presencial",
    motivo_visita: "Hidroterapia y Fortalecimiento en Sala de Terapia",
    estado: "pendiente",
    confirmada_por_paciente: false,
    token_confirmacion: "tok_rec_pend_02",
    consultorio_sala: "Sala de Fisioterapia 1",
    notas_visita: "Programada con transporte especial adaptado.",
    pacientes: {
      nombre: "José",
      apellido: "Fernández Brea",
      contacto_px: "809-555-7404",
      numero_principal: "809-555-7404",
      whatsapp_px: true,
      clinica_origen: "Clínica Corazones Unidos",
    },
    personal_salud: {
      nombre: "Lic. Marcos",
      apellido: "Silva",
      especialidad: "Fisioterapia & Kinesiología Motora",
    },
  },

  // Citas VistaPlus Óptica (100% AMBULATORIAS)
  {
    id: "cita-vis-01",
    workspace_id: "ws-vision",
    paciente_id: "px-vision-01",
    profesional_id: "prof-dr-pena",
    fecha_hora_visita: fechaRelativa(0, 17, 0), // Hoy 05:00 PM
    tipo_visita: "ambulatorio", // AMBULATORIA
    modalidad: "presencial",
    motivo_visita: "Examen Optométrico Computarizado y Agudeza Visual",
    estado: "confirmada",
    confirmada_por_paciente: true,
    token_confirmacion: "tok_vis_conf_01",
    consultorio_sala: "Gabinete de Refracción 1",
    notas_visita: "Paciente asistirá puntual para graduación de lentes progresivos.",
    pacientes: {
      nombre: "Lucía",
      apellido: "Rosario Mejía",
      contacto_px: "829-555-7505",
      numero_principal: "829-555-7505",
      whatsapp_px: true,
      clinica_origen: "Centro Médico Real",
    },
    personal_salud: {
      nombre: "Dr. Roberto",
      apellido: "Peña",
      especialidad: "Oftalmología & Optometría Clínica",
    },
  },

  // Citas Mente Sana Psicología (AMBULATORIAS Y TELECONSULTA)
  {
    id: "cita-psi-01",
    workspace_id: "ws-psicologia",
    paciente_id: "px-psicologia-01",
    profesional_id: "prof-lic-morales",
    fecha_hora_visita: fechaRelativa(1, 18, 0), // Mañana 06:00 PM
    tipo_visita: "ambulatorio", // AMBULATORIA
    modalidad: "virtual", // Teleconsulta
    motivo_visita: "Sesión de Psicoterapia Semanal (Teleconsulta Segura)",
    estado: "confirmada",
    confirmada_por_paciente: true,
    token_confirmacion: "tok_psi_conf_01",
    consultorio_sala: "Sala Virtual Encriptada WebRTC",
    notas_visita: "Enlace generado automáticamente y enviado al paciente.",
    pacientes: {
      nombre: "Gabriel",
      apellido: "Herrera Tavárez",
      contacto_px: "849-555-7606",
      numero_principal: "849-555-7606",
      whatsapp_px: true,
      clinica_origen: "Clínica Abreu",
    },
    personal_salud: {
      nombre: "Licda. Elena",
      apellido: "Morales",
      especialidad: "Psicología Clínica & Terapia Cognitiva",
    },
  },
];
