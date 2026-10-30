import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Lock,
  User,
  HelpCircle,
  Bell,
  Eye,
  Calendar,
  FileText,
  TrendingUp,
  MessageSquare,
  Clock,
  Settings,
  Zap,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserLocalePreferences } from "@/components/UserLocalePreferences";
import { PlanLimitsPanel } from "@/components/PlanLimitsPanel";
import {
  ConfiguracionPersonalTab,
} from "@/components/configuracion/ConfiguracionPersonalTab";
import {
  ConfiguracionActividadTab,
  type EstadisticasDesempeno,
} from "@/components/configuracion/ConfiguracionActividadTab";
import {
  ConfiguracionAgendaTab,
  type ProximaCita,
  type TareaPendiente,
} from "@/components/configuracion/ConfiguracionAgendaTab";
import { ConfiguracionSeguridadTab } from "@/components/configuracion/ConfiguracionSeguridadTab";
import { ConfiguracionNotificacionesTab } from "@/components/configuracion/ConfiguracionNotificacionesTab";
import { ConfiguracionAparienciaTab } from "@/components/configuracion/ConfiguracionAparienciaTab";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

const Configuracion = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const { currentWorkspace, currentPlan } = useWorkspace();
  const [uploading, setUploading] = useState(false);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [proximasCitas, setProximasCitas] = useState<ProximaCita[]>([]);
  const [tareasPendientes, setTareasPendientes] = useState<TareaPendiente[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDesempeno | null>(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true,
    llamadas: true,
    visitas: true,
  });

  const [formData, setFormData] = useState({
    telefono: "",
    especialidad: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      toast.success("Foto de perfil actualizada");
    } catch (error: any) {
      toast.error(error.message || "Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      toast.success("Perfil actualizado exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar perfil");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Contraseña actualizada exitosamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  // Fetch profesional_id vinculado a este usuario
  useEffect(() => {
    const fetchProfesionalId = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("personal_salud")
        .select("id")
        .eq("user_id", profile.id)
        .single();

      if (data) {
        setProfesionalId(data.id);
      }
    };
    fetchProfesionalId();
  }, [profile?.id]);

  // Fetch performance statistics
  useEffect(() => {
    const fetchEstadisticas = async () => {
      if (!profesionalId) {
        setLoadingEstadisticas(false);
        return;
      }

      setLoadingEstadisticas(true);
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      try {
        const { count: llamadasMes } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .gte("fecha_hora_realizada", inicioMes)
          .lte("fecha_hora_realizada", finMes);

        const { count: llamadasTotal } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada");

        const { count: visitasMes } = await supabase
          .from("control_visitas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .gte("fecha_hora_visita", inicioMes)
          .lte("fecha_hora_visita", finMes);

        const { count: visitasTotal } = await supabase
          .from("control_visitas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada");

        const { count: pacientes } = await supabase
          .from("pacientes")
          .select("*", { count: "exact", head: true })
          .eq("profesional_asignado_id", profesionalId)
          .eq("status_px", "activo");

        const { count: llamadasPend } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .in("estado", ["agendada", "pendiente"]);

        const { count: visitasPend } = await supabase
          .from("control_visitas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "pendiente");

        const { count: tareasCompletadas } = await supabase
          .from("atencion_paciente")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .gte("fecha_realizada", inicioMes)
          .lte("fecha_realizada", finMes);

        const { count: llamadasContactadas } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("resultado_seguimiento", "contactado");

        const tasaContacto =
          (llamadasTotal || 0) > 0
            ? Math.round(((llamadasContactadas || 0) / (llamadasTotal || 1)) * 100)
            : 0;

        const { data: duracionData } = await supabase
          .from("registro_llamadas")
          .select("duracion_minutos")
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .not("duracion_minutos", "is", null);

        const duracionPromedio =
          duracionData && duracionData.length > 0
            ? Math.round(
                duracionData.reduce((acc, l) => acc + (l.duracion_minutos || 0), 0) /
                  duracionData.length
              )
            : 0;

        setEstadisticas({
          llamadasRealizadasMes: llamadasMes || 0,
          llamadasRealizadasTotal: llamadasTotal || 0,
          visitasCompletadasMes: visitasMes || 0,
          visitasCompletadasTotal: visitasTotal || 0,
          pacientesAsignados: pacientes || 0,
          tasaContacto,
          duracionPromedioLlamadas: duracionPromedio,
          tareasCompletadasMes: tareasCompletadas || 0,
          llamadasPendientes: llamadasPend || 0,
          visitasPendientes: visitasPend || 0,
        });
      } catch (error) {
        console.error("Error fetching estadisticas:", error);
      } finally {
        setLoadingEstadisticas(false);
      }
    };

    fetchEstadisticas();
  }, [profesionalId]);

  // Fetch citas y tareas pendientes
  useEffect(() => {
    const fetchCitasYTareas = async () => {
      if (!profesionalId) {
        setLoadingCitas(false);
        return;
      }

      setLoadingCitas(true);
      const hoy = new Date().toISOString();

      try {
        const { data: llamadas } = await supabase
          .from("registro_llamadas")
          .select("id, fecha_agendada, estado, paciente:pacientes(nombre, apellido)")
          .eq("profesional_id", profesionalId)
          .eq("estado", "agendada")
          .gte("fecha_agendada", hoy)
          .order("fecha_agendada", { ascending: true })
          .limit(5);

        const { data: visitas } = await supabase
          .from("control_visitas")
          .select("id, fecha_hora_visita, estado, paciente:pacientes(nombre, apellido)")
          .eq("profesional_id", profesionalId)
          .eq("estado", "pendiente")
          .gte("fecha_hora_visita", hoy)
          .order("fecha_hora_visita", { ascending: true })
          .limit(5);

        const { data: tareas } = await supabase
          .from("atencion_paciente")
          .select("id, tipo, descripcion, fecha_programada, paciente:pacientes(nombre, apellido)")
          .eq("profesional_id", profesionalId)
          .eq("estado", "pendiente")
          .order("fecha_programada", { ascending: true })
          .limit(5);

        const citasCombinadas: ProximaCita[] = [
          ...(llamadas || []).map((l) => ({
            id: l.id,
            tipo: "llamada" as const,
            fecha: l.fecha_agendada!,
            paciente: l.paciente as any,
            estado: l.estado!,
          })),
          ...(visitas || []).map((v) => ({
            id: v.id,
            tipo: "visita" as const,
            fecha: v.fecha_hora_visita,
            paciente: v.paciente as any,
            estado: v.estado!,
          })),
        ]
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
          .slice(0, 5);

        setProximasCitas(citasCombinadas);
        setTareasPendientes(
          (tareas || []).map((t) => ({
            id: t.id,
            tipo: t.tipo,
            descripcion: t.descripcion,
            paciente: t.paciente as any,
            fecha_programada: t.fecha_programada,
          }))
        );
      } catch (error) {
        console.error("Error fetching citas:", error);
      } finally {
        setLoadingCitas(false);
      }
    };

    fetchCitasYTareas();
  }, [profesionalId]);

  useEffect(() => {
    if (profile) {
      setFormData({
        telefono: profile.telefono || "",
        especialidad: profile.especialidad || "",
      });
    }
  }, [profile]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No se encontró el perfil de usuario</p>
          <Button onClick={() => navigate("/app")}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ClinicalPageHeader title="Configuración" subtitle="Gestiona tu información personal, seguridad y preferencias" />
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:grid-cols-11 gap-2">
          <TabsTrigger value="personal">
            <User className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="cuenta">
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Cuenta</span>
          </TabsTrigger>
          <TabsTrigger value="actividad">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Actividad</span>
          </TabsTrigger>
          <TabsTrigger value="agenda">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="interfaz">
            <Eye className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="plan">
            <CreditCard className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Lock className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="integraciones">
            <Zap className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Integraciones</span>
          </TabsTrigger>
          <TabsTrigger value="soporte">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Soporte</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Información Personal */}
        <TabsContent value="personal" className="space-y-6">
          <ConfiguracionPersonalTab
            profile={profile}
            uploading={uploading}
            onAvatarUpload={handleAvatarUpload}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleProfileUpdate}
          />
        </TabsContent>

        {/* 2. Cuenta y Preferencias */}
        <TabsContent value="cuenta" className="space-y-6">
          <GlassCard className="p-6 space-y-6 shadow-none">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configuración de Cuenta</h2>
              <p className="text-muted-foreground">Opciones de seguridad y preferencias</p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Preferencias regionales</h3>
                <UserLocalePreferences />
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">Permisos y Roles</h3>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Rol Actual</Label>
                    <Badge>{profile.rol}</Badge>
                  </div>
                  {isAdmin && (
                    <p className="text-sm text-muted-foreground">
                      Tienes acceso completo al sistema como administrador
                    </p>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 3. Actividad y Desempeño */}
        <TabsContent value="actividad" className="space-y-6">
          <ConfiguracionActividadTab
            loading={loadingEstadisticas}
            profesionalId={profesionalId}
            estadisticas={estadisticas}
          />
        </TabsContent>

        {/* 4. Agenda y Recordatorios */}
        <TabsContent value="agenda" className="space-y-6">
          <ConfiguracionAgendaTab
            profesionalId={profesionalId}
            loadingCitas={loadingCitas}
            proximasCitas={proximasCitas}
            tareasPendientes={tareasPendientes}
          />
        </TabsContent>

        {/* 5. Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <GlassCard className="p-6 space-y-6 shadow-none">
            <div>
              <h2 className="text-2xl font-bold mb-2">Documentos y Archivos</h2>
              <p className="text-muted-foreground">Contratos, constancias y documentos asociados</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Documentos Personales</p>
                    <p className="text-sm text-muted-foreground">0 archivos</p>
                  </div>
                </div>
                <Button variant="outline">Ver Todos</Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 6. Interfaz / Apariencia */}
        <TabsContent value="interfaz">
          <ConfiguracionAparienciaTab theme={theme} setTheme={setTheme} />
        </TabsContent>

        {/* 7. Plan / Suscripción */}
        <TabsContent value="plan">
          <GlassCard className="p-6 space-y-6 shadow-none">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  Mi Plan
                </h2>
                <p className="text-muted-foreground">
                  Información del plan activo en tu organización.
                </p>
              </div>
              <Button onClick={() => navigate("/app/planes")} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Ver planes y mejorar
              </Button>
            </div>

            {currentWorkspace ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">
                    Organización
                  </p>
                  <p className="font-semibold text-lg">{currentWorkspace.nombre}</p>
                  <Badge variant="outline" className="capitalize">
                    Rol: {currentWorkspace.role}
                  </Badge>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">
                    Plan actual
                  </p>
                  <p className="font-semibold text-lg flex items-center gap-2">
                    {currentPlan?.nombre ?? currentWorkspace.plan_codigo}
                    <Badge className="bg-gradient-to-r from-primary to-primary/70">
                      {currentWorkspace.plan_codigo}
                    </Badge>
                  </p>
                  {currentPlan && (
                    <p className="text-sm text-muted-foreground">
                      {currentPlan.precio_mensual_usd
                        ? `USD $${currentPlan.precio_mensual_usd}/mes`
                        : "Gratis"}
                    </p>
                  )}
                </div>

                {currentPlan && (
                  <div className="md:col-span-2">
                    <PlanLimitsPanel />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay un workspace seleccionado.</p>
            )}
          </GlassCard>
        </TabsContent>

        {/* 8. Notificaciones */}
        <TabsContent value="notificaciones">
          <ConfiguracionNotificacionesTab
            notificaciones={notificaciones}
            setNotificaciones={setNotificaciones}
          />
        </TabsContent>

        {/* 9. Seguridad */}
        <TabsContent value="seguridad">
          <ConfiguracionSeguridadTab
            changingPassword={changingPassword}
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            onPasswordChange={handlePasswordChange}
          />
        </TabsContent>

        {/* 10. Integraciones */}
        <TabsContent value="integraciones">
          <GlassCard className="p-6 space-y-6 shadow-none">
            <div>
              <h2 className="text-2xl font-bold mb-2">Integraciones y Herramientas</h2>
              <p className="text-muted-foreground">Conecta con herramientas externas</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Calendario Google</p>
                    <p className="text-sm text-muted-foreground">Sincroniza tus citas</p>
                  </div>
                </div>
                <Button variant="outline">Conectar</Button>
              </div>
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Correo Corporativo</p>
                    <p className="text-sm text-muted-foreground">Integración con email</p>
                  </div>
                </div>
                <Button variant="outline">Conectar</Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 11. Soporte */}
        <TabsContent value="soporte">
          <GlassCard className="p-6 space-y-6 shadow-none">
            <div>
              <h2 className="text-2xl font-bold mb-2">Centro de Soporte</h2>
              <p className="text-muted-foreground">
                ¿Necesitas ayuda? Contacta con nuestro equipo de soporte
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Correo de Soporte</h3>
                <p className="text-sm text-muted-foreground">soporte@healthcrm.com</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Teléfono de Soporte</h3>
                <p className="text-sm text-muted-foreground">+1 (809) 555-0123</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Horario de Atención</h3>
                <p className="text-sm text-muted-foreground">
                  Lunes a Viernes: 8:00 AM - 6:00 PM
                </p>
                <p className="text-sm text-muted-foreground">Sábados: 9:00 AM - 1:00 PM</p>
              </div>
              <Button className="w-full" onClick={() => navigate("/soporte")}>
                Enviar Ticket de Soporte
              </Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracion;