import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [workspaces, setWorkspaces] = useState<Array<Workspace & { role: WorkspaceRole }>>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<(Workspace & { role: WorkspaceRole }) | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setLoading(false);
        return;
      }

      // Get memberships
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setLoading(false);
        return;
      }

      const ids = memberships.map((m) => m.workspace_id);
      const { data: ws } = await supabase
        .from("workspaces")
        .select("*")
        .in("id", ids);

      const merged = (ws || []).map((w) => {
        const role = (memberships.find((m) => m.workspace_id === w.id)?.role || "member") as WorkspaceRole;
        return { ...(w as Workspace), role };
      });

      setWorkspaces(merged);

      // Pick saved workspace or first
      const savedId = localStorage.getItem(STORAGE_KEY);
      const selected = merged.find((w) => w.id === savedId) || merged[0] || null;
      setCurrentWorkspace(selected);

      if (selected) {
        const { data: plan } = await supabase
          .from("planes")
          .select("*")
          .eq("codigo", selected.plan_codigo)
          .maybeSingle();
        setCurrentPlan(plan as Plan | null);
      }
    } catch (e) {
      console.error("Error loading workspaces:", e);
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
