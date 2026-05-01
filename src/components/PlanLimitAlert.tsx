import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { usePlanLimits, type PlanLimits } from "@/hooks/usePlanLimits";

interface Props {
  resource?: keyof PlanLimits;
  /** Mostrar siempre la barra (no solo cerca del límite) */
  always?: boolean;
  className?: string;
}

const LABELS: Record<keyof PlanLimits, string> = {
  pacientes: "pacientes",
  usuarios: "usuarios",
  profesionales: "profesionales",
};

/**
 * Alerta visual cuando el workspace se acerca o alcanza el límite del plan.
 * - Si pctUsed >= 80% y < 100%: warning con barra y CTA suave.
 * - Si reached: error con CTA destacado.
 */
export function PlanLimitAlert({ resource = "pacientes", always = false, className }: Props) {
  const { limits } = usePlanLimits();
  const navigate = useNavigate();
  const data = limits[resource];

  if (!data || data.max === null) return null;
  if (!always && data.pctUsed < 80 && !data.reached) return null;

  const label = LABELS[resource];
  const reached = data.reached;
  const variant = reached ? "destructive" : "default";

  return (
    <Alert variant={variant as any} className={className}>
      {reached ? <AlertCircle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
      <AlertTitle>
        {reached
          ? `Límite de ${label} alcanzado`
          : `Estás cerca del límite de ${label}`}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          Plan actual: <strong>{data.used} / {data.max}</strong> {label}.
          {reached
            ? " No podrás crear más hasta mejorar tu plan."
            : ` Te quedan ${Math.max(0, data.max - data.used)} disponibles.`}
        </p>
        <Progress value={data.pctUsed} className="h-2" />
        <div className="flex justify-end pt-1">
          <Button size="sm" variant={reached ? "default" : "outline"} onClick={() => navigate("/planes")}>
            Mejorar plan
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
