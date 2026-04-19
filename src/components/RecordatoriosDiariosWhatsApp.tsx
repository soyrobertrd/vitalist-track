import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { toast } from "sonner";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { enviarWhatsAppConPlantilla } from "@/lib/whatsappService";
import { ChevronRight } from "lucide-react";

interface Item {
  id: string;
  tipo: "visita" | "llamada";
  fecha: string;
  paciente: { id: string; nombre: string; apellido: string; numero_principal: string | null; contacto_px: string | null; contacto_cuidador: string | null } | null;
  profesional: { id: string; nombre: string; apellido: string } | null;
  tipo_visita?: string;
}

/**
 * Tarjeta del Dashboard que carga las citas del día siguiente
 * y permite enviar el recordatorio WhatsApp uno a uno (wa.me no permite masivo automatizado).
 */
export const RecordatoriosDiariosWhatsApp = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  const cargar = async () => {
    setLoading(true);
    const manana = addDays(new Date(), 1);
    const desde = startOfDay(manana).toISOString();
    const hasta = endOfDay(manana).toISOString();

    const [visitasRes, llamadasRes] = await Promise.all([
      supabase
        .from("control_visitas")
        .select(
          "id, fecha_hora_visita, tipo_visita, pacientes(id, nombre, apellido, numero_principal, contacto_px, contacto_cuidador), personal_salud(id, nombre, apellido)"
        )
        .gte("fecha_hora_visita", desde)
        .lte("fecha_hora_visita", hasta)
        .eq("estado", "pendiente"),
      supabase
        .from("registro_llamadas")
        .select(
          "id, fecha_agendada, pacientes(id, nombre, apellido, numero_principal, contacto_px, contacto_cuidador), personal_salud(id, nombre, apellido)"
        )
        .gte("fecha_agendada", desde)
        .lte("fecha_agendada", hasta)
        .eq("estado", "agendada"),
    ]);

    const visitas: Item[] = (visitasRes.data ?? []).map((v: any) => ({
      id: v.id,
      tipo: "visita",
      fecha: v.fecha_hora_visita,
      paciente: v.pacientes,
      profesional: v.personal_salud,
      tipo_visita: v.tipo_visita,
    }));
    const llamadas: Item[] = (llamadasRes.data ?? []).map((l: any) => ({
      id: l.id,
      tipo: "llamada",
      fecha: l.fecha_agendada,
      paciente: l.pacientes,
      profesional: l.personal_salud,
    }));

    setItems(
      [...visitas, ...llamadas].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      )
    );
    setLoading(false);
  };

  const enviarUno = async (item: Item) => {
    if (!item.paciente) return;
    const tel =
      item.paciente.numero_principal ||
      item.paciente.contacto_px ||
      item.paciente.contacto_cuidador ||
      "";
    if (!tel) {
      toast.error("Paciente sin teléfono");
      return;
    }
    const fecha = format(new Date(item.fecha), "dd/MM/yyyy", { locale: es });
    const hora = format(new Date(item.fecha), "h:mm a", { locale: es });
    const res = await enviarWhatsAppConPlantilla({
      categoria: "recordatorio_cita",
      telefono: tel,
      pacienteId: item.paciente.id,
      profesionalId: item.profesional?.id,
      citaId: item.id,
      tipoCita: item.tipo,
      destinatario: "paciente",
      variables: {
        paciente_nombre: item.paciente.nombre,
        paciente_apellido: item.paciente.apellido,
        profesional_nombre: item.profesional
          ? `${item.profesional.nombre} ${item.profesional.apellido}`
          : "su profesional",
        tipo_visita:
          item.tipo === "visita"
            ? item.tipo_visita === "domicilio"
              ? "domiciliaria"
              : "ambulatoria"
            : "telefónica",
        fecha,
        hora,
      },
    });
    if (res.ok) {
      setEnviados((prev) => new Set(prev).add(item.id));
    } else {
      toast.error(res.error ?? "Error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faWhatsapp} className="text-[#25D366]" />
              Recordatorios WhatsApp · mañana
            </CardTitle>
            <CardDescription>
              Envía el recordatorio uno por uno. WhatsApp se abrirá en una pestaña nueva.
            </CardDescription>
          </div>
          <Button onClick={cargar} disabled={loading} variant="outline">
            {loading ? "Cargando…" : items.length === 0 ? "Cargar citas" : "Recargar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando…" : "Pulse 'Cargar citas' para ver las citas de mañana."}
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={item.tipo === "visita" ? "default" : "secondary"}>
                      {item.tipo === "visita" ? "Visita" : "Llamada"}
                    </Badge>
                    <span className="font-medium truncate">
                      {item.paciente?.nombre} {item.paciente?.apellido}
                    </span>
                    {enviados.has(item.id) && (
                      <Badge variant="outline" className="text-green-700 border-green-500/50">
                        ✓ Enviado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(item.fecha), "h:mm a", { locale: es })} ·{" "}
                    {item.profesional
                      ? `${item.profesional.nombre} ${item.profesional.apellido}`
                      : "—"}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white shrink-0"
                  onClick={() => enviarUno(item)}
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="mr-2 h-4 w-4" />
                  Enviar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
