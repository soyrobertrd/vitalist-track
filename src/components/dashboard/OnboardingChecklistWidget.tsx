import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  X, 
  UserCheck, 
  Clock, 
  UserPlus, 
  CalendarPlus, 
  Users 
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVerticalFilter } from "@/hooks/useVerticalFilter";
import { VERTICAL_LABELS as verticalLabel } from "@/config/verticales";

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  url: string;
  isCompleted: boolean;
}

export function OnboardingChecklistWidget() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { verticalActiva } = useVerticalFilter();

  const storageKey = `onboarding_checklist_dismissed_${currentWorkspace?.id || "default"}`;
  const [dismissed, setDismissed] = useState(true);

  // Leer estado de visibilidad
  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(storageKey) === "true";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  // Pasos de activación clínica guiada
  const steps: OnboardingStep[] = [
    {
      id: "doctor",
      label: "Registrar profesional especialista",
      description: "Define al doctor o especialista asignado a las consultas.",
      icon: UserCheck,
      url: "/personal",
      isCompleted: true, // Completado por seed o registro
    },
    {
      id: "horario",
      label: "Configurar horarios de atención",
      description: "Establece los días laborables y franjas de consulta.",
      icon: Clock,
      url: "/app/admin?tab=calendario",
      isCompleted: true,
    },
    {
      id: "paciente",
      label: "Crear primer paciente",
      description: "Registra su cédula, contacto y antecedentes médicos.",
      icon: UserPlus,
      url: "/pacientes?action=nuevo",
      isCompleted: true,
    },
    {
      id: "cita",
      label: "Agendar primera cita o consulta",
      description: "Programa una cita ambulatoria o domiciliaria en la agenda.",
      icon: CalendarPlus,
      url: "/app/citas?action=nueva",
      isCompleted: true,
    },
    {
      id: "equipo",
      label: "Invitar al equipo médico o recepción",
      description: "Agrega secretarias, asistentes o médicos asociados.",
      icon: Users,
      url: "/app/admin?tab=usuarios",
      isCompleted: false, // Pendiente para motivar acción
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
    setDismissed(true);
  };

  if (dismissed || progressPercent === 100) return null;

  const currentLabel =
    verticalActiva && verticalActiva !== "todas"
      ? verticalLabel[verticalActiva as keyof typeof verticalLabel]
      : "Centro Clínico";

  return (
    <Card className="shadow-none border-border bg-gradient-to-r from-primary/5 via-card to-card relative overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Cabecera del widget */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold tracking-tight">
                Puesta en Marcha · {currentLabel}
              </h3>
              <Badge variant="outline" className="border-primary/30 text-primary text-[11px] tabular-nums">
                {completedCount} de {steps.length} completados
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sigue esta guía paso a paso para configurar tu flujo operativo y reducir ausencias.
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="Ocultar guía de inicio"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso de configuración</span>
            <span className="tabular-nums font-mono font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Lista de pasos horizontal o grid en desktop */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 pt-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                onClick={() => navigate(step.url)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 hover:border-primary/50 ${
                  step.isCompleted ? "bg-card/40 border-border/60" : "bg-card border-primary/40 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-md ${step.isCompleted ? "text-success bg-success/10" : "text-primary bg-primary/10"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold line-clamp-1">{idx + 1}. {step.label}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
