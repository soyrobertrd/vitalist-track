import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Phone,
  Calendar,
  LogOut,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Mail,
  Stethoscope,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Cog,
  Menu,
  CalendarDays,
  ScanLine,
  Route,
  Building2,
  Boxes,
  Truck,
  BookOpen,
  Shield,
  DollarSign,
  Wallet,
  UserCog as UserCogIcon,
  Target,
  Pill,
  CircleDot,
  Wrench,
  GraduationCap,
  Microscope,
  Sparkles,
  Trash2,
  ShieldCheck,
  Shirt,
  Heart,
  BedDouble,
  Eye,
  SmilePlus,
  Workflow,
  ListTodo,
  MessageCircle,
  FileSignature,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotificacionesSospechosos } from "@/hooks/useNotificacionesSospechosos";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { SucursalSwitcher } from "@/components/SucursalSwitcher";
import { VerticalSwitcher } from "@/components/VerticalSwitcher";
import { useVertical, VerticalTipo } from "@/contexts/VerticalContext";
import { useFreePlan } from "@/hooks/useFreePlan";
import { useEffectiveModules } from "@/hooks/useEffectiveModules";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, sidebarCollapsed, setSidebarCollapsed } = useTheme();
  const { profile } = useUserProfile();
  const { isAdmin } = useUserRole();
  const { verticalActiva } = useVertical();
  const { isFree } = useFreePlan();
  const { canAccess: canAccessModule, loading: loadingModules } = useEffectiveModules();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);

  // Enable automatic notifications for suspect patients
  useNotificacionesSospechosos();

  // Convenciones por subItem:
  //   verticales?: VerticalTipo[]  -> sólo visible en esas verticales (omitido = visible en todas)
  //   excludeVerticales?: VerticalTipo[] -> oculto en esas verticales
  // Items con `verticales` se ocultan si la activa no aplica.
  // Si un grupo queda sin subItems tras el filtro, se oculta.

  type VTipo = VerticalTipo;
  const va = verticalActiva as VTipo | "todas";

  const verticalLabel: Record<VTipo, string> = {
    clinica: "Hospital",
    dental: "Odontología",
    aesthetic: "Aesthetic Pro",
    recovery: "Recovery Care",
    vision: "VisionCare Pro",
    psicologia: "Psicología / Psiquiatría",
  };
  const verticalIcon: Record<VTipo, any> = {
    clinica: Activity,
    dental: CircleDot,
    aesthetic: Sparkles,
    recovery: BedDouble,
    vision: Eye,
    psicologia: Activity,
  };
  const verticalRoot: Record<VTipo, string> = {
    clinica: "/dashboard",
    dental: "/dental-care",
    aesthetic: "/aesthetic-pro",
    recovery: "/recovery-care",
    vision: "/vision-care",
    psicologia: "/psicologia-pro",
  };

  // El "Resumen [Vertical]" se fusiona con el Dashboard; no se muestra
  // como item separado en el menú lateral.

  const menuItems: any[] = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", moduleKey: "dashboard" },

    {
      path: "/agenda", icon: CalendarDays, label: "Agenda", moduleKey: "agenda",
      subItems: [
        { path: "/calendario", label: "Calendario", icon: CalendarDays },
        { path: "/llamadas", label: "Llamadas", icon: Phone, verticales: ["clinica"] },
        { path: "/visitas", label: "Visitas", icon: Calendar, verticales: ["clinica", "recovery"] },
        { path: "/rutas", label: "Rutas Optimizadas", icon: Route, verticales: ["clinica", "recovery"] },
        { path: "/recepcion", label: "Recepción", icon: ScanLine },
        { path: "/agenda-universal", label: "Agenda universal", verticales: ["clinica"] },
      ]
    },

    {
      path: "/pacientes", icon: Users, label: va === "aesthetic" ? "Clientes" : "Pacientes", moduleKey: "pacientes",
      subItems: [
        { path: "/pacientes", label: va === "aesthetic" ? "Lista de Clientes" : "Lista de Pacientes" },
        { path: "/sospechosos", label: "Sospechosos", verticales: ["clinica"] },
        { path: "/atencion-paciente", label: va === "aesthetic" ? "Atención al Cliente" : "Atención al Paciente", icon: Stethoscope },
        // Específicos por vertical integrados aquí:
        { path: "/odontograma", label: "Odontograma", icon: SmilePlus, verticales: ["dental"] },
        { path: "/dental-care?tab=planes", label: "Planes de tratamiento", verticales: ["dental"] },
        { path: "/dental-care?tab=ortodoncia", label: "Ortodoncia", verticales: ["dental"] },
        { path: "/dental-care?tab=presupuestos", label: "Presupuestos sonrisa", verticales: ["dental"] },
        { path: "/aesthetic-pro?tab=evaluaciones", label: "Evaluaciones estéticas", verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=fotos", label: "Fotos evolución", verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=membresias", label: "Membresías", icon: Heart, verticales: ["aesthetic"] },
        { path: "/vision-care?tab=recetas", label: "Recetas ópticas", verticales: ["vision"] },
        { path: "/recovery-care?tab=planes", label: "Planes de cuidado", verticales: ["recovery"] },
        { path: "/recovery-care?tab=seguimiento", label: "Seguimiento clínico", verticales: ["recovery"] },
        { path: "/recovery-care?tab=concierge", label: "Concierge médico", verticales: ["recovery"] },
        { path: "/recovery-care?tab=alertas", label: "Alertas Recovery", verticales: ["recovery"] },
        { path: "/psicologia-pro?tab=fichas", label: "Fichas psico", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=sesiones", label: "Sesiones", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=notas", label: "Notas clínicas", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=evaluaciones", label: "Tests/Escalas", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=seguimiento", label: "Seguimiento emocional", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=psiquiatria", label: "Psiquiatría", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=tareas", label: "Tareas terapéuticas", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=paquetes", label: "Paquetes/Bonos", verticales: ["psicologia"] },
      ]
    },

    {
      path: "/clinico", icon: Stethoscope, label: "Clínico", moduleKey: "clinico",
      verticales: ["clinica"] as VerticalTipo[],
      subItems: [
        { path: "/triaje", label: "Triaje" },
        { path: "/hospitalizacion", label: "Hospitalización" },
        { path: "/alta-hospitalaria", label: "Alta Hospitalaria" },
        { path: "/rondas-medicas", label: "Rondas / Visitas médicas" },
        { path: "/enfermeria", label: "Enfermería" },
        { path: "/uci", label: "UCI: infusiones / kardex" },
        { path: "/quirofano", label: "Quirófano / Cirugía" },
        { path: "/urgencias-triage", label: "Urgencias / Triage" },
        { path: "/censo-camas", label: "Censo & Mapa de Camas" },
        { path: "/oncologia", label: "Oncología & Quimio" },
        { path: "/maternidad-neonatologia", label: "Maternidad & Neonatología" },
        { path: "/ordenes-medicas", label: "Órdenes Médicas (CPOE)" },
        { path: "/alertas-clinicas", label: "Alertas Clínicas" },
        { path: "/protocolos-clinicos", label: "Protocolos Clínicos" },
        { path: "/workflows-clinicos", label: "Workflows Clínicos" },
        { path: "/reglas-clinicas", label: "Motor de Reglas Clínicas" },
        { path: "/catalogos-clinicos", label: "Catálogos CIE-10 / CPT" },
        { path: "/vademecum", label: "Vademécum & Interacciones" },
      ]
    },

    {
      path: "/diagnostico", icon: Microscope, label: "Diagnóstico", moduleKey: "diagnostico",
      verticales: ["clinica"] as VerticalTipo[],
      subItems: [
        { path: "/laboratorio", label: "Laboratorio" },
        { path: "/laboratorio-avanzado", label: "Laboratorio (avanzado)" },
        { path: "/imagenologia", label: "Imagenología" },
        { path: "/visor-dicom", label: "Visor DICOM" },
        { path: "/banco-sangre", label: "Banco de Sangre" },
        { path: "/banco-sangre-avanzado", label: "Banco de Sangre (avanzado)" },
      ]
    },

    {
      path: "/recursos", icon: Building2, label: "Recursos", moduleKey: "recursos",
      subItems: [
        { path: "/consultorios", label: "Consultorios", icon: Building2, verticales: ["clinica"] },
        { path: "/farmacia", label: "Farmacia", icon: Pill, verticales: ["clinica"] },
        { path: "/nutricion", label: "Nutrición y Dietética", verticales: ["clinica"] },
        { path: "/rehabilitacion", label: "Rehabilitación", verticales: ["clinica"] },
        { path: "/esterilizacion", label: "Esterilización / CEYE", icon: Sparkles, verticales: ["clinica"] },
        { path: "/morgue", label: "Morgue y Patología", icon: Microscope, verticales: ["clinica"] },
        { path: "/mantenimiento", label: "Mantenimiento", icon: Wrench, verticales: ["clinica"] },
        { path: "/lavanderia", label: "Lavandería y Ropería", icon: Shirt, verticales: ["clinica"] },
        { path: "/residuos", label: "Gestión de Residuos", icon: Trash2, verticales: ["clinica"] },
        { path: "/seguridad-fisica", label: "Seguridad Física", icon: ShieldCheck, verticales: ["clinica"] },
        { path: "/trabajo-social", label: "Trabajo Social", icon: Heart, verticales: ["clinica"] },
        { path: "/docencia", label: "Docencia e Investigación", icon: GraduationCap, verticales: ["clinica"] },
        // Recursos específicos por vertical:
        { path: "/dental-care?tab=sillones", label: "Sillones / Boxes", icon: Building2, verticales: ["dental"] },
        { path: "/dental-care?tab=laboratorio", label: "Laboratorio dental", icon: Microscope, verticales: ["dental"] },
        { path: "/aesthetic-pro?tab=cabinas", label: "Cabinas", icon: Building2, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=procedimientos", label: "Procedimientos", verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=paquetes", label: "Paquetes", icon: Boxes, verticales: ["aesthetic"] },
        { path: "/vision-care?tab=inventario", label: "Inventario óptico", icon: Boxes, verticales: ["vision"] },
        { path: "/vision-care?tab=ordenes", label: "Órdenes de laboratorio", verticales: ["vision"] },
        { path: "/vision-care?tab=combos", label: "Combos lentes", verticales: ["vision"] },
        { path: "/vision-care?tab=garantias", label: "Garantías", verticales: ["vision"] },
        { path: "/recovery-care?tab=habitaciones", label: "Habitaciones", icon: BedDouble, verticales: ["recovery"] },
        { path: "/recovery-care?tab=reservas", label: "Reservas", verticales: ["recovery"] },
      ]
    },

    {
      path: "/financiero", icon: DollarSign, label: "Financiero", adminOnly: true, moduleKey: "financiero",
      subItems: [
        { path: "/finanzas?tab=caja", label: "Caja", icon: DollarSign },
        { path: "/finanzas?tab=devoluciones", label: "Notas de crédito" },
        { path: "/finanzas?tab=aseguradoras", label: "Aseguradoras (ARS)", icon: Building2 },
        { path: "/finanzas?tab=tarifarios", label: "Tarifarios ARS" },
        { path: "/finanzas?tab=autorizaciones", label: "Autorizaciones" },
        { path: "/finanzas?tab=reclamaciones", label: "Reclamaciones" },
        { path: "/contabilidad", label: "Contabilidad" },
        { path: "/nomina", label: "Nómina" },
        { path: "/compras", label: "Compras" },
        { path: "/forecast-ingresos", label: "Forecast de Ingresos" },
        { path: "/ar-aging", label: "AR Aging (Cuentas por cobrar)" },
        { path: "/costeo-servicios", label: "Costeo por Servicio" },
        { path: "/dental-care?tab=comisiones", label: "Comisiones doctores", verticales: ["dental"] },
        { path: "/aesthetic-pro?tab=financiamiento", label: "Financiamiento estética", verticales: ["aesthetic"] },
      ]
    },

    {
      path: "/equipo", icon: UserCog, label: "Equipo & RRHH", adminOnly: true, moduleKey: "equipo",
      subItems: [
        { path: "/personal", label: "Personal de salud" },
        { path: "/rrhh", label: "Recursos Humanos" },
        { path: "/organizaciones", label: "Organizaciones", icon: Building2 },
        { path: "/comisiones-empleados", label: "Comisiones empleados", icon: DollarSign },
        { path: "/evaluaciones-desempeno", label: "Evaluaciones de Desempeño" },
        { path: "/metas-incentivos", label: "Metas e Incentivos" },
        { path: "/capacitaciones", label: "Capacitaciones" },
      ]
    },

    { path: "/encuestas", icon: MessageSquare, label: "Encuestas" },
    { path: "/automatizaciones", icon: Cog, label: "Automatizaciones" },

    {
      path: "/operaciones", icon: Workflow, label: "Operaciones",
      subItems: [
        { path: "/workflows-avanzados", label: "Workflows automáticos", icon: Workflow },
        { path: "/tareas", label: "Tareas internas", icon: ListTodo },
        { path: "/chat", label: "Chat interno", icon: MessageCircle },
        { path: "/firmas", label: "Firmas digitales", icon: FileSignature },
      ]
    },

    { path: "/inventario", icon: Boxes, label: "Inventario" },

    {
      path: "/crm", icon: Target, label: "CRM & Marketing", adminOnly: true,
      subItems: [
        { path: "/crm", label: "CRM principal" },
        { path: "/segmentacion", label: "Segmentación", icon: Target },
        { path: "/perfil-valor", label: "Perfil de valor (LTV)", icon: BarChart3 },
        { path: "/referidos", label: "Programa de referidos", icon: Users },
        { path: "/beneficios-usuarios", label: "Beneficios / Loyalty", icon: Heart },
        { path: "/aesthetic-pro?tab=leads", label: "Leads estética", verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=promos", label: "Promociones", verticales: ["aesthetic"] },
        { path: "/dental-care?tab=recordatorios", label: "Fidelización dental", verticales: ["dental"] },
      ]
    },

    { path: "/turnos", icon: Monitor, label: "Turnos y Colas", verticales: ["clinica"] as VerticalTipo[] },

    // Interoperabilidad / clínica avanzada (sólo hospital)
    {
      path: "/avanzado", icon: Shield, label: "Avanzado",
      verticales: ["clinica"] as VerticalTipo[],
      subItems: [
        { path: "/quirofano-avanzado", label: "Quirófano (avanzado)" },
        { path: "/interoperabilidad", label: "Interoperabilidad HL7/FHIR" },
        { path: "/pwa-offline", label: "PWA Offline / Dispositivos" },
        { path: "/calidad", label: "Gestión de Calidad" },
        { path: "/centro-comando", label: "Centro de Comando" },
      ]
    },

    // Telemedicina común
    { path: "/telemedicina", icon: Activity, label: "Telemedicina" },

    {
      path: "/config-grupo", icon: Settings, label: "Configuración", adminOnly: true,
      subItems: [
        { path: "/configuracion-admin", label: "Sistema", icon: Cog },
        { path: "/verticales", label: "Verticales del centro", icon: Building2 },
        { path: "/organizaciones", label: "Organizaciones", icon: Building2 },
        { path: "/afiliaciones", label: "Afiliaciones", icon: Building2 },
        { path: "/plantillas", label: "Plantillas (WhatsApp/Email)", icon: MessageSquare },
        { path: "/api-citas", label: "API Pública Citas", icon: Cog },
        { path: "/auditoria", label: "Auditoría", icon: Shield },
        { path: "/checklist-rls", label: "Checklist RLS", icon: Shield },
      ]
    },
    { path: "/soporte", icon: HelpCircle, label: "Soporte" },
  ];

  // Helpers de filtrado por vertical sobre subItems
  const subItemAplica = (sub: any): boolean => {
    if (va === "todas") return true;
    if (sub.excludeVerticales && sub.excludeVerticales.includes(va)) return false;
    if (sub.verticales && !sub.verticales.includes(va)) return false;
    return true;
  };

  // Plan FREE: solo Dashboard, Agenda (calendario), Pacientes, Ficha clínica.
  // Las rutas permitidas en plan free están en esta whitelist.
  const FREE_ALLOWED_PATHS = new Set<string>([
    "/dashboard",
    "/agenda", // grupo padre
    "/calendario",
    "/recepcion",
    "/pacientes", // grupo padre + lista
    "/atencion-paciente",
    "/soporte",
    "/configuracion",
  ]);
  const isFreeAllowed = (path: string) => {
    const base = path.split("?")[0];
    return FREE_ALLOWED_PATHS.has(base);
  };

  // Filtrado por vertical activa: oculta items específicos no aplicables
  // y filtra subItems individualmente. Si un grupo queda vacío, se oculta.
  const visibleMenuItems = menuItems
    .filter((item) => {
      if (!item.verticales) return true;
      if (va === "todas") return true;
      return item.verticales.includes(va);
    })
    .map((item) => {
      if (!item.subItems) return item;
      let filtered = item.subItems.filter(subItemAplica);
      if (isFree) filtered = filtered.filter((s: any) => isFreeAllowed(s.path));
      return { ...item, subItems: filtered };
    })
    .filter((item) => {
      if (item.subItems) return item.subItems.length > 0;
      if (isFree) return isFreeAllowed(item.path);
      return true;
    });

  // Helpers para comparar rutas con o sin query param `?tab=`
  const splitPath = (full: string) => {
    const [p, q = ""] = full.split("?");
    const tab = new URLSearchParams(q).get("tab") || "";
    return { p, tab };
  };
  const currentTab = new URLSearchParams(location.search).get("tab") || "";
  const isSubItemActive = (subPath: string) => {
    const { p, tab } = splitPath(subPath);
    if (p !== location.pathname) return false;
    // Si el subItem no especifica tab, sólo activa cuando no hay tab en URL (resumen)
    if (!tab) return !currentTab;
    return tab === currentTab;
  };

  // Auto-expand the correct parent menu based on current route
  const getActiveParentMenu = () => {
    for (const item of visibleMenuItems) {
      if ('subItems' in item && item.subItems) {
        if (item.subItems.some(sub => splitPath(sub.path).p === location.pathname)) {
          return item.path;
        }
      }
    }
    return null;
  };

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(getActiveParentMenu);

  // Update open submenu when location changes
  useEffect(() => {
    const activeParent = getActiveParentMenu();
    if (activeParent) {
      setOpenSubmenu(activeParent);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      navigate("/auth");
    }
  };

  const toggleSubmenu = (path: string) => {
    setOpenSubmenu(openSubmenu === path ? null : path);
  };

  const themeIcons = {
    light: Sun,
    dark: Moon,
    standard: Monitor,
  };

  const ThemeIcon = themeIcons[theme];


  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-sidebar-border flex items-center",
        sidebarCollapsed ? "justify-center" : "justify-between gap-2"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="h-8 w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-sidebar-foreground truncate">Health App</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Gestión clínica · v2.1.0</p>
            </div>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
        {sidebarCollapsed && isMobile && <Activity className="h-6 w-6 text-primary" />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleMenuItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin)).map((item) => (
          <div key={item.path}>
            {'subItems' in item && item.subItems ? (
              <Collapsible open={openSubmenu === item.path} onOpenChange={() => toggleSubmenu(item.path)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      "text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            openSubmenu === item.path && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 ml-6 rounded-lg text-sm font-medium transition-all duration-200",
                        isSubItemActive(subItem.path)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                      {!sidebarCollapsed && subItem.label}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-2 border-t border-sidebar-border space-y-2">
        {/* Workspace Switcher */}
        <WorkspaceSwitcher collapsed={sidebarCollapsed} />
        <div className={sidebarCollapsed ? "flex justify-center" : ""}>
          <VerticalSwitcher collapsed={sidebarCollapsed} />
        </div>

        {/* User Profile Dropdown */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full ${
                  sidebarCollapsed ? "justify-center px-2 h-auto py-2" : "justify-start h-auto py-2"
                } text-sidebar-foreground hover:bg-sidebar-accent`}
              >
                <div className={`flex items-center gap-2 ${sidebarCollapsed ? "" : "w-full"}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile.nombre[0]}{profile.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">
                        {profile.nombre} {profile.apellido}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                        {profile.rol}
                      </p>
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                navigate("/configuracion");
                setMobileMenuOpen(false);
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigate("/plantillas");
                setMobileMenuOpen(false);
              }}>
                <Mail className="mr-2 h-4 w-4" />
                Plantillas de mensajes
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => {
                  navigate("/configuracion-admin");
                  setMobileMenuOpen(false);
                }}>
                  <Cog className="mr-2 h-4 w-4" />
                  Configuración del Sistema
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-sidebar border-r border-sidebar-border transition-all duration-300`}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-sidebar-foreground">Health App</span>
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <SucursalSwitcher compact />
            <GlobalSearch />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0 bg-sidebar border-sidebar-border">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
        {/* Desktop Top Bar */}
        {!isMobile && (
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-6 py-3">
              <Breadcrumbs />
              <div className="flex items-center gap-3">
                <OfflineIndicator />
                <SucursalSwitcher />
                <GlobalSearch />
              </div>
            </div>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Theme Customizer Dialog */}
      <ThemeCustomizer 
        open={themeCustomizerOpen} 
        onOpenChange={setThemeCustomizerOpen} 
      />
    </div>
  );
};

export default Layout;