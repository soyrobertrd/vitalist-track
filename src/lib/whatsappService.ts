import { supabase } from "@/integrations/supabase/client";

export type WhatsAppCategoria =
  | "recordatorio_cita"
  | "confirmacion_cita"
  | "cobro_pendiente"
  | "visita_en_camino"
  | "custom";

export interface PlantillaWhatsApp {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: WhatsAppCategoria;
  contenido: string;
  destinatario_default: "paciente" | "cuidador" | "ambos";
  variables: string[];
  activo: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Reemplaza variables {{nombre}} en el contenido por valores reales.
 */
export function renderPlantilla(
  contenido: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return contenido.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
  });
}

/**
 * Limpia un teléfono y le antepone el código país DR (1) para wa.me.
 * Acepta "829-123-1234", "8291231234", "+18291231234", etc.
 */
export function toWaMeNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  if (digits.length >= 10) return digits;
  return null;
}

/**
 * Construye un enlace wa.me listo para abrir.
 */
export function buildWaMeLink(phone: string, mensaje: string): string | null {
  const num = toWaMeNumber(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Abre WhatsApp en una nueva pestaña con el mensaje pre-llenado y registra el envío.
 */
export async function abrirWhatsApp(params: {
  telefono: string;
  mensaje: string;
  pacienteId?: string | null;
  profesionalId?: string | null;
  citaId?: string | null;
  tipoCita?: "visita" | "llamada" | "factura";
  tipoRecordatorio?: WhatsAppCategoria;
  plantillaId?: string | null;
  destinatario?: "paciente" | "cuidador";
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  const url = buildWaMeLink(params.telefono, params.mensaje);
  if (!url) return { ok: false, error: "Número de teléfono inválido" };

  // Registrar envío en historial_recordatorios (best effort, no bloquea)
  if (params.citaId && params.tipoCita) {
    try {
      await supabase.from("historial_recordatorios").insert({
        cita_id: params.citaId,
        tipo_cita: params.tipoCita,
        paciente_id: params.pacienteId ?? null,
        profesional_id: params.profesionalId ?? null,
        canal: "whatsapp",
        estado: "enviado",
        tipo_recordatorio: params.tipoRecordatorio ?? "custom",
        destinatarios: [
          {
            tipo: params.destinatario ?? "paciente",
            telefono: params.telefono,
          },
        ],
      });
    } catch {
      // ignore — link ya se abrirá igual
    }
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true, url };
}

/**
 * Carga la primera plantilla activa de una categoría.
 */
export async function getPlantillaPorCategoria(
  categoria: WhatsAppCategoria
): Promise<PlantillaWhatsApp | null> {
  const { data } = await supabase
    .from("plantillas_whatsapp")
    .select("*")
    .eq("categoria", categoria)
    .eq("activo", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as PlantillaWhatsApp) ?? null;
}

/**
 * Helper integrado: carga plantilla, renderiza y abre WhatsApp.
 */
export async function enviarWhatsAppConPlantilla(params: {
  categoria: WhatsAppCategoria;
  telefono: string;
  variables: Record<string, string | number | null | undefined>;
  pacienteId?: string | null;
  profesionalId?: string | null;
  citaId?: string | null;
  tipoCita?: "visita" | "llamada" | "factura";
  destinatario?: "paciente" | "cuidador";
}): Promise<{ ok: boolean; error?: string }> {
  const plantilla = await getPlantillaPorCategoria(params.categoria);
  if (!plantilla) {
    return { ok: false, error: `No hay plantilla activa para ${params.categoria}` };
  }
  const mensaje = renderPlantilla(plantilla.contenido, params.variables);
  return abrirWhatsApp({
    telefono: params.telefono,
    mensaje,
    pacienteId: params.pacienteId,
    profesionalId: params.profesionalId,
    citaId: params.citaId,
    tipoCita: params.tipoCita,
    tipoRecordatorio: params.categoria,
    plantillaId: plantilla.id,
    destinatario: params.destinatario,
  });
}
