import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Check, Sparkles, Building2, UserCog, Users, Globe, Calendar, Ticket, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { CountryTimezoneSelector } from "@/components/CountryTimezoneSelector";
import { getCurrencyFromCountry } from "@/lib/currency";

const STEPS = ["Clínica", "Región", "Profesional", "Paciente", "Listo"] as const;

function detectBrowserDefaults() {
  let country = "DO";
  let timezone = "America/Santo_Domingo";
  try {
    const lang = navigator.language;
    const parts = lang.split("-");
    if (parts.length >= 2) {
      const cc = parts[parts.length - 1].toUpperCase();
      if (/^[A-Z]{2}$/.test(cc)) country = cc;
    }
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
  } catch { /* ignore */ }
  return { country, timezone };
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentWorkspace, refresh } = useWorkspace();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const browserDefaults = detectBrowserDefaults();

  const [clinica, setClinica] = useState({
    nombre: currentWorkspace?.nombre || "",
    direccion: "",
    telefono: "",
    email_contacto: "",
    sitio_web: "",
    instrucciones_cita: "Por favor llegue 15 minutos antes de su cita y traiga su documento de identidad.",
  });
  const [region, setRegion] = useState({
    country_code: browserDefaults.country,
    timezone: browserDefaults.timezone,
  });
  const [profesional, setProfesional] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    especialidad: "Médico",
    contacto: "",
    email_contacto: "",
  });
  const [paciente, setPaciente] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    contacto_px: "",
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const guardarClinica = async () => {
    if (!currentWorkspace) {
      toast.error("No hay workspace activo");
      return;
    }
    if (!clinica.nombre.trim()) {
      toast.error("El nombre de la clínica es requerido");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({
        nombre: clinica.nombre,
        direccion: clinica.direccion || null,
        telefono: clinica.telefono || null,
        email_contacto: clinica.email_contacto || null,
        sitio_web: clinica.sitio_web || null,
        instrucciones_cita: clinica.instrucciones_cita || null,
      } as any)
      .eq("id", currentWorkspace.id);
    setSaving(false);
    if (error) {
      toast.error("Error al guardar: " + error.message);
      return;
    }
    await refresh();
    toast.success("Clínica configurada");
    setStep(1);
  };

  const guardarRegion = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    const currency = getCurrencyFromCountry(region.country_code);
    const { error } = await supabase
      .from("workspaces")
      .update({
        country_code: region.country_code,
        timezone: region.timezone,
        currency_code: currency,
      } as any)
      .eq("id", currentWorkspace.id);
    setSaving(false);
    if (error) {
      toast.error("Error al guardar región: " + error.message);
      return;
    }
    await refresh();
    toast.success(`Región configurada (moneda: ${currency})`);
    setStep(2);
  };

  const guardarProfesional = async () => {
    if (!profesional.nombre || !profesional.apellido || !profesional.cedula) {
      toast.error("Nombre, apellido y cédula son requeridos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("personal_salud").insert({
      ...profesional,
      workspace_id: currentWorkspace?.id || null,
      activo: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }
    toast.success("Profesional creado");
    setStep(3);
  };

  const guardarPaciente = async () => {
    if (!paciente.nombre || !paciente.apellido || !paciente.cedula) {
      toast.error("Nombre, apellido y cédula son requeridos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("pacientes").insert({
      ...paciente,
      workspace_id: currentWorkspace?.id || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Error: " + error.message);
      return;
    }
    toast.success("Paciente creado");
    setStep(4);
  };

  const finalizar = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/");
  };

  const skip = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Badge variant="secondary">Bienvenido</Badge>
          </div>
          <h1 className="text-3xl font-bold">Configuremos tu clínica</h1>
          <p className="text-muted-foreground">Solo unos pasos para empezar a usar la plataforma</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "font-semibold text-primary" : "text-muted-foreground"}>
                {i < step && <Check className="inline h-3 w-3 mr-1" />}
                {s}
              </span>
            ))}
          </div>
          <Progress value={progress} />
        </div>

        <Card>
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Datos de la clínica</CardTitle>
                <CardDescription>Esta información aparecerá en tickets, recordatorios y comunicaciones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nombre de la clínica *</Label>
                  <Input value={clinica.nombre} onChange={(e) => setClinica({ ...clinica, nombre: e.target.value })} placeholder="Centro Médico..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={clinica.telefono} onChange={(e) => setClinica({ ...clinica, telefono: e.target.value })} placeholder="809-000-0000" />
                  </div>
                  <div>
                    <Label>Email de contacto</Label>
                    <Input type="email" value={clinica.email_contacto} onChange={(e) => setClinica({ ...clinica, email_contacto: e.target.value })} placeholder="info@..." />
                  </div>
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Input value={clinica.direccion} onChange={(e) => setClinica({ ...clinica, direccion: e.target.value })} placeholder="Av..." />
                </div>
                <div>
                  <Label>Sitio web</Label>
                  <Input value={clinica.sitio_web} onChange={(e) => setClinica({ ...clinica, sitio_web: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Instrucciones para pacientes (en tickets)</Label>
                  <Textarea value={clinica.instrucciones_cita} onChange={(e) => setClinica({ ...clinica, instrucciones_cita: e.target.value })} rows={2} />
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Región y zona horaria</CardTitle>
                <CardDescription>
                  Esto define la zona horaria de las citas, el formato de fechas, la moneda de facturación
                  y la validación de números de teléfono.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CountryTimezoneSelector
                  countryCode={region.country_code}
                  timezone={region.timezone}
                  onChange={({ countryCode, timezone }) => setRegion({ country_code: countryCode, timezone })}
                />
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  Moneda detectada: <strong className="text-foreground">{getCurrencyFromCountry(region.country_code)}</strong>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Primer profesional</CardTitle>
                <CardDescription>Agregue al menos un profesional de salud.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre *</Label>
                    <Input value={profesional.nombre} onChange={(e) => setProfesional({ ...profesional, nombre: e.target.value })} />
                  </div>
                  <div>
                    <Label>Apellido *</Label>
                    <Input value={profesional.apellido} onChange={(e) => setProfesional({ ...profesional, apellido: e.target.value })} />
                  </div>
                  <div>
                    <Label>Cédula *</Label>
                    <Input value={profesional.cedula} onChange={(e) => setProfesional({ ...profesional, cedula: e.target.value })} />
                  </div>
                  <div>
                    <Label>Especialidad</Label>
                    <Input value={profesional.especialidad} onChange={(e) => setProfesional({ ...profesional, especialidad: e.target.value })} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={profesional.contacto} onChange={(e) => setProfesional({ ...profesional, contacto: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={profesional.email_contacto} onChange={(e) => setProfesional({ ...profesional, email_contacto: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Primer paciente</CardTitle>
                <CardDescription>Empiece agregando un paciente de prueba (opcional).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre *</Label>
                    <Input value={paciente.nombre} onChange={(e) => setPaciente({ ...paciente, nombre: e.target.value })} />
                  </div>
                  <div>
                    <Label>Apellido *</Label>
                    <Input value={paciente.apellido} onChange={(e) => setPaciente({ ...paciente, apellido: e.target.value })} />
                  </div>
                  <div>
                    <Label>Cédula *</Label>
                    <Input value={paciente.cedula} onChange={(e) => setPaciente({ ...paciente, cedula: e.target.value })} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={paciente.contacto_px} onChange={(e) => setPaciente({ ...paciente, contacto_px: e.target.value })} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(4)} className="w-full">
                  Saltar este paso
                </Button>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Check className="h-6 w-6" /> ¡Todo listo!
                </CardTitle>
                <CardDescription>Tu clínica está configurada y lista para usar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-primary/5 p-4 rounded-lg text-center">
                    <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-semibold">Agenda citas</p>
                    <p className="text-xs text-muted-foreground">Llamadas y visitas</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg text-center">
                    <Ticket className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-semibold">Tickets QR</p>
                    <p className="text-xs text-muted-foreground">Para cada cita</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg text-center">
                    <ScanLine className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-semibold">Recepción</p>
                    <p className="text-xs text-muted-foreground">Validación rápida</p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          <div className="px-6 pb-6 flex justify-between gap-2">
            <Button variant="ghost" onClick={skip}>
              Saltar configuración
            </Button>
            <div className="flex gap-2">
              {step > 0 && step < 4 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                </Button>
              )}
              {step === 0 && <Button onClick={guardarClinica} disabled={saving}>Continuar <ArrowRight className="h-4 w-4 ml-2" /></Button>}
              {step === 1 && <Button onClick={guardarRegion} disabled={saving}>Continuar <ArrowRight className="h-4 w-4 ml-2" /></Button>}
              {step === 2 && <Button onClick={guardarProfesional} disabled={saving}>Continuar <ArrowRight className="h-4 w-4 ml-2" /></Button>}
              {step === 3 && <Button onClick={guardarPaciente} disabled={saving}>Continuar <ArrowRight className="h-4 w-4 ml-2" /></Button>}
              {step === 4 && <Button onClick={finalizar}>Ir al Dashboard <ArrowRight className="h-4 w-4 ml-2" /></Button>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
