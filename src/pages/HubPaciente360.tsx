import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Phone, FileText, AlertTriangle, Calendar,
  FlaskConical, Image as ImageIcon, ShieldAlert, Workflow,
  User, ShieldCheck, HeartPulse, Clock, Sparkles
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { HeaderPaciente360 } from "@/components/ficha-clinica/HeaderPaciente360";
import { SectionTitle } from "@/components/common/SectionTitle";
import { ArrowLeft, Cake, Phone as PhoneIcon, Mail as MailIcon, MapPin as MapPinIcon, StickyNote } from "lucide-react";
import { TimelineClinica } from "@/components/ficha-clinica/TimelineClinica";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportarDatosGDPR } from "@/components/pacientes/ExportarDatosGDPR";
import { DEMO_MODE, DEMO_PACIENTES, DEMO_CITAS } from "@/lib/mock-live-seed";

const iconMap: Record<string, any> = {
  visita: Calendar,
  llamada: Phone,
  orden_medica: FileText,
  alerta: AlertTriangle,
  laboratorio: FlaskConical,
  imagen: ImageIcon,
  evento_adverso: ShieldAlert,
};

const moduloLabel: Record<string, string> = {
  visitas: "Citas y Visitas",
  llamadas: "Llamadas",
  cpoe: "Órdenes",
  alertas: "Alertas",
  laboratorio: "Laboratorio",
  imagenologia: "Imágenes",
  calidad: "Calidad",
};

export default function HubPaciente360() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let pData = null;
      let tData: any[] = [];
      try {
        const [p, t] = await Promise.all([
          supabase.from("pacientes").select("*").eq("id", id).maybeSingle(),
          supabase.rpc("paciente_timeline_360", { _paciente_id: id, _limite: 300 }),
        ]);
        pData = p.data;
        tData = Array.isArray(t.data) ? t.data : [];
      } catch {
        // Fallback
      }

      // Fallback a demo paciente si no se encuentra en Supabase
      if (DEMO_MODE && !pData) {
        const demo = DEMO_PACIENTES.find((p) => p.id === id);
        pData = demo;
        // Mock timeline
        tData = [
          {
            modulo: "visitas",
            tipo: "visita",
            titulo: "Consulta Médica General",
            estado: "confirmada",
            fecha: new Date().toISOString(),
          },
          {
            modulo: "alertas",
            tipo: "alerta",
            titulo: "Registro de Expediente Digital",
            estado: "alta",
            fecha: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
        ];
      }

      setPaciente(pData);
      setTimeline(tData);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <p className="text-muted-foreground animate-pulse">Cargando expediente 360° del paciente...</p>
      </div>
    );
  }

  if (!paciente) return <div className="p-6">Paciente no encontrado</div>;

  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), new Date(paciente.fecha_nacimiento))
    : null;

  const proximaCita = DEMO_MODE && DEMO_CITAS.find((c) => c.paciente_id === paciente.id);

  const conteos = timeline.reduce<Record<string, number>>((acc, e) => {
    acc[e.modulo] = (acc[e.modulo] || 0) + 1;
    return acc;
  }, {});

  const filtrado = filtroModulo ? timeline.filter((e) => e.modulo === filtroModulo) : timeline;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        to="/pacientes"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la lista de pacientes
      </Link>

      {/* Header Unificado Fijo 360° (Fase 9.3) */}
      <HeaderPaciente360 pacienteId={paciente.id} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Tabs defaultValue="timeline" className="min-w-0">
        <TabsList>
          <TabsTrigger value="timeline" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" /> Línea de Tiempo Integral
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Auditoría & Módulos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <SectionTitle className="mb-4">Expediente cronológico</SectionTitle>
          <Card className="shadow-none">
            <CardContent className="pt-6">
              <TimelineClinica pacienteId={paciente.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4 space-y-4">
          <SectionTitle>Actividad por módulo</SectionTitle>
          {/* Resumen por módulo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              onClick={() => setFiltroModulo(null)}
              className={`rounded-2xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filtroModulo === null ? "border-primary bg-primary/10" : "hover:border-primary/40"
              }`}
            >
              <div className="text-xs text-muted-foreground">Todos</div>
              <div className="text-lg font-bold">{timeline.length}</div>
            </button>
            {Object.entries(moduloLabel).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFiltroModulo(key)}
                className={`rounded-2xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  filtroModulo === key ? "border-primary bg-primary/10" : "hover:border-primary/40"
                }`}
              >
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-bold">{conteos[key] || 0}</div>
              </button>
            ))}
          </div>

          <Card className="shadow-none border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Eventos del Sistema y Módulos
                {filtroModulo && (
                  <Badge variant="outline" className="ml-2">
                    {moduloLabel[filtroModulo]}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filtrado.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
              )}
              <div className="space-y-3">
                {filtrado.map((e, i) => {
                  const Icon = iconMap[e.tipo] || Activity;
                  return (
                    <div
                      key={i}
                      className="flex gap-3 items-start border-l-2 border-primary/30 pl-4 pb-2"
                    >
                      <Icon className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="font-medium text-sm">{e.titulo}</p>
                          <div className="flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {moduloLabel[e.modulo] || e.modulo}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {e.estado}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(e.fecha), "PPp", { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Panel derecho: información general + notas importantes */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {/* Acciones Clínicas Rápidas */}
        <section className="rounded-2xl border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Acciones Clínicas</h2>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs gap-2 h-9">
              <Link to="/escalas-medicas">
                <HeartPulse className="h-4 w-4 text-purple-600" />
                Evaluar Escala Médica
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs gap-2 h-9">
              <Link to="/notas-medicas">
                <FileText className="h-4 w-4 text-emerald-600" />
                Nueva Nota SOAP / Junta
              </Link>
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">Información general</h2>
          <ul className="space-y-4">
            {[
              { icon: Cake, label: "Fecha de nacimiento", valor: paciente.fecha_nacimiento ? `${format(new Date(paciente.fecha_nacimiento), "dd/MM/yyyy")}${edad !== null ? ` (${edad} años)` : ""}` : null },
              { icon: PhoneIcon, label: "Teléfono", valor: paciente.contacto_px },
              { icon: MailIcon, label: "Correo", valor: paciente.email_px },
              { icon: MapPinIcon, label: "Dirección", valor: paciente.direccion_domicilio || paciente.zona },
            ].map(({ icon: Icon, label, valor }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">{label}</span>
                  <span className="block break-words text-sm font-medium">{valor || "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-base font-semibold">
            <StickyNote className="h-4 w-4 text-primary" aria-hidden="true" /> Notas importantes
          </h2>
          <p className="whitespace-pre-line rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            {paciente.historia_medica_basica || "Sin notas registradas."}
          </p>
        </section>
      </aside>
      </div>
    </div>
  );
}
