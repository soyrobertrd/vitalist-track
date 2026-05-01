import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, ArrowRight, Check, Star } from "lucide-react";

export interface VerticalConfig {
  slug: string;
  name: string;
  tagline: string;
  hero: { eyebrow: string; title: string; subtitle: string; icon: any; accent: string };
  pains: { problem: string; solution: string }[];
  modules: { icon: any; title: string; desc: string }[];
  workflow: string[];
  benefits: { metric: string; label: string }[];
  testimonial: { quote: string; author: string; role: string };
  useCases: string[];
  pricingNote: string;
}

export default function LandingShell({ config, children }: { config: VerticalConfig; children?: ReactNode }) {
  const HeroIcon = config.hero.icon;
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold">Health App</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">· {config.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground hidden md:inline">Otros productos</Link>
            <Link to="/auth"><Button>Empezar gratis</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative overflow-hidden border-b ${config.hero.accent}`}>
        <div className="container mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 border text-sm mb-6">
            <HeroIcon className="h-4 w-4 text-primary" /> {config.hero.eyebrow}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">{config.hero.title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{config.hero.subtitle}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/auth"><Button size="lg" className="gap-2">Probar gratis 14 días <ArrowRight className="h-4 w-4" /></Button></Link>
            <a href="#modulos"><Button size="lg" variant="outline">Ver módulos</Button></a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Sin tarjeta de crédito · Migración asistida · Soporte en español</p>
        </div>
      </section>

      {/* Pains → Solutions */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">¿Te suena familiar?</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">Resolvemos los problemas operativos reales de {config.tagline}.</p>
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {config.pains.map((p, i) => (
            <Card key={i} className="p-5">
              <div className="text-sm text-destructive mb-2">❌ {p.problem}</div>
              <div className="text-sm flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /><span>{p.solution}</span></div>
            </Card>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modulos" className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-3">Todo lo que necesitas en una plataforma</h2>
          <p className="text-muted-foreground text-center mb-10">Módulos diseñados específicamente para {config.tagline}.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {config.modules.map((m) => (
              <Card key={m.title} className="p-6 hover:shadow-md transition">
                <m.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Cómo funciona en tu día a día</h2>
        <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {config.workflow.map((step, i) => (
            <div key={i} className="relative">
              <div className="rounded-2xl border bg-card p-5 h-full">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-3">{i + 1}</div>
                <p className="text-sm">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits / metrics */}
      <section className="bg-primary/5 border-y">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Resultados que verás</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {config.benefits.map((b, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{b.metric}</div>
                <div className="text-sm text-muted-foreground">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Hecho para</h2>
        <p className="text-muted-foreground text-center mb-10">Sin importar el tamaño de tu operación.</p>
        <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
          {config.useCases.map((u) => (
            <span key={u} className="px-4 py-2 rounded-full border bg-card text-sm">{u}</span>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-xl md:text-2xl font-medium italic mb-4">"{config.testimonial.quote}"</p>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{config.testimonial.author}</span> · {config.testimonial.role}
          </div>
        </div>
      </section>

      {/* Custom slot */}
      {children}

      {/* Pricing teaser + CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Empieza hoy mismo</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-2">{config.pricingNote}</p>
        <p className="text-sm text-muted-foreground mb-8">14 días gratis · Sin compromiso · Cancela cuando quieras</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/auth"><Button size="lg" className="gap-2">Crear mi cuenta <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/#planes"><Button size="lg" variant="outline">Ver precios completos</Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary" /> Health App · Otros productos:
          </div>
          <div className="flex gap-4 text-sm">
            <Link to="/clinica" className="hover:text-primary">Clínicas</Link>
            <Link to="/odontologia" className="hover:text-primary">Dental</Link>
            <Link to="/aesthetic" className="hover:text-primary">Estética</Link>
            <Link to="/recovery" className="hover:text-primary">Recovery</Link>
            <Link to="/vision" className="hover:text-primary">Visión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
