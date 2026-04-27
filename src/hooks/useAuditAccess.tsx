/**
 * Hook para registrar accesos a fichas clínicas (auditoría HIPAA-like).
 * Llama al RPC registrar_acceso_ficha sin bloquear la UI.
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AccionAuditoria = "view" | "export" | "print" | "download" | "edit";

interface UseAuditAccessOptions {
  pacienteId?: string | null;
  recurso: string; // p.ej. "ficha_clinica", "evolucion_soap", "documento_clinico"
  accion?: AccionAuditoria;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}

export async function registrarAcceso(opts: {
  pacienteId: string;
  recurso: string;
  accion?: AccionAuditoria;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.rpc("registrar_acceso_ficha", {
      _paciente_id: opts.pacienteId,
      _recurso: opts.recurso,
      _accion: opts.accion ?? "view",
      _metadata: (opts.metadata ?? {}) as never,
    });
  } catch (err) {
    // No bloquear UI por fallo de auditoría
    console.warn("[audit] registrar_acceso_ficha failed", err);
  }
}

/**
 * Registra un acceso una vez al montar / cuando cambia el paciente.
 */
export function useAuditAccess({
  pacienteId,
  recurso,
  accion = "view",
  metadata,
  enabled = true,
}: UseAuditAccessOptions) {
  useEffect(() => {
    if (!enabled || !pacienteId) return;
    registrarAcceso({ pacienteId, recurso, accion, metadata });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId, recurso, accion, enabled]);
}
