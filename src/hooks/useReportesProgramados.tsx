/**
 * Hook para gestionar reportes programados (esqueleto MVP).
 * Los envíos reales los procesará una edge function programada.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export type FrecuenciaReporte = "diario" | "semanal" | "mensual" | "trimestral";
export type FormatoReporte = "pdf" | "csv" | "xlsx";
export type TipoReporte =
  | "kpi_profesionales"
  | "comparativo_sucursales"
  | "visitas_resumen"
  | "llamadas_resumen"
  | "facturacion"
  | "pacientes_estado"
  | "auditoria_accesos";

export interface ReporteProgramado {
  id: string;
  workspace_id: string;
  nombre: string;
  tipo_reporte: TipoReporte;
  frecuencia: FrecuenciaReporte;
  destinatarios: string[];
  formato: FormatoReporte;
  filtros: Record<string, unknown>;
  hora_envio: string;
  dia_envio: number | null;
  activo: boolean;
  ultimo_envio: string | null;
  proximo_envio: string | null;
  created_at: string;
}

export function useReportesProgramados() {
  const { currentWorkspace } = useWorkspace();
  return useQuery({
    queryKey: ["reportes_programados", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async (): Promise<ReporteProgramado[]> => {
      const { data, error } = await (supabase as any)
        .from("reportes_programados")
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReporteProgramado[];
    },
  });
}

export function useCrearReporteProgramado() {
  const qc = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  return useMutation({
    mutationFn: async (payload: Partial<ReporteProgramado> & { nombre: string; tipo_reporte: TipoReporte }) => {
      if (!currentWorkspace?.id) throw new Error("Sin workspace activo");
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from("reportes_programados")
        .insert({
          workspace_id: currentWorkspace.id,
          created_by: userData.user?.id,
          ...payload,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ReporteProgramado;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportes_programados"] });
      toast.success("Reporte programado creado");
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al crear reporte"),
  });
}

export function useToggleReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await (supabase as any)
        .from("reportes_programados")
        .update({ activo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reportes_programados"] }),
    onError: (e: any) => toast.error(e?.message ?? "Error"),
  });
}

export function useEliminarReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("reportes_programados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reportes_programados"] });
      toast.success("Reporte eliminado");
    },
  });
}
