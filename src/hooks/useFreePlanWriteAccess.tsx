import { useLocation } from "react-router-dom";
import { useFreePlan } from "@/hooks/useFreePlan";

/**
 * Plan free write access:
 * Solo se permite crear/editar dentro de:
 *   - Dashboard
 *   - Agenda / Calendario / Recepción
 *   - Pacientes (lista y detalle)
 *   - Ficha clínica del paciente (rutas /pacientes/*)
 *   - Psicología: solo pantallas básicas (sesiones, fichas, notas narrativas, PHQ-9/GAD-7)
 *
 * Bloqueado en Free para psicología: telepsicología, reportes BI avanzados,
 * prescripción psiquiátrica, paquetes, casos de nicho, supervisor lock.
 */
const FREE_WRITE_PATHS = [
  /^\/dashboard$/,
  /^\/agenda(\/.*)?$/,
  /^\/calendario(\/.*)?$/,
  /^\/recepcion(\/.*)?$/,
  /^\/pacientes(\/.*)?$/,
  /^\/atencion-paciente(\/.*)?$/,
  /^\/psicologia-pro$/,
];

const FREE_BLOCKED_PSICO_TABS = ["psiquiatria", "paquetes", "tests-avanzados"];
const FREE_BLOCKED_PSICO_ROUTES = [
  /^\/psicologia\/teleconsulta(\/.*)?$/,
  /^\/psicologia\/reportes$/,
  /^\/psicologia\/auditoria-notas$/,
];

export function useFreePlanWriteAccess() {
  const { isFree } = useFreePlan();
  const location = useLocation();
  const path = location.pathname;

  const blockedPsico = FREE_BLOCKED_PSICO_ROUTES.some(rx => rx.test(path));
  const allowedHere = FREE_WRITE_PATHS.some(rx => rx.test(path)) && !blockedPsico;
  const canWrite = !isFree || allowedHere;
  const isReadOnly = isFree && !allowedHere;

  return { isFree, canWrite, isReadOnly, blockedPsico, FREE_BLOCKED_PSICO_TABS };
}
