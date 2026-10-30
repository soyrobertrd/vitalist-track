import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

/**
 * Devuelve el set de módulos que el usuario activo puede ver,
 * combinando su plan y su categoría profesional.
 * Admin/owner del workspace ve todo lo que el plan permite.
 */
export function useEffectiveModules() {
  const { currentWorkspace } = useWorkspace();
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!currentWorkspace?.id) {
        setAllowed(new Set());
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        if (!cancel) {
          setAllowed(new Set());
          setLoading(false);
        }
        return;
      }
      const { data, error } = await (db.rpc as any)("get_modulos_efectivos", {
        _user_id: user.id,
        _workspace_id: currentWorkspace.id,
      });
      if (!cancel) {
        if (error) {
          // Fail-open mínimo: dashboard + soporte
          setAllowed(new Set(["dashboard", "soporte"]));
        } else {
          setAllowed(new Set((data || []).map((r: any) => r.modulo_key)));
        }
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [currentWorkspace?.id]);

  const canAccess = (key?: string) => !key || allowed.has(key);
  return { allowed, canAccess, loading };
}
