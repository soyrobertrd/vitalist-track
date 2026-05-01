import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Activity, ArrowRight, Glasses, FileText, ShoppingBag, Calendar, BarChart3 } from "lucide-react";

const features = [
  { icon: Glasses, title: "Recetas oftálmicas", desc: "Graduaciones, lentes de contacto, prismáticos." },
  { icon: FileText, title: "Historial visual", desc: "Evolución de la agudeza visual y patologías oculares." },
  { icon: ShoppingBag, title: "Tienda óptica", desc: "Inventario de armaduras, lentes, contactos y accesorios." },
  { icon: Calendar, title: "Agenda de exámenes", desc: "Topografía, campimetría, OCT y revisiones de rutina." },
  { icon: BarChart3, title: "Ventas y métricas", desc: "Conversión receta → venta, márgenes por proveedor." },
];

export default function LandingVision() {
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
          <Eye className="h-4 w-4" /> VisionCare Pro
        </div>
        <h1 className="text-5xl font-bold mb-6 max-w-3xl mx-auto">
          Software para ópticas y clínicas oftálmicas
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Recetas, historial visual, exámenes, tienda óptica y métricas comerciales. Diseñado para optómetras y oftalmólogos.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth"><Button size="lg">Empezar gratis <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link to="/"><Button size="lg" variant="outline">Ver otros productos</Button></Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Visión completa de tu negocio</h2>
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
