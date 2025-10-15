import { ReactNode } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, sidebarCollapsed, setSidebarCollapsed } = useTheme();
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      navigate("/auth");
    }
  };

  const themeIcons = {
    light: Sun,
    dark: Moon,
    standard: Monitor,
  };

  const ThemeIcon = themeIcons[theme];

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/pacientes", icon: Users, label: "Pacientes" },
    { path: "/personal", icon: UserCog, label: "Personal" },
    { path: "/llamadas", icon: Phone, label: "Llamadas" },
    { path: "/visitas", icon: Calendar, label: "Visitas" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-sidebar-foreground">HealthCRM</h1>
                  <p className="text-xs text-sidebar-foreground/60">Centro de Salud</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && <Activity className="h-6 w-6 text-primary mx-auto" />}
          </div>

          {/* Toggle Button */}
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

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full ${
                      sidebarCollapsed ? "justify-center px-2" : "justify-start"
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={sidebarCollapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Theme Selector */}
          <div className="p-2 border-t border-sidebar-border space-y-2">
            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full ${
                    sidebarCollapsed ? "justify-center px-2" : "justify-start"
                  } text-sidebar-foreground hover:bg-sidebar-accent`}
                >
                  <ThemeIcon className={sidebarCollapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
                  {!sidebarCollapsed && <span>Tema</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("standard")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  Estándar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button
              variant="ghost"
              className={`w-full ${
                sidebarCollapsed ? "justify-center px-2" : "justify-start"
              } text-sidebar-foreground hover:bg-sidebar-accent`}
              onClick={() => navigate("/configuracion")}
            >
              <Settings className={sidebarCollapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
              {!sidebarCollapsed && <span>Configuración</span>}
            </Button>

            {/* User Profile */}
            {profile && (
              <div className={`p-2 rounded-lg bg-sidebar-accent ${sidebarCollapsed ? "flex justify-center" : ""}`}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.nombre[0]}{profile.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {profile.nombre} {profile.apellido}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                        {profile.rol}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              className={`w-full ${
                sidebarCollapsed ? "justify-center px-2" : "justify-start"
              } text-sidebar-foreground hover:bg-sidebar-accent`}
              onClick={handleLogout}
            >
              <LogOut className={sidebarCollapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
              {!sidebarCollapsed && <span>Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
