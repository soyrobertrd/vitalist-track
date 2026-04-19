import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Crown, Loader2, ArrowRight, Shield, Calendar, MessageCircle, Users, Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Plan } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";

/**
 * Public landing page for Vitalist Track.
 * Style: Clinical Ceramic — clean, authoritative, trust-first.
 *
 * SEO note: this is the public face of the app. Title/meta/H1 are tuned
 * for "software de gestión de pacientes domiciliarios LATAM".
 */
export default function Landing() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);

  useEffect(() => {
    document.title = "Vitalist Track — Plataforma clínica para atención domiciliaria";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Gestiona pacientes, coordina visitas y automatiza tu clínica de atención domiciliaria. Multi-país, seguro y diseñado para LATAM.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("planes")
        .select("*")
        .eq("activo", true)
        .order("orden", { ascending: true });
      setPlanes((data || []) as Plan[]);
      setLoadingPlanes(false);
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased relative overflow-hidden font-sans">
      {/* Decorative background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage: "radial-gradient(circle at center 20%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at center 20%, black, transparent 70%)",
          opacity: 0.4,
        }}
      />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 md:px-8 py-6 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          <span className="font-semibold tracking-tight text-lg">Vitalist Track</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#plataforma" className="text-muted-foreground hover:text-foreground transition-colors">
            Plataforma
          </a>
          <a href="#planes" className="text-muted-foreground hover:text-foreground transition-colors">
            Planes
          </a>
          <a href="#seguridad" className="text-muted-foreground hover:text-foreground transition-colors">
            Seguridad
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            Iniciar sesión
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">
            Empezar gratis
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-12 md:pt-20 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-semibold text-muted-foreground mb-8">
            <span className="size-2 rounded-full bg-primary" />
            Diseñado para clínicas de atención domiciliaria en LATAM
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.05] mb-6">
            Precisión clínica en cada visita domiciliaria.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl leading-relaxed mb-10">
            Gestiona pacientes, coordina equipos en terreno y automatiza recordatorios desde una sola
            plataforma. Multi-clínica, multi-país, segura y lista para escalar.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button size="lg" className="h-12 px-8 rounded-full text-base" onClick={() => navigate("/auth")}>
              Empezar gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-full text-base"
              onClick={() => document.getElementById("planes")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver planes
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Sin tarjeta de crédito · Configuración en menos de 5 minutos
          </p>
        </div>

        {/* Problem → Solution band */}
        <section id="plataforma" className="mt-32 grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title="Agenda inteligente"
            description="Llamadas y visitas con detección de conflictos, ausencias del profesional y días no laborables por país."
          />
          <FeatureCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Recordatorios automáticos"
            description="WhatsApp y email multicanal con plantillas personalizables y tracking de entregas."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Multi-clínica real"
            description="Workspaces aislados con roles, permisos por módulo y datos completamente segregados."
          />
          <FeatureCard
            icon={<Activity className="h-5 w-5" />}
            title="Ficha clínica completa"
            description="Alergias, antecedentes, seguros, medicamentos y consentimientos informados auditados."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Automatizaciones"
            description="Disparadores por evento: post-visita, cumpleaños, encuestas de satisfacción, planes de acción."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Seguridad clínica"
            description="RLS por ownership, auditoría inmutable de cambios, encriptación en reposo y en tránsito."
          />
        </section>

        {/* Pricing */}
        <section id="planes" className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Planes para cada etapa</h2>
            <p className="text-muted-foreground mt-3">
              Empieza gratis, escala cuando necesites. Sin contratos, cancela cuando quieras.
            </p>
          </div>

          {loadingPlanes ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {planes.map((plan) => {
                const isPro = plan.codigo === "pro";
                return (
                  <div
                    key={plan.codigo}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                      isPro ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        <Crown className="h-3 w-3" /> Más popular
                      </span>
                    )}
                    <h3 className="text-lg font-semibold">{plan.nombre}</h3>
                    <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{plan.descripcion}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.precio_mensual_usd}</span>
                      <span className="text-muted-foreground"> /mes</span>
                    </div>
                    <ul className="mt-6 space-y-2 text-sm flex-1">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>
                          {plan.limite_pacientes
                            ? `Hasta ${plan.limite_pacientes.toLocaleString()} pacientes`
                            : "Pacientes ilimitados"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>
                          {plan.limite_usuarios ? `${plan.limite_usuarios} usuarios` : "Usuarios ilimitados"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>
                          {plan.limite_profesionales
                            ? `${plan.limite_profesionales} profesionales`
                            : "Profesionales ilimitados"}
                        </span>
                      </li>
                    </ul>
                    <Button
                      className="mt-6 w-full"
                      variant={isPro ? "default" : "outline"}
                      onClick={() => navigate("/auth")}
                    >
                      Empezar con {plan.nombre}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Security band */}
        <section id="seguridad" className="mt-32 rounded-3xl border bg-muted/30 p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
              <Shield className="h-4 w-4" /> Compliance & seguridad
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Datos clínicos protegidos por diseño.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Aislamiento por workspace, Row-Level Security en todas las tablas clínicas, auditoría
              inmutable de cada cambio, consentimiento informado del paciente y backups automáticos.
              Preparado para HIPAA, GDPR y la Ley 172-13 de RD.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-card border p-4">
                <Check className="h-4 w-4 text-primary mb-2" />
                <strong className="block">Auditoría inmutable</strong>
                <span className="text-muted-foreground">Quién cambió qué y cuándo, en cada tabla clínica.</span>
              </div>
              <div className="rounded-xl bg-card border p-4">
                <Check className="h-4 w-4 text-primary mb-2" />
                <strong className="block">Consentimiento informado</strong>
                <span className="text-muted-foreground">
                  Captura legal con IP, navegador y firmante registrado.
                </span>
              </div>
              <div className="rounded-xl bg-card border p-4">
                <Check className="h-4 w-4 text-primary mb-2" />
                <strong className="block">Roles granulares</strong>
                <span className="text-muted-foreground">
                  Permisos por módulo: ver, crear, editar, eliminar.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-32 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Listo para profesionalizar tu operación
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Crea tu workspace en menos de 5 minutos. Sin tarjeta requerida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-12 px-8 rounded-full" onClick={() => navigate("/auth")}>
              Crear cuenta gratis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-full"
              asChild
            >
              <a href="mailto:ventas@vitalist-track.com">Agendar demo</a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary" />
            <span className="font-semibold text-foreground">Vitalist Track</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="mailto:soporte@vitalist-track.com" className="hover:text-foreground">Soporte</a>
            <Link to="/auth" className="hover:text-foreground">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
