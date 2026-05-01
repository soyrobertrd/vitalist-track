import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays, Pill, AlertTriangle, Shield, User, Clock,
  CheckCircle2, XCircle, Loader2, Receipt, Smile, Eye, HeartPulse, ClipboardList, Send,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type Vertical = "clinica" | "dental" | "aesthetic" | "recovery" | "vision";

interface PortalData {
  valid: boolean;
  error?: string;
  paciente?: { id?: string; nombre: string; fecha_nacimiento?: string; sexo?: string; vertical?: Vertical };
  citas?: Array<{ id?: string; fecha: string; tipo: string; estado: string; profesional: string }>;
  recetas?: Array<{ medicamento: string; dosis: string; frecuencia: string; inicio: string; fin: string; estado: string }>;
  alergias?: Array<{ sustancia: string; tipo: string; severidad: string; reaccion: string }>;
  seguros?: Array<{ aseguradora: string; plan: string; numero_afiliado: string; activo: boolean }>;
  facturas?: Array<{ numero: string; fecha: string; total: number; pagado: number; pendiente: number; estado: string; descripcion?: string }>;
  planes_dental?: Array<{ numero: string; estado: string; presupuesto: number; cuotas: number; aprobado: boolean; fecha: string }>;
  recetas_oft?: Array<{ numero: string; od: any; oi: any; dp?: number; tipo_lente?: string; vigencia?: string; fecha: string }>;
  seguimiento_recovery?: Array<{ fecha: string; turno: string; temperatura?: number; presion?: string; fc?: number; sat?: number; dolor?: number; inflamacion?: string; notas?: string }>;
  odontogramas?: Array<{ fecha: string; notas?: string }>;
}

const verticalLabel: Record<Vertical, string> = {
  clinica: "Clínica",
  dental: "Odontología",
  aesthetic: "Aesthetic",
  recovery: "Recovery",
  vision: "VisionCare",
};

const formatMoney = (n?: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 2 }).format(n || 0);

export default function PortalPaciente() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);

  // Acción dialog
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<"confirmar_cita" | "reagendar_cita" | "cancelar_cita" | "mensaje">("mensaje");
  const [actionCitaId, setActionCitaId] = useState<string | undefined>();
  const [actionMensaje, setActionMensaje] = useState("");
  const [actionFecha, setActionFecha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setData({ valid: false, error: "No se proporcionó un token de acceso" });
      setLoading(false);
      return;
    }
    (async () => {
      const { data: result, error } = await supabase.rpc("portal_paciente_datos", { _token: token });
      if (error) setData({ valid: false, error: error.message });
      else setData(result as unknown as PortalData);
      setLoading(false);
    })();
  }, [token]);

  const openAction = (tipo: typeof actionType, citaId?: string) => {
    setActionType(tipo);
    setActionCitaId(citaId);
    setActionMensaje("");
    setActionFecha("");
    setActionOpen(true);
  };

  const submitAction = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data: res, error } = await supabase.rpc("portal_paciente_solicitar_accion", {
      _token: token,
      _tipo: actionType,
      _cita_id: actionCitaId || null,
      _mensaje: actionMensaje || null,
      _fecha_propuesta: actionFecha ? new Date(actionFecha).toISOString() : null,
    });
    setSubmitting(false);
    if (error || !(res as any)?.ok) {
      toast.error((res as any)?.error || error?.message || "No se pudo enviar la solicitud");
      return;
    }
    toast.success("Solicitud enviada. El equipo te contactará pronto.");
    setActionOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Acceso no válido</h2>
            <p className="text-muted-foreground">{data?.error || "Token inválido o expirado"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pac = data.paciente!;
  const vertical = (pac.vertical || "clinica") as Vertical;
  const citasFuturas = (data.citas || []).filter((c) => new Date(c.fecha) >= new Date());
  const citasPasadas = (data.citas || []).filter((c) => new Date(c.fecha) < new Date());

  // Tabs visibles según vertical
  const showDental = vertical === "dental" || (data.planes_dental?.length || 0) > 0 || (data.odontogramas?.length || 0) > 0;
  const showVision = vertical === "vision" || (data.recetas_oft?.length || 0) > 0;
  const showRecovery = vertical === "recovery" || (data.seguimiento_recovery?.length || 0) > 0;
  const showFacturas = (data.facturas?.length || 0) > 0;

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      pendiente: "bg-warning/20 text-warning",
      realizada: "bg-success/20 text-success",
      cancelada: "bg-destructive/20 text-destructive",
      activa: "bg-success/20 text-success",
      completada: "bg-muted text-muted-foreground",
      pagada: "bg-success/20 text-success",
      parcial: "bg-warning/20 text-warning",
      anulada: "bg-destructive/20 text-destructive",
      en_seguro: "bg-primary/10 text-primary",
    };
    return map[estado] || "bg-muted text-muted-foreground";
  };

  const severidadColor = (sev: string) => {
    const map: Record<string, string> = {
      leve: "text-success", moderada: "text-warning",
      severa: "text-destructive", anafilaxia: "text-destructive font-bold",
    };
    return map[sev] || "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <User className="h-10 w-10" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{pac.nombre}</h1>
            <p className="opacity-80 text-sm">
              {pac.sexo === "M" ? "Masculino" : pac.sexo === "F" ? "Femenino" : pac.sexo || ""}
              {pac.fecha_nacimiento && ` · Nac. ${format(new Date(pac.fecha_nacimiento + "T12:00:00"), "dd/MM/yyyy")}`}
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">{verticalLabel[vertical]}</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 -mt-4">
        <Tabs defaultValue="citas">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="citas" className="gap-1"><CalendarDays className="h-4 w-4" /> Citas</TabsTrigger>
            <TabsTrigger value="recetas" className="gap-1"><Pill className="h-4 w-4" /> Recetas</TabsTrigger>
            {showFacturas && <TabsTrigger value="facturas" className="gap-1"><Receipt className="h-4 w-4" /> Facturas</TabsTrigger>}
            {showDental && <TabsTrigger value="dental" className="gap-1"><Smile className="h-4 w-4" /> Dental</TabsTrigger>}
            {showVision && <TabsTrigger value="vision" className="gap-1"><Eye className="h-4 w-4" /> Visión</TabsTrigger>}
            {showRecovery && <TabsTrigger value="recovery" className="gap-1"><HeartPulse className="h-4 w-4" /> Recovery</TabsTrigger>}
            <TabsTrigger value="alergias" className="gap-1"><AlertTriangle className="h-4 w-4" /> Alergias</TabsTrigger>
            <TabsTrigger value="seguros" className="gap-1"><Shield className="h-4 w-4" /> Seguros</TabsTrigger>
          </TabsList>

          {/* CITAS */}
          <TabsContent value="citas" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => openAction("mensaje")}>
                <Send className="h-4 w-4 mr-2" /> Enviar mensaje al equipo
              </Button>
            </div>

            {citasFuturas.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Próximas citas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {citasFuturas.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border flex-wrap gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(c.fecha), "EEEE d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.tipo} · {c.profesional}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={estadoBadge(c.estado)}>{c.estado}</Badge>
                        <Button size="sm" onClick={() => openAction("confirmar_cita", c.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAction("reagendar_cita", c.id)}>
                          Reagendar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openAction("cancelar_cita", c.id)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {citasPasadas.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Historial</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {citasPasadas.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                          <span>{format(new Date(c.fecha), "dd/MM/yyyy HH:mm")} · {c.tipo}</span>
                          <Badge variant="outline" className={estadoBadge(c.estado)}>{c.estado}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {citasFuturas.length === 0 && citasPasadas.length === 0 && (
              <Alert><AlertDescription>No hay citas registradas.</AlertDescription></Alert>
            )}
          </TabsContent>

          {/* RECETAS */}
          <TabsContent value="recetas" className="space-y-4">
            {(data.recetas || []).length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="text-lg">Recetas médicas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.recetas!.map((r, i) => (
                    <div key={i} className="p-3 rounded-lg border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.medicamento}</span>
                        <Badge className={estadoBadge(r.estado)}>{r.estado}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.dosis} · {r.frecuencia}</p>
                      {r.inicio && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.inicio + "T12:00:00"), "dd/MM/yyyy")}
                          {r.fin && ` → ${format(new Date(r.fin + "T12:00:00"), "dd/MM/yyyy")}`}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No hay recetas registradas.</AlertDescription></Alert>
            )}
          </TabsContent>

          {/* FACTURAS */}
          {showFacturas && (
            <TabsContent value="facturas" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Facturas</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.facturas!.map((f, i) => (
                      <div key={i} className="p-3 rounded border flex items-center justify-between flex-wrap gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">#{f.numero}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(f.fecha + "T12:00:00"), "dd/MM/yyyy")} {f.descripcion ? `· ${f.descripcion}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatMoney(f.total)}</p>
                          {f.pendiente > 0 && (
                            <p className="text-xs text-destructive">Pendiente: {formatMoney(f.pendiente)}</p>
                          )}
                        </div>
                        <Badge className={estadoBadge(f.estado)}>{f.estado}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* DENTAL */}
          {showDental && (
            <TabsContent value="dental" className="space-y-4">
              {(data.planes_dental?.length || 0) > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Planes de tratamiento</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {data.planes_dental!.map((p, i) => (
                      <div key={i} className="p-3 rounded border flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium">Plan #{p.numero || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(p.presupuesto)} · {p.cuotas} cuota(s)
                          </p>
                        </div>
                        <Badge className={estadoBadge(p.estado)}>{p.estado}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {(data.odontogramas?.length || 0) > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Odontogramas</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {data.odontogramas!.map((o, i) => (
                      <div key={i} className="p-3 rounded border">
                        <p className="text-sm font-medium">{format(new Date(o.fecha + "T12:00:00"), "dd/MM/yyyy")}</p>
                        {o.notas && <p className="text-xs text-muted-foreground">{o.notas}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* VISION */}
          {showVision && (
            <TabsContent value="vision" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Recetas ópticas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(data.recetas_oft || []).map((r, i) => (
                    <div key={i} className="p-3 rounded border space-y-2">
                      <div className="flex justify-between flex-wrap">
                        <span className="font-medium">#{r.numero || "Receta óptica"}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(r.fecha), "dd/MM/yyyy")}
                          {r.vigencia && ` · vigente hasta ${format(new Date(r.vigencia + "T12:00:00"), "dd/MM/yyyy")}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted">
                          <p className="font-semibold mb-1">OD</p>
                          Esf {r.od?.esfera ?? "—"} · Cil {r.od?.cilindro ?? "—"} · Eje {r.od?.eje ?? "—"} · Add {r.od?.add ?? "—"}
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <p className="font-semibold mb-1">OI</p>
                          Esf {r.oi?.esfera ?? "—"} · Cil {r.oi?.cilindro ?? "—"} · Eje {r.oi?.eje ?? "—"} · Add {r.oi?.add ?? "—"}
                        </div>
                      </div>
                      {r.tipo_lente && <p className="text-sm">Lente recomendado: <strong>{r.tipo_lente}</strong></p>}
                      {r.dp && <p className="text-xs text-muted-foreground">DP: {r.dp} mm</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* RECOVERY */}
          {showRecovery && (
            <TabsContent value="recovery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" /> Seguimiento clínico (últimos 14 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {(data.seguimiento_recovery || []).map((s, i) => (
                        <div key={i} className="p-3 rounded border text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{format(new Date(s.fecha + "T12:00:00"), "dd/MM/yyyy")}</span>
                            <Badge variant="outline" className="uppercase text-xs">{s.turno}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs text-muted-foreground">
                            {s.temperatura != null && <span>T° {s.temperatura}</span>}
                            {s.presion && s.presion !== "/" && <span>PA {s.presion}</span>}
                            {s.fc != null && <span>FC {s.fc}</span>}
                            {s.sat != null && <span>SatO₂ {s.sat}%</span>}
                            {s.dolor != null && <span>Dolor {s.dolor}/10</span>}
                            {s.inflamacion && <span>Inf. {s.inflamacion}</span>}
                          </div>
                          {s.notas && <p className="text-xs">{s.notas}</p>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ALERGIAS */}
          <TabsContent value="alergias" className="space-y-4">
            {(data.alergias || []).length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="text-lg">Alergias conocidas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.alergias!.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${severidadColor(a.severidad)}`} />
                        <span className="font-medium">{a.sustancia}</span>
                        <Badge variant="outline">{a.tipo}</Badge>
                      </div>
                      {a.reaccion && <p className="text-sm text-muted-foreground mt-1">Reacción: {a.reaccion}</p>}
                      <p className={`text-xs mt-1 ${severidadColor(a.severidad)}`}>Severidad: {a.severidad}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No hay alergias registradas.</AlertDescription></Alert>
            )}
          </TabsContent>

          {/* SEGUROS */}
          <TabsContent value="seguros" className="space-y-4">
            {(data.seguros || []).length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="text-lg">Seguros médicos activos</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.seguros!.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <span className="font-medium">{s.aseguradora}</span>
                        {s.plan && <span className="text-muted-foreground"> · {s.plan}</span>}
                        {s.numero_afiliado && <p className="text-sm text-muted-foreground">Nro: {s.numero_afiliado}</p>}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No hay seguros activos registrados.</AlertDescription></Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground py-4">
          Portal del paciente · Acceso seguro con token temporal
        </div>
      </div>

      {/* Acción dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "confirmar_cita" && "Confirmar cita"}
              {actionType === "reagendar_cita" && "Solicitar reagendamiento"}
              {actionType === "cancelar_cita" && "Cancelar cita"}
              {actionType === "mensaje" && "Mensaje al equipo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {actionType === "reagendar_cita" && (
              <div>
                <label className="text-sm font-medium">Fecha y hora propuesta</label>
                <Input type="datetime-local" value={actionFecha} onChange={(e) => setActionFecha(e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                {actionType === "mensaje" ? "Mensaje" : "Comentario (opcional)"}
              </label>
              <Textarea
                value={actionMensaje}
                onChange={(e) => setActionMensaje(e.target.value)}
                rows={3}
                placeholder={actionType === "mensaje" ? "Escribe tu mensaje al equipo..." : "Ej. cambio de síntomas, conflicto de agenda..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancelar</Button>
            <Button onClick={submitAction} disabled={submitting || (actionType === "mensaje" && !actionMensaje.trim())}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
