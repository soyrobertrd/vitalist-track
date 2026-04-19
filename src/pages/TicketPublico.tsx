import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, Clock, MapPin, Phone, Globe, Loader2, AlertCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export default function TicketPublico() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Token inválido");
        setLoading(false);
        return;
      }
      try {
        // Llamar edge function pública (no requiere auth)
        const { data: result, error: fnError } = await supabase.functions.invoke("ticket-publico", {
          body: { token },
        });
        if (fnError) throw fnError;
        if (!result?.ticket) {
          setError("Ticket no encontrado");
          return;
        }
        setData(result.ticket);
        setWorkspace(result.workspace);
      } catch (e: any) {
        console.error(e);
        setError("No se pudo cargar el ticket");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" /> Ticket no disponible
            </CardTitle>
            <CardDescription>{error || "El enlace no es válido o ha expirado."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const fechaCita = data.fecha_cita;
  const estadoCfg: Record<string, { label: string; cls: string }> = {
    pendiente: { label: "Pendiente", cls: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
    llegado: { label: "✓ Llegó", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
    atendido: { label: "✓✓ Atendido", cls: "bg-green-500/10 text-green-700 border-green-500/30" },
    no_show: { label: "No Show", cls: "bg-red-500/10 text-red-700 border-red-500/30" },
    cancelado: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
  };
  const est = estadoCfg[data.estado_checkin] || estadoCfg.pendiente;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 p-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        <Card className="border-2 border-dashed shadow-xl">
          <CardHeader className="text-center pb-2">
            {workspace?.logo_url && (
              <img src={workspace.logo_url} alt="Logo" className="h-14 mx-auto object-contain" />
            )}
            <CardTitle className="text-xl">{workspace?.nombre || "Su Cita"}</CardTitle>
            {workspace?.direccion && (
              <CardDescription className="flex items-center justify-center gap-1 text-xs">
                <MapPin className="h-3 w-3" /> {workspace.direccion}
              </CardDescription>
            )}
            {workspace?.telefono && (
              <CardDescription className="flex items-center justify-center gap-1 text-xs">
                <Phone className="h-3 w-3" /> {workspace.telefono}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Badge variant="outline" className={est.cls + " text-sm px-3 py-1"}>{est.label}</Badge>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={window.location.href} size={180} level="M" includeMargin />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Código de cita</p>
              <p className="font-mono text-3xl font-extrabold tracking-widest border-2 border-foreground rounded-lg py-2 px-4 inline-block">
                {data.codigo_corto}
              </p>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Paciente</h3>
              <p><span className="text-muted-foreground">Nombre:</span> <strong>{data.paciente_nombre}</strong></p>
              {data.paciente_cedula && (
                <p><span className="text-muted-foreground">Cédula:</span> <strong>{data.paciente_cedula}</strong></p>
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">Detalles de la cita</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-primary/5 p-2 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Fecha</p>
                  <p className="font-semibold text-sm">{format(new Date(fechaCita), "dd/MM/yyyy", { locale: es })}</p>
                </div>
                <div className="bg-primary/5 p-2 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Hora</p>
                  <p className="font-semibold text-sm">{format(new Date(fechaCita), "HH:mm")}</p>
                </div>
              </div>
              <p><span className="text-muted-foreground">Tipo:</span> <strong className="capitalize">{data.tipo_cita}</strong></p>
              {data.profesional_nombre && (
                <p><span className="text-muted-foreground">Profesional:</span> <strong>{data.profesional_nombre}</strong></p>
              )}
              {data.motivo && (
                <p><span className="text-muted-foreground">Motivo:</span> {data.motivo}</p>
              )}
            </div>

            {workspace?.instrucciones_cita && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground italic text-center">
                  {workspace.instrucciones_cita}
                </p>
              </>
            )}

            <Button onClick={() => window.print()} variant="outline" className="w-full">
              <Printer className="h-4 w-4 mr-2" /> Imprimir ticket
            </Button>
          </CardContent>
        </Card>

        {workspace?.sitio_web && (
          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Globe className="h-3 w-3" /> {workspace.sitio_web}
          </p>
        )}
      </div>
    </div>
  );
}
