import LandingShell, { VerticalConfig } from "@/components/landing/LandingShell";
import { Sparkles, Camera, Calendar, Heart, Target, Users, MessageSquare, DollarSign, Gift, Star, ShieldCheck, BarChart3 } from "lucide-react";

const config: VerticalConfig = {
  slug: "aesthetic",
  name: "Aesthetic Pro",
  tagline: "clínicas estéticas, spas médicos y centros de belleza",
  hero: {
    eyebrow: "Aesthetic Pro",
    title: "Convierte cada paciente en cliente VIP de por vida",
    subtitle: "Fichas estéticas, before/after, paquetes de sesiones, CRM con segmentación VIP y opcional Recovery integrado para post-operatorio.",
    icon: Sparkles,
    accent: "bg-gradient-to-br from-pink-500/10 via-background to-purple-500/10",
  },
  pains: [
    { problem: "No tienes una galería ordenada de antes/después por paciente.", solution: "Galería visual cronológica con comparativas lado a lado y permisos de uso firmados." },
    { problem: "Los paquetes de sesiones se llevan en una libreta y pierdes control.", solution: "Bonos de sesiones con descuento y contador automático de usos restantes." },
    { problem: "Tus mejores clientes no se sienten especiales.", solution: "Programa VIP con niveles bronce/plata/oro/platino, beneficios automáticos y campañas exclusivas." },
    { problem: "Después de un procedimiento estético no haces seguimiento al post-operatorio.", solution: "Módulo Recovery integrado: protocolos, control de evolución y alertas tempranas." },
  ],
  modules: [
    { icon: Heart, title: "Fichas estéticas", desc: "Evaluación facial, corporal, mapeo de zonas a tratar y plan personalizado." },
    { icon: Camera, title: "Galería before/after", desc: "Comparativas visuales con consentimiento de uso para marketing." },
    { icon: Calendar, title: "Paquetes y bonos", desc: "Sesiones agrupadas, suscripciones mensuales y planes anuales." },
    { icon: Target, title: "CRM con segmentación", desc: "Lead → cliente → VIP. Campañas dirigidas por perfil de valor." },
    { icon: Star, title: "Programa VIP / Loyalty", desc: "Puntos, descuentos, niveles y beneficios exclusivos automáticos." },
    { icon: Users, title: "Recovery integrado", desc: "Conecta directo con post-operatorio si ofreces casa de recuperación." },
    { icon: MessageSquare, title: "WhatsApp & email", desc: "Recordatorios pre-sesión, cuidados post, cumpleaños y promos VIP." },
    { icon: DollarSign, title: "Cobros & financiamiento", desc: "Cuotas sin tarjeta, tarjeta de crédito, transferencia, factura electrónica." },
    { icon: Gift, title: "Referidos & comisiones", desc: "Cliente refiere → recibe beneficio. Empleado vende → recibe comisión." },
    { icon: BarChart3, title: "Rentabilidad por servicio", desc: "Margen real por tratamiento, ranking de profesionales, ROI de campañas." },
    { icon: ShieldCheck, title: "Consentimientos firmados", desc: "Firma digital legal para cada procedimiento, archivo seguro." },
    { icon: Camera, title: "Inventario de productos", desc: "Cremas, ácidos, tóxico botulínico, hilos. Control de lote y caducidad." },
  ],
  workflow: [
    "Lead llega por Instagram → entra al CRM y se le agenda valoración gratuita.",
    "En consulta se hace ficha estética, fotos before y propuesta de paquete con financiamiento.",
    "Cada sesión descuenta del bono, se toma foto de evolución y se programa la siguiente.",
    "Tras el último tratamiento entra al programa VIP con seguimiento Recovery si aplica.",
  ],
  benefits: [
    { metric: "+55%", label: "Conversión lead → cliente" },
    { metric: "+3.2x", label: "Ticket anual de cliente VIP" },
    { metric: "−80%", label: "Olvidos de cuidados post" },
    { metric: "92%", label: "Retención a 12 meses" },
  ],
  useCases: ["Medicina estética", "Spas médicos", "Centros de depilación láser", "Cirugía plástica", "Tricología", "Tratamientos corporales", "Cosmiatría", "Wellness premium"],
  testimonial: {
    quote: "Los paquetes con bonos y el programa VIP triplicaron el ticket anual de mis mejores clientas. Ya no es 'una sesión cada tanto', es relación de por vida.",
    author: "Dra. Valentina Ortiz",
    role: "Fundadora, Aesthetic House",
  },
  pricingNote: "Desde $119/mes. Recovery integrado disponible como add-on.",
};

export default function LandingAesthetic() {
  return <LandingShell config={config} />;
}
