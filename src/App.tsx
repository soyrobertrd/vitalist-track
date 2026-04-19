import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import { InstallPWAPrompt } from "./components/InstallPWAPrompt";
import { NotificationsProvider } from "./components/NotificationsProvider";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ConfirmarCita from "./pages/ConfirmarCita";

// Lazy loaded pages for better performance & smaller initial bundle
const Pacientes = lazy(() => import("./pages/Pacientes"));
const Personal = lazy(() => import("./pages/Personal"));
const Llamadas = lazy(() => import("./pages/Llamadas"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const ConfiguracionAdmin = lazy(() => import("./pages/ConfiguracionAdmin"));
const PlantillasCorreo = lazy(() => import("./pages/PlantillasCorreo"));
const Automatizaciones = lazy(() => import("./pages/Automatizaciones"));
const Encuestas = lazy(() => import("./pages/Encuestas"));
const AtencionPaciente = lazy(() => import("./pages/AtencionPaciente"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Soporte = lazy(() => import("./pages/Soporte"));
const ReporteSospechosos = lazy(() => import("./pages/ReporteSospechosos"));
const DashboardGeografico = lazy(() => import("./pages/DashboardGeografico"));
const Visitas = lazy(() => import("./pages/Visitas"));
const Calendario = lazy(() => import("./pages/Calendario"));

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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {session && <NotificationsProvider />}
          {session && <InstallPWAPrompt />}
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/confirmar-cita" element={<ConfirmarCita />} />
                <Route
                  path="/"
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
                  path="/plantillas-correo"
                  element={session ? <Layout><PlantillasCorreo /></Layout> : <Navigate to="/auth" />}
                />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
