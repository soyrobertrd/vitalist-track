import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

/**
 * Devuelve el set de módulos que el usuario activo puede ver,
 * combinando su plan y su categoría profesional.
 * Admin/owner del workspace ve todos los módulos disponibles.
 */
export function useEffectiveModules() {
  const { currentWorkspace } = useWorkspace();
  const [allowed, setAllowed] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnerOrAdmin =
    currentWorkspace?.role === "owner" || currentWorkspace?.role === "admin";

  useEffect(() => {
    let cancel = false;
    (async () => {
      // Si el usuario es dueño o admin del workspace, tiene acceso completo a los módulos
      if (isOwnerOrAdmin) {
        if (!cancel) {
          setAllowed(null); // null significa sin restricción
          setLoading(false);
        }
        return;
      }

      if (!currentWorkspace?.id) {
        setAllowed(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const {
          data: { user },
        } = await db.auth.getUser();

        if (!user) {
          if (!cancel) {
            setAllowed(null);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await (db.rpc as any)("get_modulos_efectivos", {
          _user_id: user.id,
          _workspace_id: currentWorkspace.id,
        });

        if (!cancel) {
          if (error || !data || data.length === 0) {
            // Fail-open seguro: si no hay tabla de permisos o la RPC falla, permitir acceso
            setAllowed(null);
          } else {
            setAllowed(new Set((data || []).map((r: any) => r.modulo_key)));
          }
          setLoading(false);
        }
      } catch {
        if (!cancel) {
          setAllowed(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [currentWorkspace?.id, isOwnerOrAdmin]);

  const canAccess = (key?: string) => {
    if (!key) return true;
    if (isOwnerOrAdmin) return true;
    if (allowed === null) return true; // fail-open para evitar pantallas en blanco
    return allowed.has(key);
  };

  return { allowed: allowed || new Set(), canAccess, loading };
}
