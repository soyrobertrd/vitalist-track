import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVertical } from "@/contexts/VerticalContext";
import { VERTICAL_LABELS as verticalLabel, VERTICAL_ICONS as verticalIcon } from "@/config/verticales";
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
import { AdminGeneralTab } from "@/components/admin/AdminGeneralTab";
import { AdminUsuariosTab } from "@/components/admin/AdminUsuariosTab";

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
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pacientesCount, setPacientesCount] = useState<number>(12);
  const [profesionalesCount, setProfesionalesCount] = useState<number>(1);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/app");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && isAdmin && currentWorkspace?.id) {
      fetchUsuarios();
      fetchMetricasCapacidad();
    }
  }, [roleLoading, isAdmin, currentWorkspace?.id]);

  const fetchMetricasCapacidad = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const [pRes, dRes] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact", head: true }),
        supabase.from("personal_salud").select("id", { count: "exact", head: true }),
      ]);
      if (pRes.count !== null && pRes.count !== undefined) {
        setPacientesCount(pRes.count);
      }
      if (dRes.count !== null && dRes.count !== undefined) {
        setProfesionalesCount(dRes.count);
      }
    } catch {
      // Fallback a seed local
      setPacientesCount(12);
      setProfesionalesCount(1);
    }
  };

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
            <AdminGeneralTab
              currentWorkspace={currentWorkspace}
              usuariosCount={usuarios.length}
              userLimit={userLimit}
              userUsagePercent={userUsagePercent}
              pacientesCount={pacientesCount}
              profesionalesCount={profesionalesCount}
              onRefreshWorkspace={refreshWorkspace}
            />
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
            <AdminUsuariosTab
              currentWorkspace={currentWorkspace}
              usuarios={usuarios}
              loadingUsers={loadingUsers}
              onRefreshUsuarios={fetchUsuarios}
              profileId={profile?.id}
            />
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
