import LandingShell, { VerticalConfig } from "@/components/landing/LandingShell";
import { Eye, Glasses, FileText, ShoppingBag, Calendar, BarChart3, Users, DollarSign, Camera, MessageSquare, ShieldCheck, Activity } from "lucide-react";

const config: VerticalConfig = {
  slug: "vision",
  name: "VisionCare Pro",
  tagline: "ópticas, clínicas oftalmológicas y consultorios optométricos",
  hero: {
    eyebrow: "VisionCare Pro",
    title: "Del examen a la venta del lente, sin papeles",
    subtitle: "Recetas oftálmicas, historial visual, agenda de exámenes especializados, tienda óptica con inventario y métricas comerciales.",
    icon: Eye,
    accent: "bg-gradient-to-br from-indigo-500/10 via-background to-blue-500/10",
  },
  pains: [
    { problem: "La receta se hace a mano y el paciente la pierde antes de comprar lente.", solution: "Receta digital firmada que llega al paciente por email/WhatsApp y al mostrador en un click." },
    { problem: "No sabes qué porcentaje de exámenes termina en venta de lente.", solution: "Métricas de conversión examen → venta por optómetra y por tipo de receta." },
    { problem: "El inventario de armaduras se descuadra y vendes lo que no tienes." , solution: "Inventario en tiempo real por sucursal con alertas de stock mínimo." },
    { problem: "No tienes histórico visual del paciente para comparar evolución.", solution: "Historial completo de graduaciones, exámenes y patologías con gráficas de tendencia." },
  ],
  modules: [
    { icon: Glasses, title: "Recetas oftálmicas digitales", desc: "Graduación monofocal, bifocal, progresiva, contactología, prismas." },
    { icon: FileText, title: "Historial visual", desc: "Evolución de agudeza visual, presión intraocular, fondo de ojo, patologías." },
    { icon: Calendar, title: "Agenda de exámenes", desc: "Topografía corneal, campimetría, OCT, biometría, paquimetría." },
    { icon: ShoppingBag, title: "Tienda óptica", desc: "Inventario de armaduras, lentes, contactos, líquidos y accesorios." },
    { icon: DollarSign, title: "Ventas & cuotas", desc: "Anticipo, financiamiento sin tarjeta, factura electrónica, ARS visual." },
    { icon: BarChart3, title: "Conversión & métricas", desc: "Examen → receta → venta. Margen por proveedor de lente y armadura." },
    { icon: Users, title: "Clientes recurrentes", desc: "Recordatorio de control anual, cambio de lente, reposición de contactos." },
    { icon: Camera, title: "Try-on virtual & catálogo", desc: "Catálogo de armaduras con precios y disponibilidad por sucursal." },
    { icon: MessageSquare, title: "WhatsApp marketing", desc: "Promos de armaduras, 2x1, control gratis, día del padre/madre." },
    { icon: ShieldCheck, title: "Multi-sucursal", desc: "Stock compartido, traslados entre tiendas, ranking de sucursales." },
    { icon: Activity, title: "Telemedicina ocular", desc: "Teleconsulta para controles simples y pre-screening." },
    { icon: ShoppingBag, title: "Pedidos a laboratorio", desc: "Envío automático de receta a laboratorio óptico, tracking del lente." },
  ],
  workflow: [
    "Paciente agenda examen → llega y el optómetra abre su histórico visual completo.",
    "Tras el examen se genera receta digital firmada que se envía al mostrador automáticamente.",
    "El asesor muestra armaduras compatibles del catálogo y arma el presupuesto.",
    "Pedido al laboratorio óptico, seguimiento del lente y aviso al paciente cuando está listo.",
  ],
  benefits: [
    { metric: "+38%", label: "Conversión examen → venta" },
    { metric: "−50%", label: "Errores de pedido al laboratorio" },
    { metric: "+22%", label: "Ticket promedio" },
    { metric: "0", label: "Recetas perdidas en papel" },
  ],
  useCases: ["Ópticas independientes", "Cadenas de ópticas", "Clínicas oftalmológicas", "Consultorios optométricos", "Centros de baja visión", "Contactología", "Cirugía refractiva", "Ópticas dentro de hospitales"],
  testimonial: {
    quote: "Antes vendíamos lente al 48% de los exámenes. Con la receta digital integrada al mostrador subimos al 71% en 4 meses.",
    author: "Lic. Andrés Martín",
    role: "Gerente, Óptica Visión Total",
  },
  pricingNote: "Desde $89/mes por sucursal. Multi-tienda con descuento por volumen.",
};

export default function LandingVision() {
  return <LandingShell config={config} />;
}
