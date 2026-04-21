import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSucursales } from "@/hooks/useSucursales";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Building2, MapPin, UserCog, Users, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { currentWorkspace, refresh } = useWorkspace();
  const { refetch: refetchSucursales } = useSucursales();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  const [wsName, setWsName] = useState("");
  const [sucursal, setSucursal] = useState({ nombre: "Sede Principal", ciudad: "", direccion: "" });
  const [profesional, setProfesional] = useState({ nombre: "", apellido: "", cedula: "", profesion: "Médico" });
  const [skipProfesional, setSkipProfesional] = useState(false);

  // Check si ya completó onboarding
  useEffect(() => {
    if (currentWorkspace?.configuracion?.onboarding_completed) {
      navigate("/dashboard");
    } else if (currentWorkspace) {
      setWsName(currentWorkspace.nombre);
    }
  }, [currentWorkspace, navigate]);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleStep1Next = async () => {
    if (!wsName.trim() || !currentWorkspace) {
      toast.error("Ingresa un nombre");
      return;
    }
    setSaving(true);
    if (wsName.trim() !== currentWorkspace.nombre) {
      const { error } = await supabase
        .from("workspaces")
        .update({ nombre: wsName.trim() })
        .eq("id", currentWorkspace.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      await refresh();
    }
    setSaving(false);
    setStep(2);
  };

  const handleStep2Next = async () => {
    if (!currentWorkspace) return;
    if (!sucursal.nombre.trim()) {
      toast.error("Nombre de sucursal requerido");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("sucursales" as any).insert({
      workspace_id: currentWorkspace.id,
      nombre: sucursal.nombre.trim(),
      ciudad: sucursal.ciudad.trim() || null,
      direccion: sucursal.direccion.trim() || null,
      es_principal: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refetchSucursales();
    setStep(3);
  };

  const handleStep3Next = async () => {
    if (skipProfesional) {
      setStep(4);
      return;
    }
    if (!currentWorkspace) return;
    if (!profesional.nombre.trim() || !profesional.apellido.trim()) {
      toast.error("Nombre y apellido requeridos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("personal_salud").insert({
      workspace_id: currentWorkspace.id,
      nombre: profesional.nombre.trim(),
      apellido: profesional.apellido.trim(),
      cedula: profesional.cedula.trim() || `tmp-${Date.now()}`,
      profesion: profesional.profesion as any,
      activo: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep(4);
  };

  const handleFinish = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    await supabase
      .from("workspaces")
      .update({
        configuracion: { ...(currentWorkspace.configuracion || {}), onboarding_completed: true },
      })
      .eq("id", currentWorkspace.id);
    await refresh();
    setSaving(false);
    toast.success("¡Configuración inicial completa!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">Paso {step} de {totalSteps}</div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Saltar configuración</Button>
          </div>
          <Progress value={progress} className="h-1.5" />
        </CardHeader>

        {step === 1 && (
          <>
            <CardHeader className="pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Nombre de tu organización</CardTitle>
                  <CardDescription>Así verás tu clínica en toda la plataforma.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre de la organización</Label>
                <Input
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Clínica Salud RD"
                  autoFocus
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleStep1Next} disabled={saving}>
                  Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Tu primera sucursal</CardTitle>
                  <CardDescription>Cada sucursal tiene su propio equipo y agenda.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre de la sucursal *</Label>
                <Input value={sucursal.nombre} onChange={(e) => setSucursal({ ...sucursal, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ciudad</Label>
                  <Input value={sucursal.ciudad} onChange={(e) => setSucursal({ ...sucursal, ciudad: e.target.value })} placeholder="Santo Domingo" />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input value={sucursal.direccion} onChange={(e) => setSucursal({ ...sucursal, direccion: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-1" /> Atrás</Button>
                <Button onClick={handleStep2Next} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCog className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Tu primer profesional</CardTitle>
                  <CardDescription>Puedes saltarte este paso y agregarlos después.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!skipProfesional && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre *</Label>
                      <Input value={profesional.nombre} onChange={(e) => setProfesional({ ...profesional, nombre: e.target.value })} />
                    </div>
                    <div>
                      <Label>Apellido *</Label>
                      <Input value={profesional.apellido} onChange={(e) => setProfesional({ ...profesional, apellido: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cédula</Label>
                      <Input value={profesional.cedula} onChange={(e) => setProfesional({ ...profesional, cedula: e.target.value })} placeholder="000-0000000-0" />
                    </div>
                    <div>
                      <Label>Profesión</Label>
                      <Input value={profesional.profesion} onChange={(e) => setProfesional({ ...profesional, profesion: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <Button variant="link" size="sm" onClick={() => setSkipProfesional(!skipProfesional)} className="px-0">
                  {skipProfesional ? "← Agregar profesional ahora" : "Omitir este paso"}
                </Button>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-1" /> Atrás</Button>
                <Button onClick={handleStep3Next} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader className="pt-2 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>¡Todo listo!</CardTitle>
              <CardDescription>
                Tu organización está configurada. Ahora puedes empezar a agregar pacientes y agendar citas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {wsName}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {sucursal.nombre}</div>
                {!skipProfesional && profesional.nombre && (
                  <div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-primary" /> {profesional.nombre} {profesional.apellido}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => navigate("/organizaciones")}>
                  <Users className="h-4 w-4 mr-1" /> Invitar equipo
                </Button>
                <Button onClick={handleFinish} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Ir al dashboard <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
