import { useEffect, useState } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace, type Plan } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

const FEATURE_LABELS: Record<string, string> = {
  whatsapp: "Mensajes y recordatorios por WhatsApp",
  recordatorios: "Recordatorios automáticos por email",
  encuestas: "Encuestas de satisfacción",
  automatizaciones: "Automatizaciones avanzadas",
  auditoria: "Auditoría completa de cambios",
  portal_paciente: "Portal del paciente",
  mapa: "Mapa operativo y rutas",
  sso: "SSO / SAML empresarial",
  api: "Acceso a API",
};

const SUPPORT_LABELS: Record<string, string> = {
  comunidad: "Soporte por comunidad",
  email: "Soporte por email",
  prioritario: "Soporte prioritario",
  dedicado: "Account manager dedicado",
};

export default function Planes() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace, currentPlan, refresh } = useWorkspace();
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("planes")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });
      if (error) toast.error("No se pudo cargar el catálogo de planes");
      setPlanes((data || []) as Plan[]);
      setLoading(false);
    })();
  }, []);

  const handleSelectPlan = async (codigo: string) => {
    if (!currentWorkspace) {
      toast.error("Selecciona primero un workspace");
      return;
    }
    if (currentWorkspace.role !== "owner" && currentWorkspace.role !== "admin") {
      toast.error("Solo el owner o admin del workspace puede cambiar el plan");
      return;
    }
    if (codigo === currentWorkspace.plan_codigo) {
      toast.info("Ese ya es tu plan actual");
      return;
    }

    setChanging(codigo);
    try {
      const { error: upErr } = await supabase
        .from("workspaces")
        .update({ plan_codigo: codigo })
        .eq("id", currentWorkspace.id);
      if (upErr) throw upErr;

      await supabase.from("subscripciones").insert({
        workspace_id: currentWorkspace.id,
        plan_codigo: codigo,
        proveedor: "manual",
        estado: "activo",
      });

      toast.success("Plan actualizado correctamente");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Error actualizando plan");
    } finally {
      setChanging(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Planes y precios</h1>
        <p className="text-muted-foreground mt-2">
          Elige el plan que mejor se adapte a tu práctica. Cambia o cancela cuando quieras.
        </p>
        {currentPlan && (
          <Badge variant="secondary" className="mt-3">
            <Crown className="h-3 w-3 mr-1" />
            Tu plan actual: {currentPlan.nombre}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {planes.map((plan) => {
          const isCurrent = currentWorkspace?.plan_codigo === plan.codigo;
          const isPro = plan.codigo === "pro";
          return (
            <Card
              key={plan.codigo}
              className={`flex flex-col ${isPro ? "border-primary shadow-lg shadow-primary/10 relative" : ""}`}
            >
              {isPro && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Más popular</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.nombre}
                  {isCurrent && <Badge variant="outline">Actual</Badge>}
                </CardTitle>
                <CardDescription>{plan.descripcion}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">${plan.precio_mensual_usd}</span>
                  <span className="text-muted-foreground"> /mes</span>
                  {plan.precio_mensual_dop > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ó RD${plan.precio_mensual_dop.toLocaleString()} DOP/mes
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      {plan.limite_pacientes ? `Hasta ${plan.limite_pacientes.toLocaleString()} pacientes` : "Pacientes ilimitados"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      {plan.limite_usuarios ? `${plan.limite_usuarios} usuarios` : "Usuarios ilimitados"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>
                      {plan.limite_profesionales ? `${plan.limite_profesionales} profesionales` : "Profesionales ilimitados"}
                    </span>
                  </li>
                  {Object.entries(plan.caracteristicas || {})
                    .filter(([k, v]) => v && k !== "soporte" && FEATURE_LABELS[k])
                    .map(([key]) => (
                      <li key={key} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{FEATURE_LABELS[key]}</span>
                      </li>
                    ))}
                  {plan.caracteristicas?.soporte && (
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{SUPPORT_LABELS[plan.caracteristicas.soporte] || plan.caracteristicas.soporte}</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPro ? "default" : "outline"}
                  disabled={isCurrent || changing !== null}
                  onClick={() => handleSelectPlan(plan.codigo)}
                >
                  {changing === plan.codigo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Plan actual"
                  ) : (
                    "Seleccionar"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto pt-4 border-t">
        <p>
          Próximamente: pago automático con <strong>Stripe</strong> (internacional),{" "}
          <strong>Azul / CardNet</strong> (RD), o <strong>transferencia / factura mensual</strong> para venta asistida.
        </p>
        <p className="mt-2">
          ¿Necesitas un plan empresarial on-premise o personalizado?{" "}
          <a href="mailto:ventas@health-app.com" className="text-primary underline">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
}
