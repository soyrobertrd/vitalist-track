import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Send, Mail, MapPin, Phone, Globe, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useCitaTickets, type CitaTicket } from "@/hooks/useCitaTickets";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";

interface CitaTicketDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tipo: "visita" | "llamada";
  citaId: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteCedula?: string;
  pacienteTelefono?: string | null;
  whatsappEnabled?: boolean;
  emailPaciente?: string | null;
  fechaCita: string;
  profesionalNombre?: string;
  motivoCita?: string;
  tipoVisita?: string;
}

export function CitaTicketDialog({
  open,
  onOpenChange,
  tipo,
  citaId,
  pacienteId,
  pacienteNombre,
  pacienteCedula,
  pacienteTelefono,
  whatsappEnabled,
  emailPaciente,
  fechaCita,
  profesionalNombre,
  motivoCita,
  tipoVisita,
}: CitaTicketDialogProps) {
  const { currentWorkspace } = useWorkspace();
  const { obtenerOCrearTicket, marcarEnviado, loading } = useCitaTickets();
  const [ticket, setTicket] = useState<CitaTicket | null>(null);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    obtenerOCrearTicket({ tipo, citaId, pacienteId }).then(setTicket);
    if (currentWorkspace?.id) {
      supabase
        .from("workspaces")
        .select("nombre, logo_url, direccion, telefono, email_contacto, sitio_web, instrucciones_cita")
        .eq("id", currentWorkspace.id)
        .maybeSingle()
        .then(({ data }) => setWorkspaceData(data));
    }
  }, [open, tipo, citaId, pacienteId, currentWorkspace?.id, obtenerOCrearTicket]);

  const ticketUrl = ticket
    ? `${window.location.origin}/ticket/${ticket.token}`
    : "";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const handlePrint = () => {
    if (!ticket) return;
    const printWindow = window.open("", "_blank", "width=420,height=720");
    if (!printWindow) {
      toast.error("Permite las ventanas emergentes para imprimir");
      return;
    }
    const html = printRef.current?.innerHTML || "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Cita ${ticket.codigo_corto}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; color: #111; }
            .ticket { max-width: 360px; margin: 0 auto; border: 2px dashed #999; border-radius: 12px; padding: 18px; }
            .center { text-align: center; }
            .code { font-family: 'Courier New', monospace; font-size: 28px; font-weight: 800; letter-spacing: 4px; padding: 10px 14px; border: 2px solid #111; border-radius: 8px; display: inline-block; margin: 8px 0; }
            h1, h2, h3, p { margin: 4px 0; }
            .muted { color: #666; font-size: 12px; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            hr { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
            .qr { display: flex; justify-content: center; padding: 8px 0; }
            @media print { body { padding: 0; } .ticket { border: none; } }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 500);">
          <div class="ticket">${html}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    marcarEnviado(ticket.id, "impreso");
  };

  const buildMensaje = () => {
    if (!ticket) return "";
    const fecha = format(new Date(fechaCita), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
    return `Hola ${pacienteNombre} 👋\n\nLe recordamos su ${tipo === "visita" ? "cita" : "llamada"} programada para *${fecha}*${profesionalNombre ? ` con ${profesionalNombre}` : ""}.\n\n🎫 *Código de cita:* ${ticket.codigo_corto}\n🔗 Ver ticket: ${ticketUrl}\n\nPresente este código o el QR a su llegada.\n\n${workspaceData?.nombre || ""}${workspaceData?.telefono ? "\n📞 " + workspaceData.telefono : ""}`;
  };

  const handleWhatsApp = () => {
    if (!ticket || !pacienteTelefono) return;
    const phone = pacienteTelefono.replace(/\D/g, "");
    const fullPhone = phone.startsWith("1") ? phone : `1${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(buildMensaje())}`;
    window.open(url, "_blank");
    marcarEnviado(ticket.id, "whatsapp");
    toast.success("WhatsApp abierto");
  };

  const handleEmail = () => {
    if (!ticket || !emailPaciente) {
      toast.error("El paciente no tiene email registrado");
      return;
    }
    const subject = `Su ticket de cita - ${ticket.codigo_corto}`;
    const url = `mailto:${emailPaciente}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMensaje())}`;
    window.location.href = url;
    marcarEnviado(ticket.id, "email");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket de Cita</DialogTitle>
          <DialogDescription>
            Comparta este ticket con el paciente para validación en recepción.
          </DialogDescription>
        </DialogHeader>

        {loading || !ticket ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Vista del ticket (también se imprime) */}
            <Card className="border-2 border-dashed">
              <CardContent className="p-4">
                <div ref={printRef}>
                  <div className="center text-center">
                    {workspaceData?.logo_url && (
                      <img
                        src={workspaceData.logo_url}
                        alt="Logo"
                        className="h-12 mx-auto mb-2 object-contain"
                      />
                    )}
                    <h2 className="font-bold text-lg">{workspaceData?.nombre || "Mi Clínica"}</h2>
                    {workspaceData?.direccion && (
                      <p className="muted text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" /> {workspaceData.direccion}
                      </p>
                    )}
                    {workspaceData?.telefono && (
                      <p className="muted text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3" /> {workspaceData.telefono}
                      </p>
                    )}
                    {workspaceData?.sitio_web && (
                      <p className="muted text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Globe className="h-3 w-3" /> {workspaceData.sitio_web}
                      </p>
                    )}
                  </div>

                  <hr />

                  <div className="qr flex justify-center py-2">
                    <QRCodeSVG value={ticketUrl} size={140} level="M" includeMargin />
                  </div>

                  <div className="center text-center">
                    <div className="code">{ticket.codigo_corto}</div>
                    <p className="muted text-[11px] text-muted-foreground">
                      Presente este código en recepción
                    </p>
                  </div>

                  <hr />

                  <h3 className="font-semibold text-sm mt-2">Paciente</h3>
                  <div className="row">
                    <span>Nombre:</span>
                    <strong>{pacienteNombre}</strong>
                  </div>
                  {pacienteCedula && (
                    <div className="row">
                      <span>Cédula:</span>
                      <strong>{pacienteCedula}</strong>
                    </div>
                  )}

                  <hr />

                  <h3 className="font-semibold text-sm">Cita</h3>
                  <div className="row">
                    <span>Tipo:</span>
                    <strong className="capitalize">{tipoVisita || tipo}</strong>
                  </div>
                  <div className="row">
                    <span>Fecha:</span>
                    <strong>{format(new Date(fechaCita), "dd/MM/yyyy", { locale: es })}</strong>
                  </div>
                  <div className="row">
                    <span>Hora:</span>
                    <strong>{format(new Date(fechaCita), "HH:mm")}</strong>
                  </div>
                  {profesionalNombre && (
                    <div className="row">
                      <span>Profesional:</span>
                      <strong>{profesionalNombre}</strong>
                    </div>
                  )}
                  {motivoCita && (
                    <div className="row">
                      <span>Motivo:</span>
                      <strong className="text-right max-w-[60%]">{motivoCita}</strong>
                    </div>
                  )}

                  {workspaceData?.instrucciones_cita && (
                    <>
                      <hr />
                      <p className="muted text-[11px] text-muted-foreground italic">
                        {workspaceData.instrucciones_cita}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{ticket.codigo_corto}</Badge>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(ticket.codigo_corto)}>
                <Copy className="h-3 w-3 mr-1" /> Código
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(ticketUrl)}>
                <Copy className="h-3 w-3 mr-1" /> Link
              </Button>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {ticket.enviado_whatsapp && <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />WhatsApp</Badge>}
              {ticket.enviado_email && <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Email</Badge>}
              {ticket.impreso && <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Impreso</Badge>}
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={handlePrint} variant="default">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                disabled={!pacienteTelefono}
                className="bg-green-50 hover:bg-green-100 dark:bg-green-950/20"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleEmail} variant="outline" disabled={!emailPaciente}>
                <Mail className="h-4 w-4 mr-2" /> Email
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
