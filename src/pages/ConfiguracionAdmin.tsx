import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVertical } from "@/contexts/VerticalContext";
import { verticalLabel, verticalIcon } from "@/config/verticales";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Users,
  Shield,
  Mail,
  FileText,
  BarChart,
  Lock,
  Palette,
  Database,
  Workflow,
  Plus,
  CalendarDays,
  Key,
  History,
  LayoutTemplate,
  Activity,
  Sparkles,
  Building2,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiasNoLaborablesCalendar } from "@/components/DiasNoLaborablesCalendar";
import { ModulePermissionsManager } from "@/components/ModulePermissionsManager";
import { AuditoriaCambiosViewer } from "@/components/AuditoriaCambiosViewer";
import { WorkspaceLocaleEditor } from "@/components/WorkspaceLocaleEditor";
import { PlantillasEspecialidadAdmin } from "@/components/ficha-clinica/PlantillasEspecialidad";
import { ClinicDomainManager } from "@/components/workspace/ClinicDomainManager";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const NAV_GROUPS = [
  {
    label: "Centro",
    items: [
      { value: "general", label: "General", icon: Settings },
      { value: "apariencia", label: "Apariencia", icon: Palette },
      { value: "calendario", label: "Días Feriados", icon: CalendarDays },
      { value: "especialidades", label: "Especialidades", icon: LayoutTemplate },
    ],
  },
  {
    label: "Equipo y acceso",
    items: [
      { value: "usuarios", label: "Usuarios", icon: Users },
      { value: "roles", label: "Roles", icon: Shield },
      { value: "seguridad", label: "Seguridad", icon: Lock },
    ],
  },
  {
    label: "Comunicación",
    items: [
      { value: "correo", label: "Correo", icon: Mail },
      { value: "plantillas", label: "Plantillas", icon: FileText },
      { value: "encuestas", label: "Encuestas", icon: BarChart },
      { value: "automatizacion", label: "Automatización", icon: Workflow },
    ],
  },
  {
    label: "Datos & Dominios",
    items: [
      { value: "datos", label: "Datos & Dominio", icon: Database },
      { value: "auditoria", label: "Auditoría", icon: History },
    ],
  },
];

const ConfiguracionAdmin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "general";
  const setTab = (value: string) => setSearchParams({ tab: value }, { replace: true });
  const { currentWorkspace, currentPlan, refresh: refreshWorkspace } = useWorkspace();
  const { verticalActiva } = useVertical();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { profile } = useUserProfile();

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  // Estado para la configuración general (D6)
  const [crmName, setCrmName] = useState(
    currentWorkspace?.configuracion?.crm_name || currentWorkspace?.nombre || "Health CRM"
  );
  const [formatoFecha, setFormatoFecha] = useState(
    currentWorkspace?.configuracion?.formato_fecha || "dd/mm/yyyy"
  );
  const [verticalPrincipal, setVerticalPrincipal] = useState(
    currentWorkspace?.configuracion?.vertical_principal || "clinica"
  );
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
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/app");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && isAdmin && currentWorkspace?.id) {
      fetchUsuarios();
    }
  }, [roleLoading, isAdmin, currentWorkspace?.id]);

  // D7: Filtrar usuarios por centro (workspace activo)
  const fetchUsuarios = async () => {
    if (!currentWorkspace?.id) return;
    setLoadingUsers(true);
    try {
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("user_id, role")
        .eq("workspace_id", currentWorkspace.id);

      if (membersError) throw membersError;

      const userIds = (members || []).map((m: any) => m.user_id);
      if (userIds.length === 0) {
        setUsuarios([]);
        setLoadingUsers(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const usuariosConRoles = profilesData?.map((p) => {
        const userRole = rolesData?.find((r) => r.user_id === p.id);
        const wsRole = members?.find((m: any) => m.user_id === p.id)?.role;
        return {
          ...p,
          workspace_role: wsRole || "member",
          user_roles: userRole ? [{ role: userRole.role }] : [],
        };
      });

      setUsuarios(usuariosConRoles || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios de esta organización");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole });
      if (error) throw error;
      toast.success("Rol actualizado");
      fetchUsuarios();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar rol");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ activo: !currentStatus })
        .eq("id", userId);
      if (error) throw error;
      toast.success(`Usuario ${!currentStatus ? "activado" : "suspendido"} exitosamente`);
      fetchUsuarios();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const nombre = form.get("nombre") as string;
    const apellido = form.get("apellido") as string;
    const cedula = form.get("cedula") as string;
    const role = form.get("role") as string;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            cedula,
            role,
            created_by_admin: true,
            created_by: profile?.id,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user && currentWorkspace?.id) {
        await supabase.from("workspace_members").insert({
          workspace_id: currentWorkspace.id,
          user_id: authData.user.id,
          role: role === "admin" ? "admin" : "member",
        });
      }

      toast.success("Usuario creado e invitado a la organización");
      setCreateUserOpen(false);
      fetchUsuarios();
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  // D6: Guardar configuración general del Workspace
  const handleSaveGeneralConfig = async () => {
    if (!currentWorkspace?.id) return;
    setSavingGeneral(true);
    try {
      const nuevaConfig = {
        ...(currentWorkspace.configuracion || {}),
        crm_name: crmName,
        formato_fecha: formatoFecha,
        vertical_principal: verticalPrincipal,
      };

      const { error } = await supabase
        .from("workspaces")
        .update({
          nombre: crmName,
          configuracion: nuevaConfig,
        })
        .eq("id", currentWorkspace.id);

      if (error) throw error;

      await refreshWorkspace();
      toast.success("Configuración del centro guardada exitosamente");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar configuración");
    } finally {
      setSavingGeneral(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground animate-pulse">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const planLabel = currentPlan?.nombre ?? currentWorkspace?.plan_codigo ?? "Básico";
  const userLimit = currentPlan?.limite_usuarios ?? 1;
  const userUsagePercent = Math.min(100, Math.round((usuarios.length / userLimit) * 100));
  const trialDays = currentWorkspace?.trial_ends_at
    ? Math.ceil((new Date(currentWorkspace.trial_ends_at).getTime() - Date.now()) / 86_400_000)
    : null;

  const CurrentVerticalIcon =
    verticalActiva && verticalActiva !== "todas" ? verticalIcon[verticalActiva] : Activity;
  const currentVerticalLabel =
    verticalActiva && verticalActiva !== "todas" ? verticalLabel[verticalActiva] : "General";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Superior con Chip de Vertical Activa (Fase 3) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app")} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate">Administración del Centro</h1>
              <Badge className="bg-primary text-primary-foreground font-medium">
                {currentWorkspace?.role === "owner" ? "Propietario" : "Administrador"}
              </Badge>
              {/* Chip temático por vertical activa */}
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/30 text-primary bg-primary/5 font-medium"
              >
                <CurrentVerticalIcon className="h-3.5 w-3.5" />
                {currentVerticalLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {currentWorkspace?.nombre ?? "Gestión de sede y operaciones médicas"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="border-border">
            Plan: {planLabel}
          </Badge>
          <Badge variant="outline" className="border-border">
            Usuarios: {usuarios.length} / {userLimit}
          </Badge>
          {trialDays !== null && trialDays >= 0 && (
            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
              Prueba: {trialDays} días
            </Badge>
          )}
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation="vertical"
        className="grid gap-6 lg:grid-cols-[240px_1fr]"
      >
        {/* Navegación Lateral con border-l y herencia de color de vertical (Fase 3) */}
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-transparent p-0 lg:flex-col lg:items-stretch lg:overflow-visible lg:sticky lg:top-4 lg:self-start space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex gap-1 lg:flex-col">
              <p className="hidden lg:block px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="shrink-0 justify-start gap-2.5 px-3 py-2 text-sm rounded-md transition-all text-muted-foreground hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-l-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </div>
          ))}
        </TabsList>

        <div className="min-w-0 space-y-6">
          {/* TAB 1: GENERAL */}
          <TabsContent value="general" className="space-y-6 mt-0">
            {/* Tarjeta Plan y Uso (Fase 3) */}
            <GlassCard className="p-6 space-y-4">
              <SectionHeader
                title="Capacidad y Cuota del Plan"
                description={`Límites contratados para ${currentWorkspace?.nombre || "tu centro"}`}
                actions={
                  userUsagePercent >= 80 ? (
                    <Button
                      size="sm"
                      onClick={() => navigate("/app/planes")}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-4 w-4" />
                      Mejorar Plan
                    </Button>
                  ) : undefined
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 p-3 border rounded-lg bg-card/50">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Usuarios del Equipo</span>
                    <span>
                      {usuarios.length} de {userLimit} ({userUsagePercent}%)
                    </span>
                  </div>
                  <Progress value={userUsagePercent} className="h-2" />
                </div>
                <div className="space-y-2 p-3 border rounded-lg bg-card/50">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Nivel de Suscripción</span>
                    <Badge variant="outline" className="capitalize text-[11px]">
                      {currentWorkspace?.plan_codigo || "solo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tarifa: USD ${currentPlan?.precio_mensual_usd ?? 15} / mes
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Ajustes Generales del Workspace con guardado real (D6) */}
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Configuración General del Centro"
                description="Identidad institucional y formato regional"
              />
              <div className="grid gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="crmName">Nombre de la Institución / CRM</Label>
                  <Input
                    id="crmName"
                    value={crmName}
                    onChange={(e) => setCrmName(e.target.value)}
                    placeholder="Ej: Clínica Santa María"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verticalPrincipal">Especialidad / Vertical Principal</Label>
                  <Select
                    value={verticalPrincipal}
                    onValueChange={setVerticalPrincipal}
                  >
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

                <WorkspaceLocaleEditor />

                <Button
                  onClick={handleSaveGeneralConfig}
                  disabled={savingGeneral}
                  className="w-full sm:w-auto"
                >
                  {savingGeneral ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* TAB 2: APARIENCIA */}
          <TabsContent value="apariencia" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Personalización Visual"
                description="Temas y paletas de marca por especialidad"
              />
              <div className="grid gap-4 max-w-xl">
                <div className="p-4 border rounded-lg bg-card/50 space-y-2">
                  <p className="text-sm font-medium">Color de Marca por Vertical</p>
                  <p className="text-xs text-muted-foreground">
                    El sistema aplica automáticamente la paleta HSL optimizada para la vertical activa ({currentVerticalLabel}).
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-6 w-6 rounded-full bg-primary border" />
                    <span className="text-xs font-mono text-muted-foreground">
                      Token activo: --primary
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* TAB 3: CALENDARIO */}
          <TabsContent value="calendario" className="space-y-6 mt-0">
            <GlassCard className="p-6">
              <SectionHeader
                title="Días Feriados y No Laborables"
                description="Configuración de días libres institucionales"
              />
              <div className="pt-4">
                <DiasNoLaborablesCalendar />
              </div>
            </GlassCard>
          </TabsContent>

          {/* TAB 4: ESPECIALIDADES */}
          <TabsContent value="especialidades" className="space-y-6 mt-0">
            <GlassCard className="p-6">
              <SectionHeader
                title="Especialidades y Plantillas Clínicas"
                description="Configuración de formularios y plantillas médicas"
              />
              <div className="pt-4">
                <PlantillasEspecialidadAdmin />
              </div>
            </GlassCard>
          </TabsContent>

          {/* TAB 5: USUARIOS (D7 filtrado por centro) */}
          <TabsContent value="usuarios" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Equipo de la Organización"
                description={`Usuarios vinculados a ${currentWorkspace?.nombre || "este centro"}`}
                actions={
                  <Button onClick={() => setCreateUserOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </Button>
                }
              />

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground animate-pulse">Cargando equipo...</p>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay otros usuarios registrados en este centro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card/50 gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {usuario.nombre} {usuario.apellido}
                          </p>
                          <Badge
                            variant={usuario.activo ? "default" : "destructive"}
                            className="text-[10px]"
                          >
                            {usuario.activo ? "Activo" : "Suspendido"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {usuario.workspace_role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          defaultValue={usuario.user_roles?.[0]?.role || "user"}
                          onValueChange={(val) => handleRoleChange(usuario.id, val)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="coordinador">Coordinador</SelectItem>
                            <SelectItem value="medico">Médico</SelectItem>
                            <SelectItem value="enfermera">Enfermera</SelectItem>
                            <SelectItem value="recepcion">Recepción</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant={usuario.activo ? "outline" : "default"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleToggleUserStatus(usuario.id, usuario.activo)}
                          disabled={loading}
                        >
                          {usuario.activo ? "Suspender" : "Activar"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Diálogo Crear Usuario */}
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar / Crear Usuario al Centro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input id="nombre" name="nombre" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido *</Label>
                      <Input id="apellido" name="apellido" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula / Documento *</Label>
                    <Input id="cedula" name="cedula" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña Temporal *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol Institucional *</Label>
                    <Select name="role" defaultValue="medico" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="medico">Médico</SelectItem>
                        <SelectItem value="enfermera">Enfermera</SelectItem>
                        <SelectItem value="recepcion">Recepción</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando..." : "Crear e Integrar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB 6: ROLES */}
          <TabsContent value="roles" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Matriz de Roles y Permisos"
                description="Configuración granular por módulo del sistema"
              />
              <ModulePermissionsManager />
            </GlassCard>
          </TabsContent>

          {/* TAB 7: SEGURIDAD */}
          <TabsContent value="seguridad" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Seguridad y Protección HIPAA"
                description="Políticas de acceso, expiración de credenciales y 2FA"
              />
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                  <div>
                    <Label className="text-sm font-medium">Autenticación de Dos Factores (2FA)</Label>
                    <p className="text-xs text-muted-foreground">Requerir 2FA a administradores y personal</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                  <div>
                    <Label className="text-sm font-medium">Caducidad de Sesiones Inactivas</Label>
                    <p className="text-xs text-muted-foreground">Cierre automático tras 15 minutos sin actividad</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* TAB 8: CORREO */}
          <TabsContent value="correo" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Configuración de Servidor de Correo"
                description="Servicio SMTP institucional para avisos y recordatorios"
              />
              <div className="grid gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label>Host SMTP</Label>
                  <Input placeholder="smtp.tuclinica.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Puerto</Label>
                    <Input defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label>Seguridad</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">STARTTLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                  Guardar Configuración SMTP
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* TAB 9: PLANTILLAS */}
          <TabsContent value="plantillas" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Plantillas de Mensajería"
                description="Formatos de bienvenida, citas y avisos WhatsApp/Email"
                actions={
                  <Button size="sm" onClick={() => navigate("/plantillas")}>
                    Ir al Gestor Completo
                  </Button>
                }
              />
            </GlassCard>
          </TabsContent>

          {/* TAB 10: ENCUESTAS */}
          <TabsContent value="encuestas" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Encuestas de Satisfacción"
                description="Monitoreo de calidad asistencial y NPS de pacientes"
                actions={
                  <Button size="sm" onClick={() => navigate("/encuestas")}>
                    Ver Resultados
                  </Button>
                }
              />
            </GlassCard>
          </TabsContent>

          {/* TAB 11: AUTOMATIZACIONES */}
          <TabsContent value="automatizacion" className="space-y-6 mt-0">
            <GlassCard className="p-6 space-y-6">
              <SectionHeader
                title="Automatizaciones y Workflows"
                description="Disparadores de recordatorios y alertas automáticas"
                actions={
                  <Button size="sm" onClick={() => navigate("/automatizaciones")}>
                    Gestionar Flujos
                  </Button>
                }
              />
            </GlassCard>
          </TabsContent>

          {/* TAB 12: DATOS, SUBDOMINIO & BASE DE DATOS DEDICADA */}
          <TabsContent value="datos" className="space-y-6 mt-0">
            <ClinicDomainManager />
          </TabsContent>

          {/* TAB 13: AUDITORÍA */}
          <TabsContent value="auditoria" className="space-y-6 mt-0">
            <GlassCard className="p-6">
              <SectionHeader
                title="Auditoría y Trazabilidad Inmutable"
                description="Historial de accesos, modificaciones y seguridad"
              />
              <div className="pt-4">
                <AuditoriaCambiosViewer />
              </div>
            </GlassCard>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ConfiguracionAdmin;
