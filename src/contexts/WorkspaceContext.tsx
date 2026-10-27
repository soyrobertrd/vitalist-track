import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE, DEMO_WORKSPACES, DEMO_PLANES } from "@/lib/mock-live-seed";

export interface Workspace {
  id: string;
  nombre: string;
  slug: string;
  owner_id: string;
  plan_codigo: string;
  estado: string;
  configuracion: Record<string, any>;
  trial_ends_at: string | null;
}

export interface Plan {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_mensual_usd: number;
  precio_mensual_dop: number;
  limite_pacientes: number | null;
  limite_usuarios: number | null;
  limite_profesionales: number | null;
  limite_dispositivos?: number | null;
  caracteristicas: Record<string, any>;
  orden: number;
}

export type WorkspaceRole = "owner" | "admin" | "member";

interface WorkspaceContextValue {
  workspaces: Array<Workspace & { role: WorkspaceRole }>;
  currentWorkspace: (Workspace & { role: WorkspaceRole }) | null;
  currentPlan: Plan | null;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  hasFeature: (feature: string) => boolean;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = "currentWorkspaceId";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Array<Workspace & { role: WorkspaceRole }>>(DEMO_MODE ? (DEMO_WORKSPACES as any) : []);
  const [currentWorkspace, setCurrentWorkspace] = useState<(Workspace & { role: WorkspaceRole }) | null>(DEMO_MODE ? (DEMO_WORKSPACES[0] as any) : null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(DEMO_MODE ? DEMO_PLANES.find(p => p.codigo === DEMO_WORKSPACES[0].plan_codigo) || null : null);
  const [loading, setLoading] = useState(!DEMO_MODE);

  const loadWorkspaces = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // En modo preview o sin sesión activa de Supabase, proveer los 6 centros de prueba con sus 4 planes
        if (DEMO_MODE) {
          setWorkspaces(DEMO_WORKSPACES as any);
          const savedId = localStorage.getItem(STORAGE_KEY);
          const selected = (DEMO_WORKSPACES as any[]).find((w) => w.id === savedId) || DEMO_WORKSPACES[0];
          setCurrentWorkspace(selected);
          setCurrentPlan(DEMO_PLANES.find((p) => p.codigo === selected.plan_codigo) || DEMO_PLANES[0]);
        } else {
          setWorkspaces([]);
          setCurrentWorkspace(null);
          setCurrentPlan(null);
        }
        return;
      }

      // Get memberships
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) {
        // Si no tiene aún workspaces en Supabase, proveer los 6 centros demo para pruebas completas
        if (DEMO_MODE) {
          setWorkspaces(DEMO_WORKSPACES as any);
          const savedId = localStorage.getItem(STORAGE_KEY);
          const selected = (DEMO_WORKSPACES as any[]).find((w) => w.id === savedId) || DEMO_WORKSPACES[0];
          setCurrentWorkspace(selected);
          setCurrentPlan(DEMO_PLANES.find((p) => p.codigo === selected.plan_codigo) || DEMO_PLANES[0]);
        } else {
          setWorkspaces([]);
          setCurrentWorkspace(null);
          setCurrentPlan(null);
        }
        return;
      }

      const ids = memberships.map((m) => m.workspace_id);
      const { data: ws } = await supabase
        .from("workspaces")
        .select("*")
        .in("id", ids);

      let merged = (ws || []).map((w) => {
        const role = (memberships.find((m) => m.workspace_id === w.id)?.role || "member") as WorkspaceRole;
        return { ...(w as Workspace), role };
      });

      // Asegurar que los centros demo estén disponibles para pruebas multi-vertical
      if (DEMO_MODE) for (const demoWs of DEMO_WORKSPACES) {
        if (!merged.some(m => m.id === demoWs.id)) {
          merged.push(demoWs as any);
        }
      }

      setWorkspaces(merged);

      // Pick saved workspace or first
      const savedId = localStorage.getItem(STORAGE_KEY);
      const selected = merged.find((w) => w.id === savedId) || merged[0] || null;
      setCurrentWorkspace(selected);

      if (selected) {
        const demoPlan = DEMO_MODE && DEMO_PLANES.find(p => p.codigo === selected.plan_codigo);
        if (demoPlan) {
          setCurrentPlan(demoPlan);
        } else {
          const { data: plan } = await supabase
            .from("planes")
            .select("*")
            .eq("codigo", selected.plan_codigo)
            .maybeSingle();
          setCurrentPlan((plan as Plan) || null);
        }
      }
    } catch (e) {
      console.error("Error loading workspaces:", e);
      if (DEMO_MODE) {
      setWorkspaces(DEMO_WORKSPACES as any);
      const savedId = localStorage.getItem(STORAGE_KEY);
      const selected = (DEMO_WORKSPACES as any[]).find((w) => w.id === savedId) || DEMO_WORKSPACES[0];
      setCurrentWorkspace(selected);
      const plan = DEMO_PLANES.find((p) => p.codigo === selected.plan_codigo) || DEMO_PLANES[0];
      setCurrentPlan(plan);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadWorkspaces();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadWorkspaces]);

  const switchWorkspace = useCallback((workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;
    localStorage.setItem(STORAGE_KEY, workspaceId);
    setCurrentWorkspace(ws);

    // Si tiene vertical en su configuración, actualizarla en el documento
    if (ws.configuracion?.vertical) {
      document.documentElement.dataset.vertical = ws.configuracion.vertical;
      try { localStorage.setItem("vertical_activa", ws.configuracion.vertical); } catch {}
    }

    const demoPlan = DEMO_MODE && DEMO_PLANES.find((p) => p.codigo === ws.plan_codigo);
    if (demoPlan) {
      setCurrentPlan(demoPlan);
      return;
    }

    supabase.from("planes").select("*").eq("codigo", ws.plan_codigo).maybeSingle()
      .then(({ data }) => setCurrentPlan(data as Plan | null));
  }, [workspaces]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!currentPlan) return false;
    return Boolean(currentPlan.caracteristicas?.[feature]);
  }, [currentPlan]);

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, currentWorkspace, currentPlan, loading, switchWorkspace, hasFeature, refresh: loadWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
