import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspaceLocaleEditor } from "@/components/WorkspaceLocaleEditor";
import { Sparkles, Building2, Plus, X, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CANONICAL_PLANES } from "@/config/planes";

interface AdminGeneralTabProps {
  currentWorkspace: any;
  usuariosCount: number;
  userLimit: number;
  userUsagePercent: number;
  pacientesCount?: number;
  profesionalesCount?: number;
  onRefreshWorkspace?: () => void;
}

export function AdminGeneralTab({
  currentWorkspace,
  usuariosCount,
  userLimit,
  userUsagePercent,
  pacientesCount = 12,
  profesionalesCount = 1,
  onRefreshWorkspace,
}: AdminGeneralTabProps) {
  const navigate = useNavigate();

  const [crmName, setCrmName] = useState(
    currentWorkspace?.configuracion?.crm_name || currentWorkspace?.nombre || "Health CRM"
  );
  const [formatoFecha, setFormatoFecha] = useState(
    currentWorkspace?.configuracion?.formato_fecha || "dd/mm/yyyy"
  );
  const [verticalPrincipal, setVerticalPrincipal] = useState(
    currentWorkspace?.configuracion?.vertical_principal || "clinica"
  );
  const [clinicasAsociadas, setClinicasAsociadas] = useState<string[]>(
    currentWorkspace?.configuracion?.clinicas_asociadas || []
  );
  const [nuevaClinica, setNuevaClinica] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);

  useEffect(() => {
    if (currentWorkspace?.configuracion) {
      if (currentWorkspace.configuracion.crm_name) {
        setCrmName(currentWorkspace.configuracion.crm_name);
      }
      if (currentWorkspace.configuracion.formato_fecha) {
        setFormatoFecha(currentWorkspace.configuracion.formato_fecha);
      }
      if (currentWorkspace.configuracion.vertical_principal) {
        setVerticalPrincipal(currentWorkspace.configuracion.vertical_principal);
      }
      if (Array.isArray(currentWorkspace.configuracion.clinicas_asociadas)) {
        setClinicasAsociadas(currentWorkspace.configuracion.clinicas_asociadas);
      }
    }
  }, [currentWorkspace]);

  const handleAddClinica = () => {
    const trimmed = nuevaClinica.trim();
    if (!trimmed) return;
    if (clinicasAsociadas.length >= 3) {
      toast.error("El plan Pro Consultorios permite registrar un máximo de 3 clínicas asociadas.");
      return;
    }
    if (clinicasAsociadas.includes(trimmed)) {
      toast.error("Esta clínica ya está en la lista.");
      return;
    }
    setClinicasAsociadas([...clinicasAsociadas, trimmed]);
    setNuevaClinica("");
  };

  const handleRemoveClinica = (index: number) => {
    setClinicasAsociadas(clinicasAsociadas.filter((_, i) => i !== index));
  };

  const handleSaveGeneralConfig = async () => {
    if (!currentWorkspace?.id) return;
    setSavingGeneral(true);
    try {
      const currentConfig = currentWorkspace.configuracion || {};
      const updatedConfig = {
        ...currentConfig,
        crm_name: crmName,
        formato_fecha: formatoFecha,
        vertical_principal: verticalPrincipal,
        clinicas_asociadas: clinicasAsociadas,
      };

      const { error } = await supabase
        .from("workspaces")
        .update({
          configuracion: updatedConfig,
          nombre: crmName,
        })
        .eq("id", currentWorkspace.id);

      if (error) throw error;
      toast.success("Configuración general guardada exitosamente");
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err: any) {
      console.error("Error saving general config:", err);
      toast.error(err.message || "Error al guardar la configuración");
    } finally {
      setSavingGeneral(false);
    }
  };

  const currentPlan =
    CANONICAL_PLANES.find((p) => p.codigo === currentWorkspace?.plan_codigo) ?? CANONICAL_PLANES[0];

  const esProConsultorios =
    currentWorkspace?.plan_codigo === "pro" ||
    currentWorkspace?.plan_codigo === "clinica" ||
    currentWorkspace?.plan_codigo === "enterprise";

  // Cuotas y porcentajes
  // null = ilimitado
  const pacienteLimit = currentPlan.limite_pacientes ?? 999999;
  const isPacientesIlimitados = pacienteLimit >= 999999;
  const pacientesPercent = isPacientesIlimitados
    ? 0
    : Math.min(100, Math.round((pacientesCount / pacienteLimit) * 100));

  const profLimit = currentPlan.limite_profesionales ?? 999999;
  const isProfIlimitados = profLimit >= 999999;
  const profPercent = isProfIlimitados
    ? 0
    : Math.min(100, Math.round((profesionalesCount / profLimit) * 100));

  const isAnyHighUsage = userUsagePercent >= 80 || pacientesPercent >= 80 || profPercent >= 80;

  const reservaUrl = `${window.location.origin}/reservar/${currentWorkspace?.slug}`;

  return (
    <div className="space-y-6">
      {/* Tarjeta Plan y Uso (Fase 5 - punto 4) */}
      <GlassCard className="p-6 space-y-5 shadow-none border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight">Capacidad y Cuota del Plan</h3>
              <Badge variant="outline" className="capitalize text-xs font-semibold border-primary/30 text-primary">
                {currentPlan?.nombre || "Básico"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Límites contratados para {currentWorkspace?.nombre || "tu centro"} (USD ${currentPlan?.precio_mensual_usd ?? 15}/mes)
            </p>
          </div>
          {isAnyHighUsage && (
            <Button size="sm" onClick={() => navigate("/app/planes")} className="gap-1.5 shadow-none">
              <Sparkles className="h-4 w-4" />
              Mejorar Plan
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* 1. Pacientes Activos */}
          <div className="space-y-2 p-3.5 border rounded-lg bg-card">
            <div className="flex justify-between text-xs font-medium">
              <span>Pacientes Activos</span>
              <span className="tabular-nums font-mono">
                {isPacientesIlimitados ? `${pacientesCount} (Ilimitados)` : `${pacientesCount} / ${pacienteLimit}`}
              </span>
            </div>
            <Progress value={pacientesPercent} className="h-2" />
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {isPacientesIlimitados ? "Capacidad ilimitada" : `${pacientesPercent}% de cuota mensual`}
            </p>
          </div>

          {/* 2. Profesionales Médicos */}
          <div className="space-y-2 p-3.5 border rounded-lg bg-card">
            <div className="flex justify-between text-xs font-medium">
              <span>Profesionales Médicos</span>
              <span className="tabular-nums font-mono">
                {isProfIlimitados ? `${profesionalesCount} (Ilimitados)` : `${profesionalesCount} / ${profLimit}`}
              </span>
            </div>
            <Progress value={profPercent} className="h-2" />
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {isProfIlimitados ? "Capacidad ilimitada" : `${profPercent}% de cuota de doctores`}
            </p>
          </div>

          {/* 3. Usuarios de Equipo */}
          <div className="space-y-2 p-3.5 border rounded-lg bg-card">
            <div className="flex justify-between text-xs font-medium">
              <span>Usuarios del Sistema</span>
              <span className="tabular-nums font-mono">
                {userLimit >= 999999 ? `${usuariosCount} (Ilimitados)` : `${usuariosCount} / ${userLimit}`}
              </span>
            </div>
            <Progress value={userUsagePercent} className="h-2" />
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {userLimit >= 999999 ? "Acceso multi-usuario ilimitado" : `${userUsagePercent}% de cuentas activas`}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Enlace público de citas (todos los planes, sin límite de reservas) */}
      {currentWorkspace?.slug && (
        <GlassCard className="p-6 space-y-3 shadow-none">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Enlace de citas en línea</h3>
            <p className="text-sm text-muted-foreground">
              {currentWorkspace.plan_codigo === "free"
                ? "Tus pacientes reservan sin límite. Las citas llegan con sus datos de contacto, sin crear la ficha del paciente."
                : currentWorkspace.plan_codigo === "solo"
                  ? "Tus pacientes reservan sin límite. Las citas llegan marcadas como «Pendiente de registrar» para que agregues al paciente."
                  : "Tus pacientes reservan sin límite y se registran automáticamente como pacientes del centro."}
            </p>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={reservaUrl} aria-label="Enlace de citas" className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(reservaUrl).then(
                  () => toast.success("Enlace copiado"),
                  () => toast.error("No se pudo copiar el enlace")
                );
              }}
            >
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
              Copiar
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Ajustes Generales del Workspace */}
      <GlassCard className="p-6 space-y-6 shadow-none">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Configuración General del Centro</h3>
          <p className="text-xs text-muted-foreground">Identidad institucional y formato regional</p>
        </div>
        <div className="grid gap-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="crmName">Nombre de la Institución / CRM</Label>
            <Input
              id="crmName"
              value={crmName}
              onChange={(e) => setCrmName(e.target.value)}
              placeholder="Ej: Centro Odontológico Robles"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verticalPrincipal">Especialidad / Vertical Principal</Label>
            <Select value={verticalPrincipal} onValueChange={setVerticalPrincipal}>
              <SelectTrigger id="verticalPrincipal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinica">Hospital / Clínica General</SelectItem>
                <SelectItem value="dental">Odontología</SelectItem>
                <SelectItem value="aesthetic">Medicina Estética & Cirugía</SelectItem>
                <SelectItem value="recovery">Recovery Care</SelectItem>
                <SelectItem value="vision">VisionCare Pro</SelectItem>
                <SelectItem value="psicologia">Psicología & Psiquiatría</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formatoFecha">Formato de Fecha Predeterminado</Label>
            <Select value={formatoFecha} onValueChange={setFormatoFecha}>
              <SelectTrigger id="formatoFecha">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (26/10/2026)</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD (2026-10-26)</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY (10/26/2026)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Clínicas de Origen (Pro Consultorios: hasta 3 clínicas asociadas) */}
          {esProConsultorios && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">
                  Clínicas Asociadas de Consulta (Plan Pro Consultorios)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Configura hasta 3 clínicas u hospitales donde prestas servicios externos para
                clasificar el origen de cada paciente.
              </p>

              <div className="flex gap-2">
                <Input
                  value={nuevaClinica}
                  onChange={(e) => setNuevaClinica(e.target.value)}
                  placeholder="Ej: Clínica Abreu, Hospiten..."
                  disabled={clinicasAsociadas.length >= 3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddClinica();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddClinica}
                  disabled={clinicasAsociadas.length >= 3 || !nuevaClinica.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              {clinicasAsociadas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {clinicasAsociadas.map((clinica, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="gap-1.5 py-1 px-2.5 text-xs font-normal"
                    >
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {clinica}
                      <button
                        type="button"
                        onClick={() => handleRemoveClinica(idx)}
                        className="hover:text-destructive transition-colors ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <WorkspaceLocaleEditor />

          <Button
            onClick={handleSaveGeneralConfig}
            disabled={savingGeneral}
            className="w-full sm:w-auto shadow-none"
          >
            {savingGeneral ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
