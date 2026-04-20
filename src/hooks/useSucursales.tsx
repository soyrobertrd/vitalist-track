import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface Sucursal {
  id: string;
  workspace_id: string;
  nombre: string;
  codigo: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  zona: string | null;
  ciudad: string | null;
  pais: string | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  es_principal: boolean;
  configuracion: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useSucursales() {
  const { currentWorkspace } = useWorkspace();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSucursales = useCallback(async () => {
    if (!currentWorkspace) {
      setSucursales([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("sucursales" as any)
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("es_principal", { ascending: false })
      .order("nombre", { ascending: true });
    if (!error && data) setSucursales(data as unknown as Sucursal[]);
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    fetchSucursales();
  }, [fetchSucursales]);

  return { sucursales, loading, refetch: fetchSucursales };
}
