import { useLocation } from "react-router-dom";
import { useFreePlan } from "@/hooks/useFreePlan";

/**
 * Plan free write access:
 * Solo se permite crear/editar dentro de:
 *   - Dashboard
 *   - Agenda / Calendario / Recepción
 *   - Pacientes (lista y detalle)
 *   - Ficha clínica del paciente (rutas /pacientes/*)
 *
 * El resto de páginas son de solo lectura (incluso si están visibles).
 */
const FREE_WRITE_PATHS = [
  /^\/dashboard$/,
  /^\/agenda(\/.*)?$/,
  /^\/calendario(\/.*)?$/,
  /^\/recepcion(\/.*)?$/,
  /^\/pacientes(\/.*)?$/,
  /^\/atencion-paciente(\/.*)?$/,
];

export function useFreePlanWriteAccess() {
  const { isFree } = useFreePlan();
  const location = useLocation();

  const path = location.pathname;
  const allowedHere = FREE_WRITE_PATHS.some((rx) => rx.test(path));
  const canWrite = !isFree || allowedHere;
  const isReadOnly = isFree && !allowedHere;

  return { isFree, canWrite, isReadOnly };
}
