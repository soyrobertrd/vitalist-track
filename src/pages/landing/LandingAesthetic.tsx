import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Activity, ArrowRight, Camera, Calendar, Heart, Target, Users } from "lucide-react";

const features = [
  { icon: Camera, title: "Galería before/after", desc: "Comparativas visuales de cada tratamiento estético." },
  { icon: Heart, title: "Fichas estéticas", desc: "Evaluación facial, corporal, mapeo de tratamientos." },
  { icon: Calendar, title: "Paquetes y sesiones", desc: "Bonos de sesiones, suscripciones y planes de tratamiento." },
  { icon: Target, title: "CRM & seguimiento", desc: "Lead-to-cliente, fidelización, segmentación VIP." },
  { icon: Users, title: "Recovery integrado", desc: "Si ofreces post-operatorio, conecta directo con Recovery Care." },
];

export default function LandingAesthetic() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold">Health App</span>
          </Link>
          <Link to="/auth"><Button>Acceder</Button></Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
          <Sparkles className="h-4 w-4" /> Aesthetic Pro
        </div>
        <h1 className="text-5xl font-bold mb-6 max-w-3xl mx-auto">
          Plataforma para clínicas estéticas
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Fichas estéticas, before/after, paquetes de sesiones, CRM y opcional Recovery integrado para post-operatorio.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth"><Button size="lg">Empezar gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link to="/"><Button size="lg" variant="outline">Ver otros productos</Button></Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Diseñado para tu vertical</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="p-6">
              <f.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
