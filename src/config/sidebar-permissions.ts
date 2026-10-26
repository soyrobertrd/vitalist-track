import type { VerticalTipo } from "@/contexts/VerticalContext";

export type PlanCodigo = "solo" | "pro" | "plus" | "business" | "free";

export interface SidebarModulePermission {
  moduleKey: string;
  minPlan: PlanCodigo; // Nivel de plan mínimo requerido para ver esta sección
  allowedVerticales?: VerticalTipo[]; // Si no se especifica, aplica a todas las verticales
  adminOnly?: boolean;
}

/**
 * Jerarquía numérica de planes para evaluación rápida
 */
export const PLAN_HIERARCHY: Record<PlanCodigo, number> = {
  free: 0,
  solo: 1, // Básico (USD 15 / 85 px / 1 usuario / 2 disp)
  pro: 2, // Pro Consultorios (USD 35 / 500 px / 3 usuarios / 5 disp / 5 prof / 3 clínicas)
  plus: 3, // Clínica Plus (USD 85 / 1500 px / 8 usuarios / 10 disp / 15 prof / subdominio)
  business: 4, // Business Enterprise (USD 165 / Ilimitado / BD Independiente)
};

/**
 * Matriz canónica de reglas de visibilidad del Sidebar por Módulo y Plan
 */
export const SIDEBAR_RULES: Record<string, SidebarModulePermission> = {
  // 1. Dashboard principal (Visible en todos los planes)
  dashboard: {
    moduleKey: "dashboard",
    minPlan: "solo",
  },

  // 2. Agenda y Calendario
  agenda: {
    moduleKey: "agenda",
    minPlan: "solo",
  },
  visitas: {
    moduleKey: "visitas",
    minPlan: "plus", // Rutas y visitas en terreno
    allowedVerticales: ["clinica", "recovery"],
  },

  // 3. Pacientes y Fichas Clínicas
  pacientes: {
    moduleKey: "pacientes",
    minPlan: "solo",
  },
  odontograma: {
    moduleKey: "odontograma",
    minPlan: "pro",
    allowedVerticales: ["dental"],
  },
  aesthetic_evaluaciones: {
    moduleKey: "aesthetic_evaluaciones",
    minPlan: "pro",
    allowedVerticales: ["aesthetic"],
  },
  vision_recetas: {
    moduleKey: "vision_recetas",
    minPlan: "pro",
    allowedVerticales: ["vision"],
  },
  psicologia_fichas: {
    moduleKey: "psicologia_fichas",
    minPlan: "pro",
    allowedVerticales: ["psicologia"],
  },
  recovery_planes: {
    moduleKey: "recovery_planes",
    minPlan: "pro",
    allowedVerticales: ["recovery"],
  },

  // 4. Módulo Clínico Hospitalario (Alta Complejidad - Requiere Business Enterprise)
  clinico: {
    moduleKey: "clinico",
    minPlan: "business", // Hospitalización, UCI, Quirófano, Camas requieren Business
    allowedVerticales: ["clinica"],
  },

  // 5. Diagnóstico Hospitalario (Laboratorio, DICOM, Banco de Sangre)
  diagnostico: {
    moduleKey: "diagnostico",
    minPlan: "business",
    allowedVerticales: ["clinica"],
  },

  // 6. Recursos e Infraestructura (Consultorios, Sillones, Cabinas, Farmacia)
  recursos: {
    moduleKey: "recursos",
    minPlan: "plus", // Gestión de múltiples salas, sillones, cabinas
  },

  // 7. Financiero y Facturación
  financiero: {
    moduleKey: "financiero",
    minPlan: "pro", // Pro tiene caja diaria; Plus desbloquea ARS y contabilidad
    adminOnly: true,
  },
  financiero_basico: {
    moduleKey: "financiero_basico",
    minPlan: "pro", // Caja diaria y recibos simples
  },
  financiero_avanzado: {
    moduleKey: "financiero_avanzado",
    minPlan: "plus", // ARS, tarifarios, nómina, contabilidad
  },

  // 8. Equipo y Recursos Humanos
  equipo: {
    moduleKey: "equipo",
    minPlan: "pro", // Pro permite hasta 5 profesionales, Plus 15, Business ilimitado
    adminOnly: true,
  },

  // 9. Automatizaciones, Workflows y Firmas
  automatizaciones: {
    moduleKey: "automatizaciones",
    minPlan: "plus",
  },
  operaciones: {
    moduleKey: "operaciones",
    minPlan: "plus",
  },

  // 10. Inventario
  inventario: {
    moduleKey: "inventario",
    minPlan: "pro",
  },

  // 11. CRM, Marketing y Fidelización
  crm: {
    moduleKey: "crm",
    minPlan: "plus",
    adminOnly: true,
  },

  // 12. Turnos y Colas de Sala de Espera
  turnos: {
    moduleKey: "turnos",
    minPlan: "plus",
    allowedVerticales: ["clinica", "dental"],
  },

  // 13. Telemedicina
  telemedicina: {
    moduleKey: "telemedicina",
    minPlan: "plus",
  },

  // 14. Reportes y Business Intelligence
  reportes: {
    moduleKey: "reportes",
    minPlan: "pro",
  },
  reportes_avanzados: {
    moduleKey: "reportes_avanzados",
    minPlan: "plus",
  },

  // 15. Avanzado (HL7/FHIR, Centro de Comando, Visor DICOM)
  avanzado: {
    moduleKey: "avanzado",
    minPlan: "business",
    allowedVerticales: ["clinica"],
  },

  // 16. Configuración y Dominios
  admin_general: {
    moduleKey: "admin_general",
    minPlan: "solo",
  },
  config: {
    moduleKey: "config",
    minPlan: "solo",
    adminOnly: true,
  },
  soporte: {
    moduleKey: "soporte",
    minPlan: "solo",
  },
  subdominios_custom_url: {
    moduleKey: "subdominios_custom_url",
    minPlan: "plus", // Pro Consultorios NO lleva subdominio propio
  },
  base_datos_independiente: {
    moduleKey: "base_datos_independiente",
    minPlan: "business", // Exclusivo Business Enterprise
  },
};

/**
 * Matriz de sub-rutas específicas con requerimiento mínimo de plan
 */
export const SUBITEM_PLAN_RULES: Record<string, PlanCodigo> = {
  // Agenda
  "/visitas": "plus",
  "/rutas": "plus",
  
  // Financiero
  "/finanzas?tab=caja": "pro",
  "/finanzas?tab=devoluciones": "pro",
  "/finanzas?tab=aseguradoras": "plus",
  "/finanzas?tab=tarifarios": "plus",
  "/finanzas?tab=autorizaciones": "plus",
  "/finanzas?tab=reclamaciones": "plus",
  "/contabilidad": "plus",
  "/nomina": "plus",
  "/compras": "plus",
  "/forecast-ingresos": "plus",
  "/ar-aging": "plus",
  "/costeo-servicios": "plus",

  // Reportes
  "/reportes": "pro",
  "/reportes-programados": "plus",
  "/reportes-regulatorios": "plus",
  "/dashboard-bi": "plus",
};

/**
 * Evalúa si un ítem de menú del Sidebar debe mostrarse u ocultarse
 * considerando el plan contratado, la vertical clínica activa y los permisos de usuario.
 */
export function isSidebarItemVisible({
  moduleKey,
  path,
  verticales,
  adminOnly,
  currentPlanCodigo,
  activeVertical,
  isAdmin,
}: {
  moduleKey?: string;
  path?: string;
  verticales?: VerticalTipo[];
  adminOnly?: boolean;
  currentPlanCodigo?: string;
  activeVertical?: VerticalTipo | "todas";
  isAdmin?: boolean;
}): boolean {
  // 1. Chequeo de rol administrativo
  if (adminOnly && !isAdmin) {
    return false;
  }

  // 2. Chequeo de vertical clínica activa
  if (verticales && verticales.length > 0 && activeVertical && activeVertical !== "todas") {
    if (!verticales.includes(activeVertical)) {
      return false;
    }
  }

  const effectivePlan: PlanCodigo = (currentPlanCodigo as PlanCodigo) || "solo";
  const userPlanLevel = PLAN_HIERARCHY[effectivePlan] ?? 1;

  // 3. Chequeo de sub-ruta específica si tiene restricción de plan
  if (path && SUBITEM_PLAN_RULES[path]) {
    const requiredLevel = PLAN_HIERARCHY[SUBITEM_PLAN_RULES[path]] ?? 1;
    if (userPlanLevel < requiredLevel) {
      return false;
    }
  }

  // 4. Chequeo de permisos basados en el plan de suscripción para el módulo
  if (moduleKey && SIDEBAR_RULES[moduleKey]) {
    const rule = SIDEBAR_RULES[moduleKey];
    const requiredPlanLevel = PLAN_HIERARCHY[rule.minPlan] ?? 1;

    if (userPlanLevel < requiredPlanLevel) {
      return false;
    }

    if (rule.allowedVerticales && activeVertical && activeVertical !== "todas") {
      if (!rule.allowedVerticales.includes(activeVertical)) {
        return false;
      }
    }
  }

  return true;
}

