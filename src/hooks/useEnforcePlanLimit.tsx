import { useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePlanLimits, type PlanLimits } from "@/hooks/usePlanLimits";

type LimitKey = keyof PlanLimits;

const LABELS: Record<LimitKey, string> = {
  pacientes: "pacientes",
  usuarios: "usuarios",
  profesionales: "profesionales",
};

/**
 * Returns a guard function that returns `true` when the user is allowed to create
 * a new record of the given type, or `false` after showing a blocking toast and
 * routing the user to the upgrade page.
 */
export function useEnforcePlanLimit() {
  const { limits, refresh } = usePlanLimits();
  const navigate = useNavigate();

  const canCreate = useCallback(
    (key: LimitKey): boolean => {
      const data = limits[key];
      if (!data || data.max === null) return true;
      if (!data.reached) return true;

      toast.error(`Has alcanzado el límite de ${LABELS[key]} de tu plan`, {
        description: `Plan actual: ${data.used} / ${data.max}. Mejora tu plan para continuar.`,
        action: {
          label: "Mejorar plan",
          onClick: () => navigate("/planes"),
        },
        duration: 8000,
      });
      return false;
    },
    [limits, navigate],
  );

  return { canCreate, limits, refreshLimits: refresh };
}
