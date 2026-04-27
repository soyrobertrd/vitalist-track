/**
 * Hook para gestionar inventario adaptativo: items, lotes y movimientos.
 * Filtra por workspace activo automáticamente.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export type InventarioCategoria =
  | "muestra_medica"
  | "insumo"
  | "material"
  | "medicamento"
  | "equipo"
  | "otro";

export type MovimientoTipo = "entrada" | "salida" | "ajuste" | "merma" | "devolucion";

export interface InventarioItem {
  id: string;
  workspace_id: string;
  sucursal_id: string | null;
  categoria: InventarioCategoria;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  requiere_lotes: boolean;
  activo: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InventarioLote {
  id: string;
  item_id: string;
  numero_lote: string;
  fecha_vencimiento: string | null;
  cantidad_disponible: number;
  proveedor: string | null;
  notas: string | null;
}

export function useInventarioItems(filters?: { categoria?: InventarioCategoria; sucursalId?: string | null }) {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ["inventario_items", currentWorkspace?.id, filters],
    enabled: !!currentWorkspace?.id,
    queryFn: async (): Promise<InventarioItem[]> => {
      let q = (supabase as any)
        .from("inventario_items")
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (filters?.categoria) q = q.eq("categoria", filters.categoria);
      if (filters?.sucursalId) q = q.eq("sucursal_id", filters.sucursalId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InventarioItem[];
    },
  });
}

export function useItemsBajoStock() {
  const { data: items, ...rest } = useInventarioItems();
  const bajoStock = (items ?? []).filter((i) => i.stock_actual <= i.stock_minimo && i.stock_minimo > 0);
  return { ...rest, data: bajoStock, items };
}

export function useLotesItem(itemId: string | null) {
  return useQuery({
    queryKey: ["inventario_lotes", itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<InventarioLote[]> => {
      const { data, error } = await (supabase as any)
        .from("inventario_lotes")
        .select("*")
        .eq("item_id", itemId)
        .order("fecha_vencimiento", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as InventarioLote[];
    },
  });
}

export function useLotesProximosVencer(diasAviso = 60) {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ["inventario_vencimientos", currentWorkspace?.id, diasAviso],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const limite = new Date();
      limite.setDate(limite.getDate() + diasAviso);
      const { data, error } = await (supabase as any)
        .from("inventario_lotes")
        .select("*, inventario_items!inner(nombre,workspace_id,sucursal_id,categoria)")
        .lte("fecha_vencimiento", limite.toISOString().slice(0, 10))
        .gt("cantidad_disponible", 0)
        .eq("inventario_items.workspace_id", currentWorkspace!.id)
        .order("fecha_vencimiento", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearItem() {
  const qc = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: Partial<InventarioItem> & { nombre: string; categoria: InventarioCategoria }) => {
      if (!currentWorkspace?.id) throw new Error("Sin workspace activo");
      const { data, error } = await (supabase as any)
        .from("inventario_items")
        .insert({
          workspace_id: currentWorkspace.id,
          ...payload,
        })
        .select()
        .single();
      if (error) throw error;
      return data as InventarioItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventario_items"] });
      toast.success("Item de inventario creado");
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al crear item"),
  });
}

export function useRegistrarMovimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      item_id: string;
      lote_id?: string | null;
      tipo: MovimientoTipo;
      cantidad: number;
      paciente_id?: string | null;
      visita_id?: string | null;
      motivo?: string;
      notas?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("inventario_movimientos")
        .insert({
          ...payload,
          realizado_por: userData.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventario_items"] });
      qc.invalidateQueries({ queryKey: ["inventario_lotes"] });
      qc.invalidateQueries({ queryKey: ["inventario_vencimientos"] });
      toast.success("Movimiento registrado");
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al registrar movimiento"),
  });
}
