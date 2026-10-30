import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, XCircle, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useDiasLaborables } from "@/hooks/useDiasLaborables";

export default function ConfirmarCita() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const citaId = searchParams.get("cita");
  const tipo = (searchParams.get("tipo") as "llamada" | "visita") || "visita";
  const auto = searchParams.get("auto") === "1";
  
  const [loading, setLoading] = useState(true);
  const [cita, setCita] = useState<any>(null);
  const [paciente, setPaciente] = useState<any>(null);
  const [profesional, setProfesional] = useState<any>(null);
  const [accion, setAccion] = useState<"confirmar" | "reagendar" | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState<Date>();
  const [nuevaHora, setNuevaHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const { esDiaLaborable } = useDiasLaborables();

  useEffect(() => {
    if (token || citaId) {
      fetchCita();
    } else {
      toast.error("Enlace inválido o incompleto");
      setLoading(false);
    }
  }, [token, citaId, tipo]);

  // S11: si hay token se usa edge function, si hay citaId directo se usa db client
  const llamar = async (accion: "ver" | "confirmar" | "reagendar", extra: Record<string, string> = {}) => {
    if (token) {
      const { data, error } = await db.functions.invoke("confirmar-cita", {
        body: { token, tipo, accion, ...extra },
      });
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* sin cuerpo */ }
        throw new Error(msg || "No se pudo procesar la solicitud");
      }
      return data;
    }

    // Flujo directo por ID de cita
    const tabla = tipo === "llamada" ? "registro_llamadas" : "control_visitas";
    const fechaCol = tipo === "llamada" ? "fecha_agendada" : "fecha_hora_visita";

    if (accion === "ver") {
      const { data, error } = await db
        .from(tabla)
        .select(`id, ${fechaCol}, estado, ${tipo === "llamada" ? "motivo, " : ""}pacientes(nombre, apellido), personal_salud(nombre, apellido)`)
        .eq("id", citaId!)
        .maybeSingle();
      if (error || !data) throw new Error("Cita no encontrada");
      return { cita: data };
    }

    if (accion === "confirmar") {
      const updateData = tipo === "llamada"
        ? { estado: "agendada", notas_adicionales: "Confirmada por paciente vía WhatsApp (1 toque)" }
        : { estado: "confirmada", notas_visita: "Confirmada por paciente vía WhatsApp (1 toque)" };

      const { error } = await db.from(tabla).update(updateData as any).eq("id", citaId!);
      if (error) throw new Error("No se pudo confirmar la cita");
      return { ok: true };
    }

    if (accion === "reagendar") {
      const { fechaHora, motivo: mot } = extra;
      const nota = `Reagendada por paciente vía WhatsApp: ${String(mot || "").slice(0, 500)}`;
      const updateData = tipo === "llamada"
        ? { fecha_agendada: fechaHora, estado: "reagendada", notas_adicionales: nota }
        : { fecha_hora_visita: fechaHora, estado: "pendiente", notas_visita: nota };

      const { error } = await db.from(tabla).update(updateData as any).eq("id", citaId!);
      if (error) throw new Error("No se pudo reagendar la cita");
      return { ok: true };
    }
  };

  const fetchCita = async () => {
    try {
      const { cita } = await llamar("ver");
      setCita(cita);
      setPaciente(cita.pacientes);
      setProfesional(cita.personal_salud);
      if (auto) {
        await llamar("confirmar");
        setAccion("confirmar");
        toast.success("¡Cita confirmada con 1 toque!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await llamar("confirmar");
      toast.success("Cita confirmada exitosamente");
      setAccion("confirmar");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReagendar = async () => {
    if (!nuevaFecha || !nuevaHora) {
      toast.error("Debe seleccionar fecha y hora");
      return;
    }

    if (!esDiaLaborable(nuevaFecha)) {
      toast.error("Debe seleccionar un día laborable");
      return;
    }

    setLoading(true);
    try {
      const [h, m] = nuevaHora.split(":").map(Number);
      const fecha = new Date(nuevaFecha);
      fecha.setHours(h || 0, m || 0, 0, 0);
      await llamar("reagendar", { fechaHora: fecha.toISOString(), motivo });
      toast.success("Cita reagendada exitosamente");
      setAccion("reagendar");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!cita || !paciente) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Enlace Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              El enlace que has seguido no es válido o ha expirado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accion === "confirmar") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-6 w-6" />
              Cita Confirmada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tu {tipo === "llamada" ? "llamada" : "visita"} ha sido confirmada exitosamente. 
              Recibirás un recordatorio antes de la fecha programada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accion === "reagendar") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-6 w-6" />
              Cita Reagendada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tu solicitud de reagendamiento ha sido procesada. El equipo médico 
              confirmará la nueva fecha lo antes posible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fechaCita = tipo === "llamada" ? cita.fecha_agendada : cita.fecha_hora_visita;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Gestionar {tipo === "llamada" ? "Llamada" : "Visita"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Paciente</Label>
                <p className="font-medium">{paciente.nombre} {paciente.apellido}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Profesional</Label>
                <p className="font-medium">{profesional?.nombre} {profesional?.apellido}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha y Hora</Label>
                <p className="font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {fechaCita ? format(new Date(fechaCita), "dd/MM/yyyy HH:mm", { locale: es }) : "No asignada"}
                </p>
              </div>
              {tipo === "llamada" && cita.motivo && (
                <div>
                  <Label className="text-muted-foreground">Motivo</Label>
                  <p className="font-medium">{cita.motivo}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleConfirmar} className="flex-1" disabled={loading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Cita
              </Button>
              <Button 
                onClick={() => setAccion("reagendar")} 
                variant="outline" 
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Reagendar
              </Button>
            </div>
          </CardContent>
        </Card>

        {accion === "reagendar" && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Nuevo Horario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nueva Fecha</Label>
                <Calendar
                  mode="single"
                  selected={nuevaFecha}
                  onSelect={setNuevaFecha}
                  disabled={(date) => !esDiaLaborable(date)}
                  locale={es}
                  className="rounded-md border"
                />
              </div>

              <div>
                <Label>Nueva Hora</Label>
                <Input
                  type="time"
                  value={nuevaHora}
                  onChange={(e) => setNuevaHora(e.target.value)}
                />
              </div>

              <div>
                <Label>Motivo del Cambio</Label>
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Indique por qué necesita cambiar la fecha..."
                  rows={3}
                />
              </div>

              <Button onClick={handleReagendar} className="w-full" disabled={loading}>
                Enviar Solicitud
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
