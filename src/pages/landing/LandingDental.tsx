import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CircleDot, Activity, ArrowRight, SmilePlus, Calendar, FileText, DollarSign, Camera } from "lucide-react";

const features = [
  { icon: SmilePlus, title: "Odontograma digital", desc: "Registro visual interactivo por pieza dental con histórico." },
  { icon: Calendar, title: "Agenda multi-sillón", desc: "Asignación de sillones, recordatorios y confirmaciones." },
  { icon: FileText, title: "Tratamientos & Presupuestos", desc: "Planes de tratamiento por fases con presupuesto detallado." },
  { icon: Camera, title: "Imágenes & Radiografías", desc: "Almacén de RX, fotos intraorales y comparativas before/after." },
  { icon: DollarSign, title: "Financiamiento dental", desc: "Cuotas, anticipos, ARS odontológicas y facturación." },
];

export default function LandingDental() {
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
          <CircleDot className="h-4 w-4" /> DentalCare Pro
        </div>
        <h1 className="text-5xl font-bold mb-6 max-w-3xl mx-auto">
          Software para clínicas dentales modernas
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Odontograma, agenda multi-sillón, presupuestos por fases, imagenología y facturación. Todo en una sola plataforma.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth"><Button size="lg">Empezar gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link to="/"><Button size="lg" variant="outline">Ver otros productos</Button></Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Hecho para dentistas</h2>
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
