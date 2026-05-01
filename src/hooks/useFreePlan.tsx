import { useWorkspace } from "@/contexts/WorkspaceContext";

/**
 * Detecta si el workspace actual está en plan gratuito (free).
 * Usado para limitar la visibilidad de módulos en el sidebar.
 *
 * Plan free: solo Dashboard, Agenda (calendario), Pacientes (limitado), Ficha clínica.
 */
export function useFreePlan() {
  const { currentPlan } = useWorkspace();
  const codigo = (currentPlan?.codigo || "").toLowerCase();
  const nombre = (currentPlan?.nombre || "").toLowerCase();
  const isFree =
    codigo === "free" ||
    codigo === "gratis" ||
    codigo === "gratuito" ||
    nombre.includes("gratis") ||
    nombre.includes("gratuito") ||
    nombre.includes("free");
  return { isFree, plan: currentPlan };
}
