import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ActiveSucursalProvider } from "./contexts/ActiveSucursalContext";
import { LocaleProvider } from "./hooks/useLocale";
import Layout from "./components/Layout";
import { InstallPWAPrompt } from "./components/InstallPWAPrompt";
import { NotificationsProvider } from "./components/NotificationsProvider";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ConfirmarCita from "./pages/ConfirmarCita";
import TicketPublico from "./pages/TicketPublico";
import Landing from "./pages/Landing";

// Lazy loaded pages for better performance & smaller initial bundle
const Recepcion = lazy(() => import("./pages/Recepcion"));
const Finanzas = lazy(() => import("./pages/Finanzas"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Pacientes = lazy(() => import("./pages/Pacientes"));
const Personal = lazy(() => import("./pages/Personal"));
const Llamadas = lazy(() => import("./pages/Llamadas"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const ConfiguracionAdmin = lazy(() => import("./pages/ConfiguracionAdmin"));
const Plantillas = lazy(() => import("./pages/Plantillas"));
const Automatizaciones = lazy(() => import("./pages/Automatizaciones"));
const Encuestas = lazy(() => import("./pages/Encuestas"));
const AtencionPaciente = lazy(() => import("./pages/AtencionPaciente"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Soporte = lazy(() => import("./pages/Soporte"));
const ReporteSospechosos = lazy(() => import("./pages/ReporteSospechosos"));
const DashboardGeografico = lazy(() => import("./pages/DashboardGeografico"));
const Visitas = lazy(() => import("./pages/Visitas"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Planes = lazy(() => import("./pages/Planes"));
const RutasOptimizadas = lazy(() => import("./pages/RutasOptimizadas"));
const Organizaciones = lazy(() => import("./pages/Organizaciones"));
const AceptarInvitacion = lazy(() => import("./pages/AceptarInvitacion"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
const Inventario = lazy(() => import("./pages/Inventario"));
const AuditoriaHIPAA = lazy(() => import("./pages/AuditoriaHIPAA"));
const ReportesProgramados = lazy(() => import("./pages/ReportesProgramados"));
const SalaVirtual = lazy(() => import("./pages/SalaVirtual"));
const Consultorios = lazy(() => import("./pages/Consultorios"));
const Hospitalizacion = lazy(() => import("./pages/Hospitalizacion"));
const Triaje = lazy(() => import("./pages/Triaje"));
const ApiPublicaCitas = lazy(() => import("./pages/ApiPublicaCitas"));
const PortalPublicoDisponibilidad = lazy(() => import("./pages/PortalPublicoDisponibilidad"));
const AfiliacionesProfesional = lazy(() => import("./pages/AfiliacionesProfesional"));
const UciManagement = lazy(() => import("./pages/UciManagement"));
const ChecklistRLS = lazy(() => import("./pages/ChecklistRLS"));
const ConfiguracionAuditoria = lazy(() => import("./pages/ConfiguracionAuditoria"));
const DashboardBI = lazy(() => import("./pages/DashboardBI"));
const PortalPaciente = lazy(() => import("./pages/PortalPaciente"));
const Quirofano = lazy(() => import("./pages/Quirofano"));
const Laboratorio = lazy(() => import("./pages/Laboratorio"));
const Imagenologia = lazy(() => import("./pages/Imagenologia"));
const Compras = lazy(() => import("./pages/Compras"));
const Contabilidad = lazy(() => import("./pages/Contabilidad"));
const Nomina = lazy(() => import("./pages/Nomina"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WorkspaceProvider>
        <ActiveSucursalProvider>
        <LocaleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {session && <NotificationsProvider />}
          {session && <InstallPWAPrompt />}
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/confirmar-cita" element={<ConfirmarCita />} />
                <Route path="/ticket/:token" element={<TicketPublico />} />
                <Route path="/sala/:token" element={<SalaVirtual />} />
                <Route path="/portal-citas" element={<PortalPublicoDisponibilidad />} />
                <Route
                  path="/recepcion"
                  element={session ? <Layout><Recepcion /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/finanzas"
                  element={session ? <Layout><Finanzas /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/onboarding"
                  element={session ? <Onboarding /> : <Navigate to="/auth" />}
                />
                <Route
                  path="/dashboard"
                  element={session ? <Layout><Dashboard /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/pacientes"
                  element={session ? <Layout><Pacientes /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/personal"
                  element={session ? <Layout><Personal /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/llamadas"
                  element={session ? <Layout><Llamadas /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/visitas"
                  element={session ? <Layout><Visitas /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/calendario"
                  element={session ? <Layout><Calendario /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/configuracion"
                  element={session ? <Layout><Configuracion /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/configuracion-admin"
                  element={session ? <Layout><ConfiguracionAdmin /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/plantillas"
                  element={session ? <Layout><Plantillas /></Layout> : <Navigate to="/auth" />}
                />
                {/* Redirects desde rutas antiguas */}
                <Route path="/plantillas-correo" element={<Navigate to="/plantillas" replace />} />
                <Route path="/plantillas-whatsapp" element={<Navigate to="/plantillas" replace />} />
                <Route
                  path="/automatizaciones"
                  element={session ? <Layout><Automatizaciones /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/encuestas"
                  element={session ? <Layout><Encuestas /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/atencion-paciente"
                  element={session ? <Layout><AtencionPaciente /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/reportes"
                  element={session ? <Layout><Reportes /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/soporte"
                  element={session ? <Layout><Soporte /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/sospechosos"
                  element={session ? <Layout><ReporteSospechosos /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/dashboard-geografico"
                  element={session ? <Layout><DashboardGeografico /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/planes"
                  element={session ? <Layout><Planes /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/rutas"
                  element={session ? <Layout><RutasOptimizadas /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/organizaciones"
                  element={session ? <Layout><Organizaciones /></Layout> : <Navigate to="/auth" />}
                />
                <Route path="/aceptar-invitacion" element={<AceptarInvitacion />} />
                <Route
                  path="/onboarding-wizard"
                  element={session ? <OnboardingWizard /> : <Navigate to="/auth" />}
                />
                <Route
                  path="/inventario"
                  element={session ? <Layout><Inventario /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/auditoria"
                  element={session ? <Layout><AuditoriaHIPAA /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/reportes-programados"
                  element={session ? <Layout><ReportesProgramados /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/consultorios"
                  element={session ? <Layout><Consultorios /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/hospitalizacion"
                  element={session ? <Layout><Hospitalizacion /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/triaje"
                  element={session ? <Layout><Triaje /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/api-citas"
                  element={session ? <Layout><ApiPublicaCitas /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/afiliaciones"
                  element={session ? <Layout><AfiliacionesProfesional /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/uci"
                  element={session ? <Layout><UciManagement /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/checklist-rls"
                  element={session ? <Layout><ChecklistRLS /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/auditoria/configuracion"
                  element={session ? <Layout><ConfiguracionAuditoria /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/dashboard-bi"
                  element={session ? <Layout><DashboardBI /></Layout> : <Navigate to="/auth" />}
                />
                <Route path="/portal-paciente" element={<PortalPaciente />} />
                <Route
                  path="/quirofano"
                  element={session ? <Layout><Quirofano /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/laboratorio"
                  element={session ? <Layout><Laboratorio /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/imagenologia"
                  element={session ? <Layout><Imagenologia /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/compras"
                  element={session ? <Layout><Compras /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/contabilidad"
                  element={session ? <Layout><Contabilidad /></Layout> : <Navigate to="/auth" />}
                />
                <Route
                  path="/nomina"
                  element={session ? <Layout><Nomina /></Layout> : <Navigate to="/auth" />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
        </LocaleProvider>
        </ActiveSucursalProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
