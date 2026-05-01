import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, BedDouble, Pill, FlaskConical, Stethoscope, Users, ArrowRight, ShieldCheck } from "lucide-react";

const features = [
  { icon: BedDouble, title: "Hospitalización & UCI", desc: "Censo de camas, kardex, infusiones y rondas médicas en tiempo real." },
  { icon: Stethoscope, title: "Quirófano & Triage", desc: "Programación quirúrgica, urgencias, banco de sangre y oncología." },
  { icon: Pill, title: "Farmacia & CPOE", desc: "Órdenes médicas electrónicas, dispensación y alertas clínicas." },
  { icon: FlaskConical, title: "Laboratorio & Imagenología", desc: "Resultados, visor DICOM, interoperabilidad HL7/FHIR." },
  { icon: Users, title: "Maternidad & Neonatología", desc: "Atención perinatal completa, alta hospitalaria y educación." },
  { icon: ShieldCheck, title: "Calidad & Acreditación", desc: "Indicadores, eventos adversos, gestión de riesgos." },
];

export default function LandingClinica() {
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
          <Activity className="h-4 w-4" /> Clínicas y Hospitales
        </div>
        <h1 className="text-5xl font-bold mb-6 max-w-3xl mx-auto">
          Sistema integral para clínicas y hospitales
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Hospitalización, quirófano, urgencias, laboratorio, farmacia, UCI y todos los módulos clínicos en una sola plataforma.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth"><Button size="lg">Empezar gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link to="/"><Button size="lg" variant="outline">Ver otros productos</Button></Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Todo lo que tu hospital necesita</h2>
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
