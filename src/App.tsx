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
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import Personal from "./pages/Personal";
import Llamadas from "./pages/Llamadas";
import Visitas from "./pages/Visitas";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

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
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
