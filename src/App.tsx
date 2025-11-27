import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import { NotificationsProvider } from "./components/NotificationsProvider";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import Personal from "./pages/Personal";
import Llamadas from "./pages/Llamadas";
import Visitas from "./pages/Visitas";
import Configuracion from "./pages/Configuracion";
import ConfiguracionAdmin from "./pages/ConfiguracionAdmin";
import PlantillasCorreo from "./pages/PlantillasCorreo";
import Automatizaciones from "./pages/Automatizaciones";
import Encuestas from "./pages/Encuestas";
import AtencionPaciente from "./pages/AtencionPaciente";
import Reportes from "./pages/Reportes";
import Soporte from "./pages/Soporte";
import NotFound from "./pages/NotFound";
import ConfirmarCita from "./pages/ConfirmarCita";
import ReporteSospechosos from "./pages/ReporteSospechosos";
import DashboardGeografico from "./pages/DashboardGeografico";

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
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
                path="/confirmar-cita"
                element={<ConfirmarCita />}
              />
              <Route
                path="/reporte-sospechosos"
                element={session ? <Layout><ReporteSospechosos /></Layout> : <Navigate to="/auth" />}
              />
              <Route
                path="/dashboard-geografico"
                element={session ? <Layout><DashboardGeografico /></Layout> : <Navigate to="/auth" />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
