import type { Plan } from "@/contexts/WorkspaceContext";

export const TRIAL_DAYS = 30;

/**
 * Catálogo canónico de planes Vitalist Track
 * - 30 días de prueba gratis en todos los planes.
 * - Si no se adquiere suscripción al terminar los 30 días, se degrada a 'free'.
 * - El plan 'free' existe en el sistema pero NO se expone en la tabla pública de precios.
 * - Pro Consultorios: 3 usuarios / 5 dispositivos / 5 profesionales (hasta 3 clínicas afiliadas para clasificar pacientes, sin subdominio ni portal con marca).
 * - Clínica Plus: 8 usuarios / 10 dispositivos / 15 profesionales (subdominio + dominio web propio + portal con marca).
 * - Business Enterprise: Base de datos independiente configurable, pacientes/usuarios/dispositivos ilimitados.
 */
export const CANONICAL_PLANES: Plan[] = [
  {
    codigo: "solo",
    nombre: "Básico (Solo Doctor)",
    descripcion: "Para doctores y especialistas independientes en consulta privada",
    precio_mensual_usd: 15,
    precio_mensual_dop: 900,
    limite_pacientes: 85, // 85 px
    limite_usuarios: 1, // 1 usuario
    limite_dispositivos: 2, // 2 dispositivos
    limite_profesionales: 1,
    caracteristicas: {
      whatsapp: true,
      recordatorios: true,
      encuestas: true,
      automatizaciones: false,
      auditoria: false,
      portal_paciente: false,
      mapa: false,
      subdominio: false,
      custom_domain: false,
      portal_paciente_marca: false,
      db_independiente: false,
      soporte: "email",
      trial_dias: 30,
    },
    orden: 1,
  },
  {
    codigo: "pro",
    nombre: "Pro Consultorios",
    descripcion: "Para médicos que ejercen en hasta 3 clínicas diferentes y pequeños equipos",
    precio_mensual_usd: 35,
    precio_mensual_dop: 2100,
    limite_pacientes: 500,
    limite_usuarios: 3, // 3 usuarios
    limite_dispositivos: 5, // 5 dispositivos
    limite_profesionales: 5, // 5 profesionales
    caracteristicas: {
      whatsapp: true,
      recordatorios: true,
      encuestas: true,
      automatizaciones: true,
      auditoria: true,
      portal_paciente: true,
      mapa: false,
      subdominio: false, // NO lleva subdominio propio
      custom_domain: false,
      portal_paciente_marca: false, // NO lleva portal de paciente con marca clínica
      clinicas_externas_max: 3, // Hasta 3 clínicas para saber de qué clínica es cada paciente
      db_independiente: false,
      soporte: "prioritario",
      trial_dias: 30,
    },
    orden: 2,
  },
  {
    codigo: "plus",
    nombre: "Clínica Plus",
    descripcion: "Para policlínicas, centros especializados y clínicas en expansión",
    precio_mensual_usd: 85,
    precio_mensual_dop: 5100,
    limite_pacientes: 1500,
    limite_usuarios: 8, // 8 usuarios
    limite_dispositivos: 10, // 10 dispositivos
    limite_profesionales: 15, // 15 profesionales
    caracteristicas: {
      whatsapp: true,
      recordatorios: true,
      encuestas: true,
      automatizaciones: true,
      auditoria: true,
      portal_paciente: true,
      mapa: true,
      subdominio: true, // Subdominio propio permitido
      custom_domain: true, // Dominio web propio (CNAME) permitido
      portal_paciente_marca: true, // Portal del paciente con marca clínica
      soporte: "prioritario",
      telemedicina: true,
      db_independiente: false,
      trial_dias: 30,
    },
    orden: 3,
  },
  {
    codigo: "business",
    nombre: "Business Enterprise",
    descripcion: "Para hospitales, redes de clínicas y centros que requieren máxima autonomía",
    precio_mensual_usd: 165,
    precio_mensual_dop: 9900,
    limite_pacientes: null, // Ilimitados
    limite_usuarios: null, // Ilimitados
    limite_dispositivos: null, // Ilimitados
    limite_profesionales: null, // Ilimitados
    caracteristicas: {
      whatsapp: true,
      recordatorios: true,
      encuestas: true,
      automatizaciones: true,
      auditoria: true,
      portal_paciente: true,
      mapa: true,
      subdominio: true,
      custom_domain: true,
      portal_paciente_marca: true,
      db_independiente: true, // Base de datos independiente dedicada
      soporte: "dedicado",
      sso: true,
      api: true,
      telemedicina: true,
      trial_dias: 30,
    },
    orden: 4,
  },
];

/**
 * Plan de contingencia / degradación automática post-trial (no visible públicamente)
 */
export const FREE_FALLBACK_PLAN: Plan = {
  codigo: "free",
  nombre: "Gratuito (Degradación)",
  descripcion: "Plan de retención básico sin expiración de datos",
  precio_mensual_usd: 0,
  precio_mensual_dop: 0,
  limite_pacientes: 25,
  limite_usuarios: 1,
  limite_dispositivos: 1,
  limite_profesionales: 1,
  caracteristicas: {
    whatsapp: true,
    recordatorios: false,
    encuestas: false,
    automatizaciones: false,
    auditoria: false,
    portal_paciente: false,
    mapa: false,
    subdominio: false,
    custom_domain: false,
    portal_paciente_marca: false,
    db_independiente: false,
    soporte: "comunidad",
  },
  orden: 99,
};

export const PLAN_FEATURES_MAP: Record<string, string[]> = {
  solo: [
    "Hasta 85 pacientes activos (85 px)",
    "1 usuario / 2 dispositivos simultáneos",
    "1 profesional de salud",
    "30 días de prueba gratis completa",
    "Agenda universal y calendario clínico",
    "Ficha clínica completa + mapa corporal",
    "WhatsApp con plantillas personalizadas",
    "Escalas y cuestionarios médicos",
    "Recetas médicas y órdenes digitales",
    "Soporte por email",
  ],
  pro: [
    "Hasta 500 pacientes activos",
    "3 usuarios / 5 dispositivos / 5 profesionales",
    "Gestión de hasta 3 clínicas afiliadas",
    "Identificador de clínica de origen por paciente",
    "Sin subdominio propio (URL compartida segura)",
    "Sin portal de paciente con marca clínica",
    "30 días de prueba gratis completa",
    "Verticales especializadas (Dental, Estética, Visión, etc.)",
    "Reportes & BI operativos",
    "Auditoría de cambios clínicos",
    "Soporte prioritario",
  ],
  plus: [
    "Hasta 1,500 pacientes activos",
    "8 usuarios / 10 dispositivos / 15 profesionales",
    "Subdominio propio (tumarca.vitalisttrack.com)",
    "Dominio personalizado (citas.tuclinica.com)",
    "Portal del paciente con marca clínica oficial",
    "30 días de prueba gratis completa",
    "ARS avanzado: planes, tarifarios y autorizaciones",
    "Teleconsulta médica encriptada WebRTC",
    "Automatizaciones y workflows de seguimiento",
    "Geolocalización, rutas y mapa de visitas",
    "2FA para administradores + exportación GDPR",
    "Soporte prioritario con SLA",
  ],
  business: [
    "Base de datos independiente configurada (Aislamiento físico)",
    "Pacientes, citas y dispositivos ilimitados",
    "Usuarios y profesionales ilimitados",
    "Subdominio + múltiples dominios con SSL dedicado",
    "Portal del paciente con marca y personalización total",
    "30 días de prueba gratis completa",
    "SSO / SAML empresarial para hospitales",
    "Acceso a API pública REST y webhooks",
    "Interoperabilidad médica FHIR / DICOM",
    "Centros, camas y quirófanos ilimitados",
    "Onboarding dedicado y migración asistida",
    "Account manager dedicado y SLA 99.9%",
  ],
};
