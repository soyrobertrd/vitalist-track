import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { useSucursales } from "@/hooks/useSucursales";

interface ActiveSucursalContextValue {
  /** null = "Todas las sucursales" */
  activeSucursalId: string | null;
  setActiveSucursalId: (id: string | null) => void;
  /** True if the current workspace has at least one branch */
  hasSucursales: boolean;
}

const ActiveSucursalContext = createContext<ActiveSucursalContextValue | undefined>(undefined);

const storageKey = (wsId: string) => `activeSucursalId:${wsId}`;

export function ActiveSucursalProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace();
  const { sucursales } = useSucursales();
  const [activeSucursalId, setActiveSucursalIdState] = useState<string | null>(null);

  // Reset / hydrate when workspace changes
  useEffect(() => {
    if (!currentWorkspace) {
      setActiveSucursalIdState(null);
      return;
    }
    const saved = localStorage.getItem(storageKey(currentWorkspace.id));
    setActiveSucursalIdState(saved && saved !== "null" ? saved : null);
  }, [currentWorkspace?.id]);

  // If saved sucursal no longer exists in this workspace, clear it
  useEffect(() => {
    if (!activeSucursalId || sucursales.length === 0) return;
    if (!sucursales.find((s) => s.id === activeSucursalId)) {
      setActiveSucursalIdState(null);
      if (currentWorkspace) localStorage.removeItem(storageKey(currentWorkspace.id));
    }
  }, [sucursales, activeSucursalId, currentWorkspace]);

  const setActiveSucursalId = useCallback(
    (id: string | null) => {
      setActiveSucursalIdState(id);
      if (currentWorkspace) {
        if (id) localStorage.setItem(storageKey(currentWorkspace.id), id);
        else localStorage.removeItem(storageKey(currentWorkspace.id));
      }
    },
    [currentWorkspace]
  );

  return (
    <ActiveSucursalContext.Provider
      value={{
        activeSucursalId,
        setActiveSucursalId,
        hasSucursales: sucursales.length > 0,
      }}
    >
      {children}
    </ActiveSucursalContext.Provider>
  );
}

export function useActiveSucursal() {
  const ctx = useContext(ActiveSucursalContext);
  if (!ctx) throw new Error("useActiveSucursal must be used within ActiveSucursalProvider");
  return ctx;
}
