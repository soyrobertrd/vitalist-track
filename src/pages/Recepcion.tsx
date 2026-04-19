import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Search, ScanLine, User, Calendar, Clock, CheckCircle2, XCircle, UserCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { differenceInMinutes } from "date-fns";
import { useCitaTickets } from "@/hooks/useCitaTickets";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { MobilePageHeader } from "@/components/MobilePageHeader";

export default function Recepcion() {
  const { buscarPorCodigo, buscarPorToken, marcarLlegada, marcarAtendido, marcarNoShow } = useCitaTickets();
  const [codigo, setCodigo] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!codigo.trim()) {
      toast.error("Ingrese un código");
      return;
    }
    setSearching(true);
    const t = await buscarPorCodigo(codigo);
    setSearching(false);
    if (!t) {
      toast.error("Código no encontrado");
      setTicket(null);
      return;
    }
    setTicket(t);
    toast.success("Cita encontrada");
  };

  const handleScan = async (results: any[]) => {
    if (!results || results.length === 0) return;
    const text = results[0].rawValue || results[0].text;
    if (!text) return;
    setScanning(false);
    // Detectar token en URL
    let token = text;
    try {
      const url = new URL(text);
      const parts = url.pathname.split("/");
      token = parts[parts.length - 1];
    } catch {
      // No es URL, asumir que es token o código directo
    }
    setSearching(true);
    let t = await buscarPorToken(token);
    if (!t) {
      // Probar como código corto
      t = await buscarPorCodigo(token);
    }
    setSearching(false);
    if (!t) {
      toast.error("QR no válido");
      return;
    }
    setTicket(t);
    toast.success("Cita encontrada");
  };

  const handleAccion = async (accion: "llegada" | "atendido" | "noshow") => {
    if (!ticket) return;
    let ok = false;
    if (accion === "llegada") ok = await marcarLlegada(ticket.id);
    if (accion === "atendido") ok = await marcarAtendido(ticket.id);
    if (accion === "noshow") ok = await marcarNoShow(ticket.id);
    if (ok) {
      const t = await buscarPorCodigo(ticket.codigo_corto);
      setTicket(t);
    }
  };

  const reset = () => {
    setTicket(null);
    setCodigo("");
  };

  const cita = ticket?.visita || ticket?.llamada;
  const fechaCita = ticket?.visita?.fecha_hora_visita || ticket?.llamada?.fecha_agendada;
  const minutosTarde = fechaCita ? differenceInMinutes(new Date(), new Date(fechaCita)) : 0;
  const llegadaTarde =
    ticket && fechaCita && minutosTarde > 0 && ticket.estado_checkin === "pendiente";
  const profesionalNombre = cita?.personal_salud
    ? `${cita.personal_salud.nombre} ${cita.personal_salud.apellido}`
    : null;

  const estadoBadge = (estado: string) => {
    const cfg: Record<string, { label: string; cls: string }> = {
      pendiente: { label: "Pendiente", cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
      llegado: { label: "✓ Llegó", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
      atendido: { label: "✓✓ Atendido", cls: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" },
      no_show: { label: "No Show", cls: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
      cancelado: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
    };
    const c = cfg[estado] || cfg.pendiente;
    return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <MobilePageHeader title="Recepción" description="Validar y registrar llegada de pacientes" />
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Recepción</h1>
        <p className="text-muted-foreground">Escanee el QR o ingrese el código del ticket de cita.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validar Ticket</CardTitle>
          <CardDescription>Escanee el QR o ingrese el código corto del paciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="codigo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="codigo"><Search className="h-4 w-4 mr-2" />Código</TabsTrigger>
              <TabsTrigger value="qr"><ScanLine className="h-4 w-4 mr-2" />Escanear QR</TabsTrigger>
            </TabsList>
            <TabsContent value="codigo" className="space-y-3 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: ABC-1234"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="font-mono uppercase tracking-wider text-center text-lg"
                  autoFocus
                />
                <Button onClick={handleSearch} disabled={searching}>
                  <Search className="h-4 w-4 mr-2" />Buscar
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="qr" className="pt-4">
              {!scanning ? (
                <Button onClick={() => setScanning(true)} className="w-full" size="lg">
                  <ScanLine className="h-5 w-5 mr-2" /> Activar cámara
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border">
                    <Scanner
                      onScan={handleScan}
                      onError={(err) => console.error(err)}
                      constraints={{ facingMode: "environment" }}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setScanning(false)} className="w-full">
                    Cancelar
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {ticket && (
        <Card className="border-2 border-primary/40 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {ticket.pacientes?.nombre} {ticket.pacientes?.apellido}
                </CardTitle>
                <CardDescription>Cédula: {ticket.pacientes?.cedula || "—"}</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                {estadoBadge(ticket.estado_checkin)}
                <Badge variant="outline" className="font-mono text-xs">{ticket.codigo_corto}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {llegadaTarde && (
              <Alert variant="destructive" className="border-amber-500/60 bg-amber-500/10 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Cita en retraso</AlertTitle>
                <AlertDescription className="text-sm">
                  El paciente llegó <strong>{minutosTarde} min tarde</strong>
                  {profesionalNombre ? <> a su cita con <strong>{profesionalNombre}</strong></> : null}.
                  La atención queda <strong>sujeta a la disponibilidad del profesional</strong>.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha</p>
                <p className="font-semibold">
                  {fechaCita ? format(new Date(fechaCita), "dd/MM/yyyy", { locale: es }) : "—"}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Hora</p>
                <p className="font-semibold">
                  {fechaCita ? format(new Date(fechaCita), "HH:mm") : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Tipo:</span> <strong className="capitalize">{ticket.tipo_cita}</strong></p>
              {cita?.personal_salud && (
                <p>
                  <span className="text-muted-foreground">Profesional:</span>{" "}
                  <strong>{cita.personal_salud.nombre} {cita.personal_salud.apellido}</strong>
                </p>
              )}
              {(cita?.motivo_visita || cita?.motivo) && (
                <p><span className="text-muted-foreground">Motivo:</span> {cita.motivo_visita || cita.motivo}</p>
              )}
              {ticket.fecha_llegada && (
                <p className="text-amber-700 dark:text-amber-400">
                  Llegó: {format(new Date(ticket.fecha_llegada), "HH:mm")}
                </p>
              )}
              {ticket.fecha_atencion && (
                <p className="text-green-700 dark:text-green-400">
                  Atendido: {format(new Date(ticket.fecha_atencion), "HH:mm")}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                onClick={() => handleAccion("llegada")}
                disabled={ticket.estado_checkin !== "pendiente"}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <UserCheck className="h-4 w-4 mr-2" />Registrar llegada
              </Button>
              <Button
                onClick={() => handleAccion("atendido")}
                disabled={ticket.estado_checkin !== "llegado"}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />Marcar atendido
              </Button>
              <Button
                onClick={() => handleAccion("noshow")}
                variant="outline"
                disabled={["atendido","no_show"].includes(ticket.estado_checkin)}
              >
                <XCircle className="h-4 w-4 mr-2" />No-Show
              </Button>
            </div>

            <Button variant="ghost" onClick={reset} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" /> Buscar otro paciente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
