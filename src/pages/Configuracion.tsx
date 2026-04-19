import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, Upload, Lock, User, HelpCircle, Bell, Eye, Shield, 
  Briefcase, Calendar, FileText, TrendingUp, MessageSquare, 
  Clock, Settings, Zap, Phone, MapPin, CheckCircle2, CreditCard, Sparkles
} from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { HorariosProfesionalEditor } from "@/components/HorariosProfesionalEditor";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProximaCita {
  id: string;
  tipo: 'llamada' | 'visita';
  fecha: string;
  paciente: { nombre: string; apellido: string } | null;
  estado: string;
}

interface TareaPendiente {
  id: string;
  tipo: string;
  descripcion: string;
  paciente: { nombre: string; apellido: string } | null;
  fecha_programada: string | null;
}

interface EstadisticasDesempeno {
  llamadasRealizadasMes: number;
  llamadasRealizadasTotal: number;
  visitasCompletadasMes: number;
  visitasCompletadasTotal: number;
  pacientesAsignados: number;
  tasaContacto: number;
  duracionPromedioLlamadas: number;
  tareasCompletadasMes: number;
  llamadasPendientes: number;
  visitasPendientes: number;
}

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

      // Upload to Supabase Storage (we'll create the bucket in a migration)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
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
        password: passwordData.newPassword
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

  // Fetch profesional_id linked to this user
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
        // Fetch llamadas realizadas este mes
        const { count: llamadasMes } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .gte("fecha_hora_realizada", inicioMes)
          .lte("fecha_hora_realizada", finMes);

        // Fetch total llamadas realizadas
        const { count: llamadasTotal } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada");

        // Fetch visitas completadas este mes
        const { count: visitasMes } = await supabase
          .from("control_visitas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .gte("fecha_hora_visita", inicioMes)
          .lte("fecha_hora_visita", finMes);

        // Fetch total visitas completadas
        const { count: visitasTotal } = await supabase
          .from("control_visitas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada");

        // Fetch pacientes asignados
        const { count: pacientes } = await supabase
          .from("pacientes")
          .select("*", { count: "exact", head: true })
          .eq("profesional_asignado_id", profesionalId)
          .eq("status_px", "activo");

        // Fetch llamadas pendientes
        const { count: llamadasPend } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .in("estado", ["agendada", "pendiente"]);

        // Fetch visitas pendientes
        const { count: visitasPend } = await supabase
          .from("control_visitas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "pendiente");

        // Fetch tareas completadas este mes
        const { count: tareasCompletadas } = await supabase
          .from("atencion_paciente")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .gte("fecha_realizada", inicioMes)
          .lte("fecha_realizada", finMes);

        // Calcular tasa de contacto (llamadas contactadas / llamadas realizadas)
        const { count: llamadasContactadas } = await supabase
          .from("registro_llamadas")
          .select("*", { count: "exact", head: true })
          .eq("profesional_id", profesionalId)
          .eq("resultado_seguimiento", "contactado");

        const tasaContacto = (llamadasTotal || 0) > 0 
          ? Math.round(((llamadasContactadas || 0) / (llamadasTotal || 1)) * 100) 
          : 0;

        // Calcular duración promedio de llamadas
        const { data: duracionData } = await supabase
          .from("registro_llamadas")
          .select("duracion_minutos")
          .eq("profesional_id", profesionalId)
          .eq("estado", "realizada")
          .not("duracion_minutos", "is", null);

        const duracionPromedio = duracionData && duracionData.length > 0
          ? Math.round(duracionData.reduce((acc, l) => acc + (l.duracion_minutos || 0), 0) / duracionData.length)
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

  // Fetch upcoming appointments and pending tasks
  useEffect(() => {
    const fetchCitasYTareas = async () => {
      if (!profesionalId) {
        setLoadingCitas(false);
        return;
      }

      setLoadingCitas(true);
      const hoy = new Date().toISOString();

      try {
        // Fetch próximas llamadas
        const { data: llamadas } = await supabase
          .from("registro_llamadas")
          .select("id, fecha_agendada, estado, paciente:pacientes(nombre, apellido)")
          .eq("profesional_id", profesionalId)
          .eq("estado", "agendada")
          .gte("fecha_agendada", hoy)
          .order("fecha_agendada", { ascending: true })
          .limit(5);

        // Fetch próximas visitas
        const { data: visitas } = await supabase
          .from("control_visitas")
          .select("id, fecha_hora_visita, estado, paciente:pacientes(nombre, apellido)")
          .eq("profesional_id", profesionalId)
          .eq("estado", "pendiente")
          .gte("fecha_hora_visita", hoy)
          .order("fecha_hora_visita", { ascending: true })
          .limit(5);

        // Fetch tareas pendientes (atención al paciente)
        const { data: tareas } = await supabase
          .from("atencion_paciente")
          .select("id, tipo, descripcion, fecha_programada, paciente:pacientes(nombre, apellido)")
          .eq("profesional_id", profesionalId)
          .eq("estado", "pendiente")
          .order("fecha_programada", { ascending: true })
          .limit(5);

        // Combine and sort citas
        const citasCombinadas: ProximaCita[] = [
          ...(llamadas || []).map(l => ({
            id: l.id,
            tipo: 'llamada' as const,
            fecha: l.fecha_agendada!,
            paciente: l.paciente as any,
            estado: l.estado!
          })),
          ...(visitas || []).map(v => ({
            id: v.id,
            tipo: 'visita' as const,
            fecha: v.fecha_hora_visita,
            paciente: v.paciente as any,
            estado: v.estado!
          }))
        ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).slice(0, 5);

        setProximasCitas(citasCombinadas);
        setTareasPendientes((tareas || []).map(t => ({
          id: t.id,
          tipo: t.tipo,
          descripcion: t.descripcion,
          paciente: t.paciente as any,
          fecha_programada: t.fecha_programada
        })));
      } catch (error) {
        console.error("Error fetching citas:", error);
      } finally {
        setLoadingCitas(false);
      }
    };

    fetchCitasYTareas();
  }, [profesionalId]);

  // Update form data cuando el perfil carga
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <GlassCard className="p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">No se pudo cargar el perfil</h2>
          <p className="text-muted-foreground">
            Tu perfil aún no está configurado en el sistema. Por favor contacta al administrador.
          </p>
          <Button onClick={() => navigate("/soporte")}>
            Contactar Soporte
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            {isAdmin && (
              <Badge variant="destructive" className="bg-gradient-to-r from-[hsl(var(--admin-primary))] to-[hsl(var(--admin-secondary))]">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Administra tu información personal y preferencias</p>
        </div>
        {isAdmin && (
          <Button 
            className="ml-auto bg-gradient-to-r from-[hsl(var(--admin-primary))] to-[hsl(var(--admin-secondary))]"
            onClick={() => navigate("/configuracion-admin")}
          >
            <Shield className="mr-2 h-4 w-4" />
            Panel de Administración
          </Button>
        )}
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

        {/* 1. Información Personal y Profesional */}
        <TabsContent value="personal" className="space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Información Personal y Profesional</h2>
              <p className="text-muted-foreground">
                Datos identificativos y laborales básicos
              </p>
            </div>
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.nombre[0]}{profile.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Subiendo..." : "Cambiar foto"}
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o GIF (max. 2MB)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nombre Completo</Label>
                  <p className="text-lg font-medium">{profile.nombre} {profile.apellido}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Cargo</Label>
                  <p className="text-lg font-medium">{profile.especialidad || "No especificado"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Cédula</Label>
                  <p className="text-lg font-medium">{profile.cedula}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Rol en el Sistema</Label>
                  <Badge variant="outline">{profile.rol}</Badge>
                </div>
              </div>

              <Separator />

              {/* Información de contacto */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Corporativo</Label>
                    <p className="text-lg font-medium">
                      <a 
                        href={`mailto:${profile.email}`}
                        className="no-underline text-foreground hover:text-primary"
                      >
                        {profile.email}
                      </a>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="809-123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Información profesional editable */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialidad / Área</Label>
                  <Input
                    id="especialidad"
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    placeholder="Ej: Cardiología, Enfermería, Administración"
                  />
                </div>
                <Button type="submit">Guardar Cambios</Button>
              </form>
            </div>
          </GlassCard>

        </TabsContent>

        {/* 2. Configuración de Cuenta */}
        <TabsContent value="cuenta" className="space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configuración de Cuenta</h2>
              <p className="text-muted-foreground">Opciones de seguridad y preferencias</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Preferencias de Usuario</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Idioma</Label>
                      <p className="text-sm text-muted-foreground">Español</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Zona Horaria</Label>
                      <p className="text-sm text-muted-foreground">America/Santo_Domingo (AST)</p>
                    </div>
                  </div>
                </div>
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

        {/* 3. Resumen de Actividad */}
        <TabsContent value="actividad" className="space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Resumen de Actividad y Desempeño</h2>
              <p className="text-muted-foreground">Estadísticas personalizadas basadas en tu actividad real</p>
            </div>

            {loadingEstadisticas ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2 animate-pulse">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : !profesionalId ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-sm">
                  No tienes un perfil de profesional vinculado. Contacta al administrador para ver tus estadísticas.
                </p>
              </div>
            ) : (
              <>
                {/* Estadísticas principales */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <Label className="text-muted-foreground text-xs">Llamadas Este Mes</Label>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{estadisticas?.llamadasRealizadasMes || 0}</p>
                    <p className="text-xs text-muted-foreground">Total: {estadisticas?.llamadasRealizadasTotal || 0}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <Label className="text-muted-foreground text-xs">Visitas Este Mes</Label>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{estadisticas?.visitasCompletadasMes || 0}</p>
                    <p className="text-xs text-muted-foreground">Total: {estadisticas?.visitasCompletadasTotal || 0}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <Label className="text-muted-foreground text-xs">Pacientes Asignados</Label>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{estadisticas?.pacientesAsignados || 0}</p>
                    <p className="text-xs text-muted-foreground">Activos</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <Label className="text-muted-foreground text-xs">Tasa de Contacto</Label>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{estadisticas?.tasaContacto || 0}%</p>
                    <p className="text-xs text-muted-foreground">Llamadas efectivas</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg space-y-1 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-600" />
                      <Label className="text-muted-foreground text-xs">Duración Promedio</Label>
                    </div>
                    <p className="text-3xl font-bold text-cyan-600">{estadisticas?.duracionPromedioLlamadas || 0}</p>
                    <p className="text-xs text-muted-foreground">minutos/llamada</p>
                  </div>
                </div>

                <Separator />

                {/* Pendientes y tareas */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Actividades Pendientes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg flex items-center gap-4 bg-orange-50/50 dark:bg-orange-950/20">
                      <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/40">
                        <Phone className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estadisticas?.llamadasPendientes || 0}</p>
                        <p className="text-sm text-muted-foreground">Llamadas pendientes</p>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex items-center gap-4 bg-rose-50/50 dark:bg-rose-950/20">
                      <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/40">
                        <MapPin className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estadisticas?.visitasPendientes || 0}</p>
                        <p className="text-sm text-muted-foreground">Visitas pendientes</p>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg flex items-center gap-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estadisticas?.tareasCompletadasMes || 0}</p>
                        <p className="text-sm text-muted-foreground">Tareas completadas (mes)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        </TabsContent>

        {/* 4. Agenda y Recordatorios */}
        <TabsContent value="agenda" className="space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Agenda y Recordatorios</h2>
              <p className="text-muted-foreground">Calendario personal, horarios y tareas pendientes</p>
            </div>

            {/* Horarios Laborables */}
            {profesionalId && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Mis Horarios Laborables
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Configura tus días y horarios de trabajo
                  </p>
                  <HorariosProfesionalEditor profesionalId={profesionalId} />
                </div>
              </div>
            )}

            {!profesionalId && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-sm">
                  No tienes un perfil de profesional vinculado. Contacta al administrador si crees que esto es un error.
                </p>
              </div>
            )}

            <Separator />

            {/* Próximas Citas */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próximas Citas
                </h3>
                {loadingCitas ? (
                  <p className="text-muted-foreground text-sm">Cargando...</p>
                ) : proximasCitas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay citas programadas</p>
                ) : (
                  <div className="space-y-3">
                    {proximasCitas.map((cita) => (
                      <div key={cita.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className={`p-2 rounded-full ${cita.tipo === 'llamada' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {cita.tipo === 'llamada' ? <Phone className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : 'Paciente no asignado'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(cita.fecha), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {cita.tipo}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tareas Pendientes */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Tareas Pendientes
                </h3>
                {loadingCitas ? (
                  <p className="text-muted-foreground text-sm">Cargando...</p>
                ) : tareasPendientes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay tareas pendientes</p>
                ) : (
                  <div className="space-y-3">
                    {tareasPendientes.map((tarea) => (
                      <div key={tarea.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tarea.descripcion}</p>
                          <p className="text-xs text-muted-foreground">
                            {tarea.paciente ? `${tarea.paciente.nombre} ${tarea.paciente.apellido}` : 'Sin paciente'}
                            {tarea.fecha_programada && ` • ${format(new Date(tarea.fecha_programada), "dd/MM/yyyy", { locale: es })}`}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {tarea.tipo}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 5. Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <GlassCard className="p-6 space-y-6">
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

        {/* 6. Interfaz */}
        <TabsContent value="interfaz">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interfaz y Productividad</h2>
              <p className="text-muted-foreground">Personaliza tu experiencia de trabajo</p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Tema de la Aplicación</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === "light" ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="bg-white rounded-md p-4 mb-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-300 rounded" />
                      <div className="h-2 bg-slate-300 rounded w-2/3" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Claro</p>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === "dark" ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="bg-slate-900 rounded-md p-4 mb-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700 rounded" />
                      <div className="h-2 bg-slate-700 rounded w-2/3" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Oscuro</p>
                </button>

                <button
                  onClick={() => setTheme("standard")}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === "standard" ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="rounded-md overflow-hidden mb-2 shadow-sm">
                    <div className="bg-slate-900 h-8" />
                    <div className="bg-white p-2">
                      <div className="space-y-1">
                        <div className="h-1 bg-slate-300 rounded" />
                        <div className="h-1 bg-slate-300 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium">Estándar</p>
                </button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 6b. Plan / Suscripción */}
        <TabsContent value="plan">
          <GlassCard className="p-6 space-y-6">
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
              <Button onClick={() => navigate("/planes")} className="gap-2">
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
                  <div className="border rounded-lg p-4 md:col-span-2 space-y-3">
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">
                      Límites de tu plan
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">
                          {currentPlan.limite_pacientes ?? "∞"}
                        </p>
                        <p className="text-xs text-muted-foreground">Pacientes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {currentPlan.limite_profesionales ?? "∞"}
                        </p>
                        <p className="text-xs text-muted-foreground">Profesionales</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {currentPlan.limite_usuarios ?? "∞"}
                        </p>
                        <p className="text-xs text-muted-foreground">Usuarios</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay un workspace seleccionado.</p>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="notificaciones">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notificaciones y Alertas</h2>
              <p className="text-muted-foreground">Configura cómo y cuándo recibir notificaciones</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">Recibir alertas en tu correo electrónico</p>
                </div>
                <Switch 
                  checked={notificaciones.email}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, email: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Notificaciones Push</Label>
                  <p className="text-sm text-muted-foreground">Alertas en tiempo real en la aplicación</p>
                </div>
                <Switch 
                  checked={notificaciones.push}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, push: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Recordatorios de Llamadas</Label>
                  <p className="text-sm text-muted-foreground">Avisos de llamadas programadas</p>
                </div>
                <Switch 
                  checked={notificaciones.llamadas}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, llamadas: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Recordatorios de Visitas</Label>
                  <p className="text-sm text-muted-foreground">Avisos de visitas programadas</p>
                </div>
                <Switch 
                  checked={notificaciones.visitas}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, visitas: checked})}
                />
              </div>

              <Button>Guardar Preferencias</Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 8. Seguridad */}
        <TabsContent value="seguridad">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Seguridad</h2>
              <p className="text-muted-foreground">
                Actualiza tu contraseña y gestiona la seguridad de tu cuenta
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Cambiar Contraseña</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
              </form>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historial de Acceso
                </h3>
                <div className="p-4 border rounded-lg">
                  <p className="text-muted-foreground text-sm">Último acceso: Hoy</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* 9. Integraciones */}
        <TabsContent value="integraciones">
          <GlassCard className="p-6 space-y-6">
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

        {/* 10. Soporte */}
        <TabsContent value="soporte">
          <GlassCard className="p-6 space-y-6">
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
                <p className="text-sm text-muted-foreground">
                  Sábados: 9:00 AM - 1:00 PM
                </p>
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