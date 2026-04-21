import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, Users, UserCog, HeartPulse } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function PlanLimitsPanel() {
  const { limits, loading } = usePlanLimits();
  const { currentPlan, currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  if (loading || !currentWorkspace) return null;

  const items = [
    { key: "pacientes", label: "Pacientes", icon: HeartPulse, data: limits.pacientes },
    { key: "profesionales", label: "Profesionales", icon: UserCog, data: limits.profesionales },
    { key: "usuarios", label: "Usuarios", icon: Users, data: limits.usuarios },
  ];

  const anyReached = items.some((i) => i.data.reached);
  const anyNearLimit = items.some((i) => i.data.max && i.data.pctUsed >= 80);

  return (
    <Card className={anyReached ? "border-destructive/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            Límites del plan {currentPlan?.nombre || currentWorkspace.plan_codigo}
          </CardTitle>
          {(anyReached || anyNearLimit) && (
            <Button size="sm" variant={anyReached ? "default" : "outline"} onClick={() => navigate("/planes")}>
              Mejorar plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ key, label, icon: Icon, data }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">
                  {data.used}{data.max !== null ? ` / ${data.max}` : " / ∞"}
                </span>
                {data.reached && <Badge variant="destructive" className="text-[10px]">Límite</Badge>}
              </div>
            </div>
            {data.max !== null && (
              <Progress
                value={data.pctUsed}
                className={`h-1.5 ${data.reached ? "[&>div]:bg-destructive" : data.pctUsed >= 80 ? "[&>div]:bg-amber-500" : ""}`}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
