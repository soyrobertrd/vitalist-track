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

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, sidebarCollapsed, setSidebarCollapsed } = useTheme();
  const { profile } = useUserProfile();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);

  // Enable automatic notifications for suspect patients
  useNotificacionesSospechosos();

  // Menu items configuration
  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    {
      path: "/agenda",
      icon: CalendarDays,
      label: "Agenda",
      subItems: [
        { path: "/calendario", label: "Calendario", icon: CalendarDays },
        { path: "/llamadas", label: "Llamadas", icon: Phone },
        { path: "/visitas", label: "Visitas", icon: Calendar },
        { path: "/rutas", label: "Rutas Optimizadas", icon: Route },
        { path: "/recepcion", label: "Recepción", icon: ScanLine }
      ]
    },
    {
      path: "/pacientes",
      icon: Users,
      label: "Pacientes",
      subItems: [
        { path: "/pacientes", label: "Lista de Pacientes" },
        { path: "/sospechosos", label: "Sospechosos" },
        { path: "/atencion-paciente", label: "Atención al Paciente", icon: Stethoscope }
      ]
    },
    { path: "/personal", icon: UserCog, label: "Personal", adminOnly: true },
    { path: "/encuestas", icon: MessageSquare, label: "Encuestas" },
    { path: "/plantillas", icon: MessageSquare, label: "Plantillas (WhatsApp/Email)", adminOnly: true },
    { path: "/automatizaciones", icon: Cog, label: "Automatizaciones" },
    { 
      path: "/reportes", 
      icon: BarChart3, 
      label: "Reportes",
      subItems: [
        { path: "/reportes", label: "Reportes Generales" },
        { path: "/dashboard-geografico", label: "Dashboard Geográfico" }
      ]
    },
    { path: "/soporte", icon: HelpCircle, label: "Soporte" },
  ];

  // Auto-expand the correct parent menu based on current route
  const getActiveParentMenu = () => {
    for (const item of menuItems) {
      if ('subItems' in item && item.subItems) {
        if (item.subItems.some(sub => sub.path === location.pathname)) {
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
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Health App</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestión clínica · v2.1.0</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && <Activity className="h-6 w-6 text-primary mx-auto" />}
      </div>

      {/* Toggle Button - Solo en desktop */}
      {!isMobile && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Colapsar
              </>
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin)).map((item) => (
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
                        location.pathname === subItem.path
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