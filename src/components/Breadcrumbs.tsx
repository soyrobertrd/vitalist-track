import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const routeNames: Record<string, string> = {
  "": "Inicio",
  "dashboard": "Dashboard",
  "pacientes": "Pacientes",
  "personal": "Personal",
  "visitas": "Visitas",
  "llamadas": "Llamadas",
  "reportes": "Reportes",
  "calendario": "Calendario",
  "encuestas": "Encuestas",
  "automatizaciones": "Automatizaciones",
  "configuracion": "Configuración",
  "configuracion-admin": "Configuración Admin",
  "soporte": "Soporte",
  "atencion-paciente": "Atención Paciente",
  "dashboard-geografico": "Mapa Geográfico",
  "plantillas-correo": "Plantillas de Correo",
  "reporte-sospechosos": "Reporte Sospechosos",
};

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      <Link
        to="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link
                to={path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
