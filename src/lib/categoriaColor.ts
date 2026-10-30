import type { KpiVariant } from "@/components/common/ClinicalKpiCard";

// Color de cada categoría del menú lateral. Rutas copiadas de Layout.tsx (menuItems):
// shortcut: si se añade una ruta al menú hay que añadirla aquí; si crece, extraer menuItems a un módulo compartido.
const CATEGORIAS: { variant: KpiVariant; rutas: string[] }[] = [
  { variant: "primary", rutas: ["/app"] }, // /app
  { variant: "blue", rutas: ["/agenda", "/app/citas", "/calendario", "/recepcion", "/rutas", "/llamadas", "/agenda-universal", "/pacientes", "/sospechosos", "/atencion-paciente", "/odontograma", "/dental-care", "/aesthetic-pro", "/vision-care", "/vet-care", "/recovery-care", "/psicologia-pro"] }, // /agenda
  { variant: "rose", rutas: ["/clinico", "/urgencias-triage", "/escalas-medicas", "/notas-medicas", "/hospitalizacion", "/alta-hospitalaria", "/rondas-medicas", "/enfermeria", "/uci", "/quirofano", "/censo-camas", "/edificacion-hospitalaria", "/oncologia", "/cardiologia", "/diabetes-endocrinologia", "/pediatria", "/ginecologia-obstetricia", "/neurologia", "/nefrologia", "/neumologia", "/gastroenterologia", "/traumatologia-ortopedia", "/urologia", "/dermatologia", "/maternidad-neonatologia", "/consentimientos-informados", "/ordenes-medicas", "/alertas-clinicas", "/protocolos-clinicos", "/workflows-clinicos", "/reglas-clinicas", "/catalogos-clinicos", "/vademecum"] }, // /clinico
  { variant: "purple", rutas: ["/diagnostico", "/laboratorio", "/laboratorio-avanzado", "/imagenologia", "/visor-dicom", "/banco-sangre", "/banco-sangre-avanzado"] }, // /diagnostico
  { variant: "teal", rutas: ["/recursos", "/consultorios", "/farmacia", "/nutricion", "/rehabilitacion", "/esterilizacion", "/morgue", "/mantenimiento", "/lavanderia", "/residuos", "/seguridad-fisica", "/trabajo-social", "/docencia"] }, // /recursos
  { variant: "emerald", rutas: ["/financiero", "/finanzas", "/facturacion-electronica-rd", "/comisiones-empleados", "/contabilidad", "/nomina", "/compras", "/forecast-ingresos", "/ar-aging", "/costeo-servicios"] }, // /financiero
  { variant: "amber", rutas: ["/equipo", "/personal", "/turnos-personal", "/rrhh", "/organizaciones", "/evaluaciones-desempeno", "/metas-incentivos", "/capacitaciones"] }, // /equipo
  { variant: "indigo", rutas: ["/encuestas"] }, // /encuestas
  { variant: "primary", rutas: ["/automatizaciones"] }, // /automatizaciones
  { variant: "teal", rutas: ["/operaciones", "/workflows-avanzados", "/tareas", "/chat", "/firmas"] }, // /operaciones
  { variant: "teal", rutas: ["/inventario"] }, // /inventario
  { variant: "indigo", rutas: ["/crm", "/segmentacion", "/perfil-valor", "/referidos", "/beneficios-usuarios"] }, // /crm
  { variant: "blue", rutas: ["/turnos"] }, // /turnos
  { variant: "primary", rutas: ["/avanzado", "/quirofano-avanzado", "/interoperabilidad", "/pwa-offline", "/calidad", "/centro-comando"] }, // /avanzado
  { variant: "blue", rutas: ["/telemedicina"] }, // /telemedicina
  { variant: "indigo", rutas: ["/reportes-bi", "/reportes", "/reportes-programados", "/reportes-regulatorios", "/dashboard-bi", "/reportes/dental", "/reportes/vision", "/reportes/aesthetic", "/reportes/recovery", "/psicologia/reportes"] }, // /reportes-bi
  { variant: "primary", rutas: ["/config-grupo", "/configuracion-admin", "/verticales", "/afiliaciones", "/plantillas", "/api-citas", "/auditoria", "/checklist-rls"] }, // /config-grupo
  { variant: "primary", rutas: ["/soporte"] }, // /soporte
];

const POR_RUTA = new Map(CATEGORIAS.flatMap((c) => c.rutas.map((r) => [r, c.variant] as const)));

/** Variante de color de la categoría a la que pertenece la ruta; "primary" si no está en el menú. */
export function varianteDeRuta(pathname: string): KpiVariant {
  return POR_RUTA.get(pathname) ?? "primary";
}
