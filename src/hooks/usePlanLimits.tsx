import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface PlanLimits {
  pacientes: { used: number; max: number | null; reached: boolean; pctUsed: number };
  usuarios: { used: number; max: number | null; reached: boolean; pctUsed: number };
  profesionales: { used: number; max: number | null; reached: boolean; pctUsed: number };
}

const empty: PlanLimits = {
  pacientes: { used: 0, max: null, reached: false, pctUsed: 0 },
  usuarios: { used: 0, max: null, reached: false, pctUsed: 0 },
  profesionales: { used: 0, max: null, reached: false, pctUsed: 0 },
};

export function usePlanLimits() {
  const { currentWorkspace, currentPlan } = useWorkspace();
  const [limits, setLimits] = useState<PlanLimits>(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentWorkspace) {
      setLimits(empty);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [pac, usr, prof] = await Promise.all([
      supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("workspace_id", currentWorkspace.id),
      supabase.from("workspace_members").select("id", { count: "exact", head: true }).eq("workspace_id", currentWorkspace.id),
      supabase.from("personal_salud").select("id", { count: "exact", head: true }).eq("workspace_id", currentWorkspace.id).eq("activo", true),
    ]);

    const build = (used: number, max: number | null) => {
      const reached = max !== null && used >= max;
      const pctUsed = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
      return { used, max, reached, pctUsed };
    };

    setLimits({
      pacientes: build(pac.count || 0, currentPlan?.limite_pacientes ?? null),
      usuarios: build(usr.count || 0, currentPlan?.limite_usuarios ?? null),
      profesionales: build(prof.count || 0, currentPlan?.limite_profesionales ?? null),
    });
    setLoading(false);
  }, [currentWorkspace, currentPlan]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { limits, loading, refresh };
}
