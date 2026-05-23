import { useUserProfile } from "./useUserProfile";
import { useUserRole } from "./useUserRole";
import { useVertical } from "@/contexts/VerticalContext";

/**
 * Determina si el usuario actual puede actuar (crear/editar) dentro de una
 * vertical específica, según `personal_salud.vertical`.
 *
 * Admin/coordinador siempre pueden. Profesionales sin vertical asignada
 * pueden actuar en cualquiera (compatibilidad hacia atrás).
 */
export function useProfessionalVertical() {
  const { profile, loading } = useUserProfile();
  const { isAdmin } = useUserRole();
  const { verticalActiva } = useVertical();

  const verticalProfesional = profile?.vertical_profesional ?? null;

  const canActInVertical = (vertical?: string | null): boolean => {
    if (loading) return true;
    if (isAdmin) return true;
    if (!verticalProfesional) return true; // sin restricción explícita
    if (!vertical) return true;
    return verticalProfesional === vertical;
  };

  const canActHere = canActInVertical(verticalActiva === "todas" ? null : (verticalActiva as string));

  return {
    verticalProfesional,
    canActInVertical,
    canActHere,
    loading,
  };
}
