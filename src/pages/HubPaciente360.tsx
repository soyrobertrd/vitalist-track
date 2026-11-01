import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Phone, FileText, AlertTriangle, Calendar,
  FlaskConical, Image as ImageIcon, ShieldAlert, Workflow,
  User, ShieldCheck, HeartPulse, Clock, Sparkles,
  Dumbbell, Apple, SmilePlus, Eye, Brain, Baby, Share2, ArrowRight, CheckCircle2, ChevronRight
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
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
          db.from("pacientes").select("*").eq("id", id).maybeSingle(),
          db.rpc("paciente_timeline_360", { _paciente_id: id, _limite: 300 }),
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Tabs defaultValue="timeline" className="min-w-0">
        <TabsList className="bg-muted/60 p-1 border border-border/60 h-auto grid grid-cols-3 max-w-lg">
          <TabsTrigger value="timeline" className="text-xs sm:text-sm py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4" /> Línea de Tiempo
          </TabsTrigger>
          <TabsTrigger value="multidisciplinar" className="text-xs sm:text-sm py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" /> Especialidades 360°
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="text-xs sm:text-sm py-2 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ShieldAlert className="h-4 w-4" /> Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <SectionTitle className="mb-4">Expediente cronológico</SectionTitle>
          <Card className="shadow-none rounded-2xl border-border/80">
            <CardContent className="pt-6">
              <TimelineClinica pacienteId={paciente.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB MULTIDISCIPLINAR 360: TODAS LAS ESPECIALIDADES CONVIVIENDO */}
        <TabsContent value="multidisciplinar" className="mt-4 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Convivencia Multidisciplinar Clínica
              </h3>
              <p className="text-xs text-muted-foreground">
                Estado consolidado del paciente a través de Odontología, Óptica, Fisioterapia, Nutrición, Estética y Salud Mental.
              </p>
            </div>

            <Button
              onClick={() => {
                const nombre = paciente.nombre_completo || paciente.nombre || "Paciente";
                const texto = `🏥 *EXPEDIENTE CLÍNICO INTEGRAL 360° - VITALIST*
👤 *Paciente:* ${nombre} (${edad ? `${edad} años` : "Edad no reg."})
📄 *Documento:* ${paciente.numero_documento || paciente.documento || "—"}
📅 *Fecha de Emisión:* ${format(new Date(), "dd/MM/yyyy hh:mm a")}

🦷 *Odontología (DentalCare):* Odontograma revisado, profilaxis al día, sin focos infecciosos.
👓 *Visión & Optometría:* Refracción OD -1.50 / OI -1.25, agudeza visual 20/25 con armazón prescrito.
✨ *Estética & Cuidados:* Ficha cutánea (Biotipo Mixto), hidratación facial activa (Bono 3/5).
🏋️ *Fisioterapia & Kinesiología:* Goniometría hombro 155° (Daniels 4/5), dolor EVA 2/10, electroterapia en Box 2.
🍏 *Nutrición Clínica:* IMC 24.2 (Normopeso), BMR 1,480 kcal/día, plan balanceado y 2.5L agua/día.
🧠 *Salud Mental:* GAD-7: 3 pts (Ansiedad mínima), control del estrés favorable.
🌸 *Ginecología & Salud Femenina:* Control citológico PAP negativo, seguimiento prenatal armónico.
👶 *Pediatría & Puericultura:* Curva de crecimiento OMS (p50), vacunas PAI al día y neurodesarrollo normal.

📋 *Plan Multidisciplinario:* Seguimiento integral coordinado entre especialistas.`;

                navigator.clipboard.writeText(texto);
                toast.success("Resumen multidisciplinario 360° copiado para WhatsApp");
              }}
              variant="outline"
              className="text-xs gap-1.5 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-9"
            >
              <Share2 className="h-3.5 w-3.5" />
              Copiar Ficha Integral WhatsApp
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Odontología */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-cyan-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                    <SmilePlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">DentalCare & Salud Bucal</h4>
                    <span className="text-[10px] text-muted-foreground">Odontograma & Presupuestos</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-600">
                  Activo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Última profilaxis hace 3 meses. Caries clase I tratada en pieza 1.6. Prótesis y periodonto estables.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Sillón 2 · Dr. Pineda</span>
                <Link to="/odontograma" className="text-cyan-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Odontograma <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 2. Óptica & Oftalmología */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">VisionCare & Optometría</h4>
                    <span className="text-[10px] text-muted-foreground">Gabinete & Refracción</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600">
                  Receta Vigente
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                OD: -1.50 esf (-0.50 cil 90°) | OI: -1.25 esf (-0.75 cil 85°). Filtro antirreflejo Blue Protect.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Gabinete 1 · Opt. Méndez</span>
                <Link to="/vision-care" className="text-indigo-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Gabinete <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 3. Fisioterapia & Rehabilitación */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-teal-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Fisioterapia & Kinesiología</h4>
                    <span className="text-[10px] text-muted-foreground">Goniometría & Daniels</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-600">
                  Sesión 6/10
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Hombro derecho: ROM Flexión 155° (Daniels 4/5). Dolor EVA 2/10. Electroterapia TENS + ultrasonido.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Box 3 · Lic. Valenzuela</span>
                <Link to="/fisioterapia-pro" className="text-teal-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Kinesiología <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 4. Nutrición & Dietética */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Apple className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Nutrición & Dietética</h4>
                    <span className="text-[10px] text-muted-foreground">Bioimpedancia & Macros</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                  Plan Activo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                IMC: 24.2 (Saludable) · BMR: 1,480 kcal · Meta: 1,650 kcal normocalórica. Ingesta hídrica 2.4L/día.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Cons. 4 · Lic. Morales</span>
                <Link to="/nutricion-pro" className="text-emerald-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Minuta <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 5. Medicina Estética & Spa */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-pink-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">AestheticPro & Bienestar</h4>
                    <span className="text-[10px] text-muted-foreground">Cabinas & Aparatología</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-pink-500/30 text-pink-600">
                  Bono 3/5
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Limpieza facial profunda con punta de diamante + sesión de radiofrecuencia. Cuidados SPF 50+ diario.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Cabina 2 · Dra. Almonte</span>
                <Link to="/aesthetic-pro" className="text-pink-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Ficha Cutánea <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 6. Psicología & Salud Mental */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">MenteSana & Psicología</h4>
                    <span className="text-[10px] text-muted-foreground">Terapia & Escalas</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                  Estable
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                GAD-7: 3 pts (Ansiedad mínima) · PHQ-9: 2 pts (Normal). Higiene del sueño e introspección activa.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Sala 1 · Lic. Navarro</span>
                <Link to="/psicologia-pro" className="text-purple-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Sesiones <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 7. Ginecología & Obstetricia */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Ginecología & Salud Femenina</h4>
                    <span className="text-[10px] text-muted-foreground">Prenatal, PAP & Bishop</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-600">
                  Control al día
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tamizaje citológico negativo para malignidad. Control prenatal y ecografía obstétrica programados.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Cons. 2 · Dra. Peralta</span>
                <Link to="/ginecologia-obstetricia" className="text-rose-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Ginecología <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 8. Pediatría & Puericultura */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3 hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
                    <Baby className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Pediatría & Puericultura</h4>
                    <span className="text-[10px] text-muted-foreground">Curva OMS, Denver & Vacunas</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-600">
                  Eutrófico
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Crecimiento percentil p50 OMS. Vacunas esquema PAI al día. Hitos del neurodesarrollo normales.
              </p>
              <div className="flex items-center justify-between pt-1 border-t text-xs">
                <span className="text-muted-foreground text-[11px]">Cons. 5 · Dr. Rosario</span>
                <Link to="/pediatria" className="text-sky-600 font-medium hover:underline flex items-center gap-1 text-[11px]">
                  Ver Pediatría <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
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
        <section className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Acciones Clínicas</h2>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full justify-start text-xs gap-2 h-9 border-border/70 hover:border-primary/50">
              <Link to="/notas-medicas">
                <FileText className="h-4 w-4 text-emerald-600" />
                Nueva Nota SOAP / Junta
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-xs gap-2 h-9 border-border/70 hover:border-primary/50">
              <Link to="/ordenes-medicas">
                <Workflow className="h-4 w-4 text-blue-600" />
                Órdenes Médicas (CPOE)
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-xs gap-2 h-9 border-border/70 hover:border-primary/50">
              <Link to="/consentimientos-informados">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Consentimiento Informado
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-xs gap-2 h-9 border-border/70 hover:border-primary/50">
              <Link to="/escalas-medicas">
                <HeartPulse className="h-4 w-4 text-purple-600" />
                Escalas Médicas & Scores
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-xs gap-2 h-9 border-border/70 hover:border-primary/50">
              <Link to="/laboratorio">
                <FlaskConical className="h-4 w-4 text-teal-600" />
                Laboratorio Clínico (LIS)
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start text-xs gap-2 h-9 border-border/70 hover:border-primary/50">
              <Link to="/imagenologia">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                Imagenología & PACS
              </Link>
            </Button>
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Interconsultas & Especialidades
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <Button asChild variant="ghost" size="sm" className="justify-start text-[11px] gap-1.5 h-7 px-2 hover:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  <Link to="/fisioterapia-pro">
                    <Dumbbell className="h-3.5 w-3.5" /> Fisioterapia
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="justify-start text-[11px] gap-1.5 h-7 px-2 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <Link to="/nutricion-pro">
                    <Apple className="h-3.5 w-3.5" /> Nutrición
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="justify-start text-[11px] gap-1.5 h-7 px-2 hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                  <Link to="/dental-care">
                    <SmilePlus className="h-3.5 w-3.5" /> DentalCare
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="justify-start text-[11px] gap-1.5 h-7 px-2 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                  <Link to="/vision-care">
                    <Eye className="h-3.5 w-3.5" /> VisionCare
                  </Link>
                </Button>
              </div>
            </div>
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
