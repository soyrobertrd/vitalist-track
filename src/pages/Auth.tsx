import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Stethoscope, Building2, User, Sparkles, ShieldCheck } from "lucide-react";
import { z } from "zod";

const PLAN_LABELS: Record<string, { nombre: string; color: string; badge: string }> = {
  free: { nombre: "Plan Gratis", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30", badge: "Acceso Ilimitado Básico" },
  solo: { nombre: "Básico (Solo Doctor)", color: "bg-blue-500/10 text-blue-700 border-blue-500/30", badge: "30 Días de Prueba Gratis" },
  pro: { nombre: "Pro Consultorios", color: "bg-purple-500/10 text-purple-700 border-purple-500/30", badge: "30 Días de Prueba Gratis" },
  plus: { nombre: "Clínica Plus", color: "bg-amber-500/10 text-amber-700 border-amber-500/30", badge: "30 Días de Prueba Gratis" },
  business: { nombre: "Business Enterprise", color: "bg-slate-500/10 text-slate-700 border-slate-500/30", badge: "Alta Complejidad" },
};

const PROFESIONES = [
  { id: "doctor", label: "Médico / Doctor(a)", verticalDefault: "clinica" },
  { id: "veterinario", label: "Médico Veterinario(a)", verticalDefault: "veterinaria" },
  { id: "enfermera", label: "Enfermero(a) / Personal de Salud", verticalDefault: "clinica" },
  { id: "odontologo", label: "Odontólogo(a) / Dentista", verticalDefault: "dental" },
  { id: "fisioterapeuta", label: "Fisioterapeuta / Kinesiólogo(a)", verticalDefault: "fisioterapia" },
  { id: "nutricionista", label: "Nutricionista / Dietista Clínico(a)", verticalDefault: "nutricion" },
  { id: "psicologo", label: "Psicólogo(a) / Terapeuta", verticalDefault: "psicologia" },
  { id: "optometrista", label: "Optometrista / Oftalmólogo(a)", verticalDefault: "vision" },
  { id: "administrador", label: "Administrador(a) / Director de Clínica", verticalDefault: "clinica" },
];

const TIPOS_CENTRO: Record<string, { id: string; label: string; vertical: string }[]> = {
  veterinario: [
    { id: "clinica_vet", label: "Clínica Veterinaria Integral", vertical: "veterinaria" },
    { id: "hospital_vet", label: "Hospital Veterinario 24/7", vertical: "veterinaria" },
    { id: "consultorio_pet", label: "Consultorio Veterinario / Pet Care", vertical: "veterinaria" },
  ],
  odontologo: [
    { id: "clinica_dental", label: "Clínica Odontológica Especializada", vertical: "dental" },
    { id: "consultorio_dental", label: "Consultorio Dental Privado", vertical: "dental" },
  ],
  fisioterapeuta: [
    { id: "centro_rehab", label: "Centro de Rehabilitación & Kinesiología", vertical: "fisioterapia" },
    { id: "gabinete_fisioterapia", label: "Gabinete de Terapia Física y Deportiva", vertical: "fisioterapia" },
  ],
  nutricionista: [
    { id: "centro_nutricion", label: "Centro Nutricional & Metabólico / Bariatría", vertical: "nutricion" },
    { id: "consultorio_dietetica", label: "Consultorio de Nutrición y Dietética", vertical: "nutricion" },
  ],
  psicologo: [
    { id: "centro_salud_mental", label: "Centro de Psicología & Salud Mental", vertical: "psicologia" },
    { id: "gabinete_psicologico", label: "Gabinete Psicológico Privado", vertical: "psicologia" },
  ],
  optometrista: [
    { id: "centro_oftalmo", label: "Centro Oftalmológico & Gabinete Óptico", vertical: "vision" },
    { id: "optica_clinica", label: "Óptica & Gabinete de Refracción", vertical: "vision" },
  ],
  general_clinica: [
    { id: "policlinica", label: "Policlínica / Centro Médico Ambulatorio", vertical: "clinica" },
    { id: "hospital_general", label: "Hospital General / Centro Quirúrgico", vertical: "clinica" },
    { id: "clinica_mujer", label: "Clínica de la Mujer / Maternidad", vertical: "clinica" },
    { id: "recovery_home", label: "Recovery Home / Postquirúrgico Especializado", vertical: "recovery" },
    { id: "estetica_spa", label: "Centro de Medicina Estética & Spa", vertical: "aesthetic" },
  ],
  general_individual: [
    { id: "consultorio_medico", label: "Consultorio Médico Privado", vertical: "clinica" },
    { id: "atencion_domicilio", label: "Servicio de Atención Médica Domiciliaria", vertical: "clinica" },
    { id: "estetica_independiente", label: "Consultorio Estético Independiente", vertical: "aesthetic" },
  ],
};

const signupSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().min(1, "Apellido requerido").max(100),
  cedula: z.string().min(1, "Cédula requerida").max(20),
});

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const planUrl = (searchParams.get("plan") || "free").toLowerCase();
  const planInfo = PLAN_LABELS[planUrl] || PLAN_LABELS.free;

  // Estados del formulario extendido de registro
  const [profesion, setProfesion] = useState<string>("doctor");
  const [modalidad, setModalidad] = useState<"individual" | "clinica">("individual");
  const [tipoCentro, setTipoCentro] = useState<string>("consultorio_medico");

  // Opciones dinámicas de tipo de centro según la profesión y modalidad
  const opcionesCentro =
    TIPOS_CENTRO[profesion] ||
    (modalidad === "clinica" ? TIPOS_CENTRO.general_clinica : TIPOS_CENTRO.general_individual);

  useEffect(() => {
    // Cuando cambia la profesión o modalidad, asegurar un valor válido por defecto
    if (opcionesCentro.length > 0 && !opcionesCentro.some((o) => o.id === tipoCentro)) {
      setTipoCentro(opcionesCentro[0].id);
    }
  }, [profesion, modalidad]);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/app");
      }
    });

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/app");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Sesión iniciada");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      cedula: formData.get("cedula") as string,
    };

    try {
      signupSchema.parse(data);

      const centroSeleccionado = opcionesCentro.find((c) => c.id === tipoCentro);
      const verticalAsignada =
        centroSeleccionado?.vertical ||
        PROFESIONES.find((p) => p.id === profesion)?.verticalDefault ||
        "clinica";

      // 1. Registro en autenticación con metadata completa
      const { data: authData, error: signUpError } = await db.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            cedula: data.cedula,
            profesion,
            modalidad,
            tipo_centro: centroSeleccionado?.label || tipoCentro,
            plan_codigo: planUrl,
            vertical_activa: verticalAsignada,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // 2. Guardar perfil enriquecido
        await db.from("profiles").upsert({
          id: authData.user.id,
          cedula: data.cedula,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          rol: "admin",
        } as any);

        // 3. Crear el workspace inicial con el plan seleccionado
        const nombreWorkspace =
          modalidad === "clinica"
            ? `${centroSeleccionado?.label || "Clínica"} ${data.apellido}`
            : `Consultorio Dr(a). ${data.apellido}`;

        const { data: newWs, error: wsError } = await db
          .from("workspaces")
          .insert({
            nombre: nombreWorkspace,
            owner_id: authData.user.id,
            plan_codigo: planUrl, // "free" o el plan de pago seleccionado
          } as any)
          .select("id")
          .maybeSingle();

        if (newWs?.id) {
          // 4. Vincular membresía como owner
          await db.from("workspace_members").insert({
            workspace_id: newWs.id,
            user_id: authData.user.id,
            role: "owner",
          } as any);

          // 5. Fijar la vertical y el workspace activo en localStorage
          localStorage.setItem("vitalist_workspace_id", newWs.id);
        }

        // Fijar vertical adecuada de acuerdo a la profesión y centro
        localStorage.setItem("vitalist_vertical_activa", verticalAsignada);
      }

      toast.success(
        planUrl === "free"
          ? "¡Cuenta creada exitosamente en el Plan Gratis!"
          : `¡Cuenta creada! Activado ${planInfo.nombre} (30 días de prueba).`
      );
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error(error.message || "Error al crear cuenta");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-3xl border-border/80">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Vitalist Track</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Plataforma clínica multi-especialidad & gestión operativa
          </CardDescription>

          {/* Badge del Plan Seleccionado */}
          <div className="pt-2 flex justify-center">
            <Badge variant="outline" className={`${planInfo.color} font-semibold text-xs px-3 py-1 rounded-full`}>
              {planInfo.nombre} • {planInfo.badge}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl mb-4">
              <TabsTrigger value="login" className="rounded-xl font-semibold text-xs sm:text-sm">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl font-semibold text-xs sm:text-sm">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* TAB INICIAR SESIÓN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs">Correo Electrónico</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    placeholder="doctor@vitalist.com"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs">Contraseña</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="rounded-xl text-sm"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={loading}>
                  {loading ? "Iniciando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            {/* TAB REGISTRARSE */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nombre" className="text-xs">Nombre</Label>
                    <Input id="nombre" name="nombre" required placeholder="Carlos" className="rounded-xl text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="apellido" className="text-xs">Apellido</Label>
                    <Input id="apellido" name="apellido" required placeholder="Gómez" className="rounded-xl text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cedula" className="text-xs">Cédula / Identificación</Label>
                    <Input id="cedula" name="cedula" required placeholder="001-1234567-8" className="rounded-xl text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs">Email Profesional</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="carlos@clinica.com"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs">Contraseña (Mínimo 6 caracteres)</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="rounded-xl text-xs"
                  />
                </div>

                {/* SELECTOR DE PROFESIÓN */}
                <div className="space-y-1 pt-1 border-t border-border/50">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" />
                    ¿Cuál es tu profesión o rol?
                  </Label>
                  <Select value={profesion} onValueChange={setProfesion}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESIONES.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* MODALIDAD: INDIVIDUAL O CLÍNICA */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1 text-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Modalidad
                    </Label>
                    <Select value={modalidad} onValueChange={(v: any) => setModalidad(v)}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual" className="text-xs">
                          Individual / Consultorio
                        </SelectItem>
                        <SelectItem value="clinica" className="text-xs">
                          Clínica / Policlínica / Centro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* TIPO DE CENTRO */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1 text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Tipo de Centro
                    </Label>
                    <Select value={tipoCentro} onValueChange={setTipoCentro}>
                      <SelectTrigger className="rounded-xl text-xs truncate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {opcionesCentro.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl font-bold mt-2" disabled={loading}>
                  {loading ? "Creando cuenta..." : planUrl === "free" ? "Crear Cuenta Gratis" : `Activar ${planInfo.nombre}`}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground pt-1">
                  {planUrl === "free"
                    ? "✓ Plan gratuito habilitado automáticamente."
                    : `✓ Incluye 30 días de prueba gratis del ${planInfo.nombre}. Sin cobros ocultos.`}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
