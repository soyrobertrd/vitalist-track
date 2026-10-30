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
  Plus,
  UserPlus,
  CalendarPlus,
  Menu as MenuIcon,
  FileText,
  Syringe,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotificacionesSospechosos } from "@/hooks/useNotificacionesSospechosos";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { VERTICAL_LABELS, VERTICAL_ICONS, VERTICAL_ROOTS } from "@/config/verticales";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { SucursalSwitcher } from "@/components/SucursalSwitcher";
import { VerticalSwitcher } from "@/components/VerticalSwitcher";
import { useVertical, VerticalTipo } from "@/contexts/VerticalContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useFreePlan } from "@/hooks/useFreePlan";
import { useEffectiveModules } from "@/hooks/useEffectiveModules";
import { isSidebarItemVisible } from "@/config/sidebar-permissions";

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
  const { currentWorkspace } = useWorkspace();
  const { isFree } = useFreePlan();
  const { canAccess: canAccessModule, loading: loadingModules } = useEffectiveModules();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);

  // Código de plan del workspace activo
  const planCodigo = currentWorkspace?.plan_codigo || "solo";

  // Enable automatic notifications for suspect patients
  useNotificacionesSospechosos();

  // Convenciones por subItem:
  //   verticales?: VerticalTipo[]  -> sólo visible en esas verticales (omitido = visible en todas)
  //   excludeVerticales?: VerticalTipo[] -> oculto en esas verticales
  // Items con `verticales` se ocultan si la activa no aplica.
  // Si un grupo queda sin subItems tras el filtro, se oculta.

  type VTipo = VerticalTipo;
  const va = verticalActiva as VTipo | "todas";

  const verticalLabel = VERTICAL_LABELS;
  const verticalIcon = VERTICAL_ICONS;
  const verticalRoot = VERTICAL_ROOTS;

  // El "Resumen [Vertical]" se fusiona con el Dashboard; no se muestra
  // como item separado en el menú lateral.

  const menuItems: any[] = [
    { path: "/app", icon: LayoutDashboard, label: "Dashboard", moduleKey: "dashboard" },

    {
      path: "/agenda", icon: CalendarDays, label: "Agenda & Citas", moduleKey: "agenda",
      subItems: [
        { path: "/app/citas", label: "Citas & Consultas", icon: Calendar },
        { path: "/calendario", label: "Calendario", icon: CalendarDays },
        { path: "/recepcion", label: "Recepción", icon: ScanLine },
        { path: "/rutas", label: "Rutas Domiciliarias", icon: Route, verticales: ["clinica", "recovery"] },
        { path: "/llamadas", label: "Llamadas de soporte", icon: Phone, verticales: ["clinica"] },
        { path: "/agenda-universal", label: "Agenda universal" },
      ]
    },

    {
      path: "/pacientes", icon: Users, label: va === "aesthetic" ? "Clientes" : va === "veterinaria" ? "Mascotas" : "Pacientes", moduleKey: "pacientes",
      subItems: [
        { path: "/pacientes", label: va === "aesthetic" ? "Lista de Clientes" : "Lista de Pacientes" },
        { path: "/sospechosos", label: "Sospechosos", verticales: ["clinica"] },
        { path: "/atencion-paciente", label: va === "aesthetic" ? "Atención al Cliente" : "Atención al Paciente", icon: Stethoscope },
        // Específicos por vertical integrados aquí:
        { path: "/odontograma", label: "Odontograma", icon: SmilePlus, verticales: ["dental"] },
        { path: "/dental-care?tab=planes", label: "Planes de tratamiento", verticales: ["dental"] },
        { path: "/dental-care?tab=ortodoncia", label: "Ortodoncia", verticales: ["dental"] },
        { path: "/dental-care?tab=presupuestos", label: "Presupuestos sonrisa", verticales: ["dental"] },
        { path: "/dental-care?tab=consentimiento", label: "Consentimiento quirúrgico", icon: ShieldCheck, verticales: ["dental"] },
        { path: "/aesthetic-pro?tab=evaluaciones", label: "Evaluaciones estéticas", verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=ficha_biotipo", label: "Ficha Cutánea & Bonos", icon: Sparkles, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=mapa_facial", label: "Face Mapping / Toxina", icon: Syringe, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=viales", label: "Trazabilidad Viales/Botox", icon: Syringe, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=fotos", label: "Fotos evolución & Split", icon: Camera, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=cuidados_post", label: "Cuidados & Rutina en Casa", icon: Sparkles, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=gift_cards", label: "Gift Cards & Membresías", icon: Heart, verticales: ["aesthetic"] },
        { path: "/aesthetic-pro?tab=membresias", label: "Membresías Spa", icon: Heart, verticales: ["aesthetic"] },
        { path: "/vision-care?tab=recetas", label: "Recetas ópticas", verticales: ["vision"] },
        { path: "/vet-care?tab=mascotas", label: "Fichas de mascotas", verticales: ["veterinaria"] },
        { path: "/vet-care?tab=vacunas", label: "Calendario de vacunas", verticales: ["veterinaria"] },
        { path: "/vet-care?tab=boxes", label: "Boxes & Aislamiento", icon: BedDouble, verticales: ["veterinaria"] },
        { path: "/recovery-care?tab=planes", label: "Planes de cuidado", verticales: ["recovery"] },
        { path: "/recovery-care?tab=seguimiento", label: "Drenajes & Signos", icon: Heart, verticales: ["recovery"] },
        { path: "/recovery-care?tab=concierge", label: "Concierge médico", verticales: ["recovery"] },
        { path: "/recovery-care?tab=alertas", label: "Alertas Recovery", verticales: ["recovery"] },
        { path: "/psicologia-pro?tab=fichas", label: "Fichas psico", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=salas", label: "Consultorios & Salas", icon: Building2, verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=sesiones", label: "Sesiones", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=notas", label: "Notas clínicas", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=evaluaciones", label: "Tests/Escalas", verticales: ["psicologia"] },
        { path: "/psicologia-pro?tab=consentimiento", label: "Consentimiento ético", icon: ShieldCheck, verticales: ["psicologia"] },
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
        { path: "/urgencias-triage", label: "Urgencias & Triage MTS" },
        { path: "/escalas-medicas", label: "Escalas Médicas & Calculadoras" },
        { path: "/notas-medicas", label: "Notas Médicas & Multidisciplinario" },
        { path: "/hospitalizacion", label: "Hospitalización" },
        { path: "/alta-hospitalaria", label: "Alta Hospitalaria" },
        { path: "/rondas-medicas", label: "Rondas / Visitas médicas" },
        { path: "/enfermeria", label: "Enfermería" },
        { path: "/uci", label: "UCI: infusiones / kardex" },
        { path: "/quirofano", label: "Quirófano / Cirugía" },
        { path: "/censo-camas", label: "Censo & Mapa de Camas" },
        { path: "/edificacion-hospitalaria", label: "Edificación & Censo Camas", icon: Building2 },
        { path: "/oncologia", label: "Oncología & Quimio" },
        { path: "/cardiologia", label: "Cardiología & CHA2DS2" },
        { path: "/diabetes-endocrinologia", label: "Diabetes & FINDRISC" },
        { path: "/pediatria", label: "Pediatría & Puericultura" },
        { path: "/ginecologia-obstetricia", label: "Ginecología & Obstetricia" },
        { path: "/neurologia", label: "Neurología & Escala NIHSS" },
        { path: "/nefrologia", label: "Nefrología & TFG CKD-EPI" },
        { path: "/neumologia", label: "Neumología & EPOC GOLD" },
        { path: "/gastroenterologia", label: "Gastroenterología & Forrest" },
        { path: "/traumatologia-ortopedia", label: "Traumatología & Gustilo" },
        { path: "/urologia", label: "Urología & Score IPSS" },
        { path: "/dermatologia", label: "Dermatología & ABCDE" },
        { path: "/maternidad-neonatologia", label: "Maternidad & Neonatología" },
        { path: "/consentimientos-informados", label: "Consentimientos & Firma" },
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
        { path: "/facturacion-electronica-rd", label: "Facturación DGII (NCF/e-CF)", icon: FileText },
        { path: "/comisiones-empleados", label: "Honorarios Médicos & Split", icon: Stethoscope },
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
        { path: "/turnos-personal", label: "Turnos & Guardias 24/7", icon: Calendar },
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
      path: "/crm", icon: Target, label: "CRM & Marketing", adminOnly: true, moduleKey: "crm",
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

    { path: "/turnos", icon: Monitor, label: "Turnos y Colas", moduleKey: "turnos", verticales: ["clinica"] as VerticalTipo[] },

    // Interoperabilidad / clínica avanzada (sólo hospital)
    {
      path: "/avanzado", icon: Shield, label: "Avanzado", moduleKey: "avanzado",
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
    { path: "/telemedicina", icon: Activity, label: "Telemedicina", moduleKey: "telemedicina" },

    {
      path: "/reportes-bi", icon: BarChart3, label: "Reportes & BI",
      subItems: [
        { path: "/reportes", label: "Reportes generales", icon: BarChart3 },
        { path: "/reportes-programados", label: "Reportes programados" },
        { path: "/reportes-regulatorios", label: "Reportes regulatorios (SINAVE)" },
        { path: "/sospechosos", label: "Vigilancia Brotes & EPI" },
        { path: "/dashboard-bi", label: "Dashboard BI" },
        { path: "/reportes/dental", label: "Reportes Dental", verticales: ["dental"] as VerticalTipo[] },
        { path: "/reportes/vision", label: "Reportes Vision", verticales: ["vision"] as VerticalTipo[] },
        { path: "/reportes/aesthetic", label: "Reportes Estética", verticales: ["aesthetic"] as VerticalTipo[] },
        { path: "/reportes/recovery", label: "Reportes Recovery", verticales: ["recovery"] as VerticalTipo[] },
        { path: "/psicologia/reportes", label: "Reportes Psicología", verticales: ["psicologia"] as VerticalTipo[] },
      ],
    },

    {
      path: "/config-grupo", icon: Settings, label: "Configuración", adminOnly: true, moduleKey: "config",
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
    { path: "/soporte", icon: HelpCircle, label: "Soporte", moduleKey: "soporte" },
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
    "/agenda-universal", // agenda personal de cada profesional
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

  // Filtrado exhaustivo por vertical activa y nivel de plan:
  // evalúa permisos dinámicos con isSidebarItemVisible.
  const visibleMenuItems = menuItems
    .filter((item) => {
      // 1. Visibilidad del módulo padre según plan, vertical y rol admin
      return isSidebarItemVisible({
        moduleKey: item.moduleKey,
        path: item.path,
        verticales: item.verticales,
        adminOnly: item.adminOnly,
        currentPlanCodigo: planCodigo,
        activeVertical: va,
        isAdmin,
      });
    })
    // 2. Filtro por permisos de módulos efectivos en base de datos si aplica
    .filter((item) => loadingModules || canAccessModule(item.moduleKey))
    .map((item) => {
      if (!item.subItems) return item;
      let filtered = item.subItems
        .filter(subItemAplica)
        .filter((sub: any) =>
          isSidebarItemVisible({
            moduleKey: sub.moduleKey,
            path: sub.path,
            verticales: sub.verticales,
            adminOnly: sub.adminOnly,
            currentPlanCodigo: planCodigo,
            activeVertical: va,
            isAdmin,
          })
        );
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
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleMenuItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin)).map((item, idx, lista) => (
          <div key={item.path}>
            {/* Etiquetas de sección (MENÚ / CLÍNICA / GESTIÓN / OTROS), como en las referencias */}
            {!sidebarCollapsed && SECCION[item.moduleKey] && SECCION[item.moduleKey] !== SECCION[lista[idx - 1]?.moduleKey] && (
              <p className={cn("px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50", idx > 0 && "pt-4")}>
                {SECCION[item.moduleKey]}
              </p>
            )}
            {'subItems' in item && item.subItems ? (
              <Collapsible open={openSubmenu === item.path} onOpenChange={() => toggleSubmenu(item.path)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      // El grupo se marca cuando alguna de sus páginas está abierta
                      item.subItems.some((si: any) => isSubItemActive(si.path))
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground"
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
                <CollapsibleContent className="ml-5 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isSubItemActive(subItem.path)
                          ? "bg-sidebar-primary/10 font-semibold text-sidebar-primary"
                          : "font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
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
    <div className="flex h-dvh overflow-hidden bg-background">
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
            <NotificationBell />
            <LanguageSwitcher />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground min-h-11 min-w-11" aria-label="Abrir menú">
                  <Menu className="h-6 w-6" aria-hidden="true" />
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
      <main className={`relative flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
        {/* Desktop Top Bar */}
        {!isMobile && (
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-6 py-3">
              <Breadcrumbs />
              <div className="flex items-center gap-3">
                <OfflineIndicator />
                <SucursalSwitcher />
                <GlobalSearch />
                {/* Creación rápida (estilo barra superior de las referencias) */}
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/app/citas")}>
                  <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Cita
                </Button>
                <Button size="sm" className="rounded-full" onClick={() => navigate("/pacientes?nuevo=1")}>
                  <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Paciente
                </Button>
                <NotificationBell />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
        <div className={`p-4 sm:p-6 lg:p-8 ${isMobile ? "pb-24" : ""}`}>{children}</div>
      </main>

      {/* Navegación inferior en móvil (patrón de las apps de referencia) */}
      {isMobile && (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border bg-card/95 p-1.5 shadow-lg backdrop-blur"
        >
          {[
            { to: "/app", label: "Inicio", icon: LayoutDashboard },
            { to: "/pacientes", label: va === "veterinaria" ? "Mascotas" : va === "aesthetic" ? "Clientes" : "Pacientes", icon: Users },
            { to: "/pacientes?nuevo=1", label: "Nuevo", icon: Plus, destacado: true },
            { to: "/app/citas", label: "Citas", icon: Calendar },
          ].map(({ to, label, icon: Icon, destacado }) => {
            const activo = !destacado && location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-medium transition-colors",
                  destacado
                    ? "bg-primary text-primary-foreground"
                    : activo ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <MenuIcon className="h-5 w-5" aria-hidden="true" />
            Menú
          </button>
        </nav>
      )}

      {/* Theme Customizer Dialog */}
      <ThemeCustomizer 
        open={themeCustomizerOpen} 
        onOpenChange={setThemeCustomizerOpen} 
      />
    </div>
  );
};

export default Layout;

const SECCION: Record<string, string> = {
  dashboard: "Menú principal", agenda: "Menú principal", pacientes: "Menú principal",
  clinico: "Clínica", diagnostico: "Clínica", recursos: "Clínica", turnos: "Clínica", telemedicina: "Clínica",
  financiero: "Gestión", equipo: "Gestión", crm: "Gestión", avanzado: "Gestión",
  config: "Otros", soporte: "Otros",
};