import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";

export type VerticalTipo = "clinica" | "dental" | "aesthetic" | "recovery" | "vision";

interface VerticalContextValue {
  verticalesActivas: VerticalTipo[];
  verticalActiva: VerticalTipo | "todas";
  setVerticalActiva: (v: VerticalTipo | "todas") => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const VerticalContext = createContext<VerticalContextValue | undefined>(undefined);

const STORAGE_KEY = "vertical_activa";

export function VerticalProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace();
  const { isAdmin } = useUserRole();
  const [verticalesActivas, setVerticalesActivas] = useState<VerticalTipo[]>([]);
  const [verticalAsignada, setVerticalAsignada] = useState<VerticalTipo | null>(null);
  const [verticalActiva, setVerticalActivaState] = useState<VerticalTipo | "todas">("todas");
  const [loading, setLoading] = useState(true);

  const setVerticalActiva = (v: VerticalTipo | "todas") => {
    setVerticalActivaState(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  };

  const cargar = async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [vw, vu] = await Promise.all([
      (supabase.from("workspace_verticales") as any)
        .select("vertical, activa")
        .eq("workspace_id", currentWorkspace.id)
        .eq("activa", true),
      user
        ? supabase.from("profiles").select("vertical_asignada").eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const lista = (vw.data || []).map((r: any) => r.vertical as VerticalTipo);
    if (lista.length === 0) lista.push("clinica");
    setVerticalesActivas(lista);

    const asignada = (vu.data as any)?.vertical_asignada as VerticalTipo | null;
    setVerticalAsignada(asignada || null);

    // Inicializar vertical activa
    const stored = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }})();
    if (isAdmin) {
      // Admin: por defecto "todas", pero respeta lo guardado si sigue siendo válido
      if (stored === "todas" || (stored && lista.includes(stored as VerticalTipo))) {
        setVerticalActivaState(stored as any);
      } else {
        setVerticalActivaState("todas");
      }
    } else {
      // No-admin: usa la asignada o la primera disponible. Sin "todas".
      const elegida = (asignada && lista.includes(asignada))
        ? asignada
        : lista[0];
      setVerticalActivaState(elegida);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [currentWorkspace?.id, isAdmin]);

  return (
    <VerticalContext.Provider value={{ verticalesActivas, verticalActiva, setVerticalActiva, loading, refresh: cargar }}>
      {children}
    </VerticalContext.Provider>
  );
}

export function useVertical() {
  const ctx = useContext(VerticalContext);
  if (!ctx) throw new Error("useVertical debe usarse dentro de VerticalProvider");
  return ctx;
}
