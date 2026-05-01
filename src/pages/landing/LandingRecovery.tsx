import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BedDouble, Activity, ArrowRight, ClipboardList, Heart, Pill, Calendar, MapPin } from "lucide-react";

const features = [
  { icon: ClipboardList, title: "Plan de rehabilitación", desc: "Protocolos por etapa, objetivos y seguimiento de evolución." },
  { icon: Heart, title: "Cuidado post-operatorio", desc: "Curaciones, signos vitales, alertas tempranas." },
  { icon: Pill, title: "Medicación & terapias", desc: "Esquemas, recordatorios y entrega de muestras." },
  { icon: Calendar, title: "Agenda de sesiones", desc: "Fisioterapia, terapia respiratoria, terapia ocupacional." },
  { icon: MapPin, title: "Casa o instalación propia", desc: "Funciona como módulo complementario o como centro autónomo." },
];

export default function LandingRecovery() {
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
          <BedDouble className="h-4 w-4" /> Recovery Care
        </div>
        <h1 className="text-5xl font-bold mb-6 max-w-3xl mx-auto">
          Centros de recuperación y rehabilitación
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Para casas de recuperación post-quirúrgica, rehabilitación y cuidado prolongado. Independiente o integrado a tu clínica estética.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth"><Button size="lg">Empezar gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link to="/"><Button size="lg" variant="outline">Ver otros productos</Button></Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Cuidado integral en recuperación</h2>
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
