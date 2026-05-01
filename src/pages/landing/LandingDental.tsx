import LandingShell, { VerticalConfig } from "@/components/landing/LandingShell";
import { CircleDot, SmilePlus, Calendar, FileText, DollarSign, Camera, Users, MessageSquare, ShoppingBag, BarChart3, Clock, ShieldCheck } from "lucide-react";

const config: VerticalConfig = {
  slug: "dental",
  name: "DentalCare Pro",
  tagline: "clínicas dentales y consultorios odontológicos",
  hero: {
    eyebrow: "DentalCare Pro",
    title: "Software dental que tus pacientes notarán",
    subtitle: "Odontograma digital, agenda multi-sillón, presupuestos por fases, imágenes RX y facturación. Todo conectado.",
    icon: CircleDot,
    accent: "bg-gradient-to-br from-cyan-500/10 via-background to-primary/5",
  },
  pains: [
    { problem: "Los presupuestos se hacen en Excel y se pierden entre correos.", solution: "Presupuestos por fases con aprobación digital del paciente y seguimiento del estado." },
    { problem: "El odontograma en papel no permite comparar evolución entre visitas.", solution: "Odontograma interactivo con histórico por pieza y comparativas visuales." },
    { problem: "Los pacientes no llegan a la cita y pierdes el sillón.", solution: "Recordatorios automáticos por WhatsApp 48h y 2h antes con confirmación interactiva." },
    { problem: "No sabes qué tratamientos generan más margen.", solution: "Dashboard de rentabilidad por procedimiento, doctor y especialidad." },
  ],
  modules: [
    { icon: SmilePlus, title: "Odontograma digital", desc: "32 piezas con 5 caras cada una. Histórico interactivo y código de colores." },
    { icon: Calendar, title: "Agenda multi-sillón", desc: "Asigna sillón, doctor y asistente. Bloqueos por mantenimiento." },
    { icon: FileText, title: "Presupuestos por fases", desc: "Divide tratamientos largos en etapas con aprobación y financiamiento." },
    { icon: Camera, title: "Imágenes RX & fotos", desc: "Almacén de RX panorámicas, periapicales, fotos intraorales y antes/después." },
    { icon: DollarSign, title: "Facturación & ARS", desc: "Cuotas, anticipos, ARS odontológicas, factura electrónica." },
    { icon: Users, title: "Especialistas & referidos", desc: "Endodoncia, ortodoncia, cirugía. Comisiones por especialista." },
    { icon: MessageSquare, title: "Recordatorios WhatsApp", desc: "Confirmación 48h/2h antes, follow-up post tratamiento, control mensual." },
    { icon: ShoppingBag, title: "Inventario dental", desc: "Materiales, instrumental, control de lotes y vencimientos." },
    { icon: BarChart3, title: "Reportes ejecutivos", desc: "Producción, cobros, ranking de doctores, conversión de presupuestos." },
    { icon: Clock, title: "Lista de espera inteligente", desc: "Llena huecos automáticamente cuando hay cancelaciones." },
    { icon: ShieldCheck, title: "Consentimientos firmados", desc: "Firma digital del paciente, cumplimiento HIPAA/GDPR." },
    { icon: Camera, title: "Antes/Después", desc: "Galería para mostrar resultados y cerrar ventas estéticas." },
  ],
  workflow: [
    "Paciente agenda online o por WhatsApp eligiendo doctor y sillón disponible.",
    "Llega a la consulta y el doctor abre su odontograma digital con todo el histórico.",
    "Se genera presupuesto por fases que el paciente aprueba digitalmente al instante.",
    "Cobro con factura electrónica, próxima cita programada y recordatorio automático.",
  ],
  benefits: [
    { metric: "−70%", label: "Inasistencias con WhatsApp" },
    { metric: "+40%", label: "Aprobación de presupuestos" },
    { metric: "+25%", label: "Producción por sillón" },
    { metric: "<5min", label: "En cobrar y agendar próxima" },
  ],
  useCases: ["Consultorio individual", "Clínicas dentales", "Cadenas odontológicas", "Ortodoncia", "Implantología", "Estética dental", "Odontopediatría", "Clínicas universitarias"],
  testimonial: {
    quote: "El odontograma digital y los recordatorios por WhatsApp redujeron mis no-shows del 22% al 6%. Eso son 3 sillones extra al día.",
    author: "Dra. Carolina Reyes",
    role: "Directora, Clínica Dental Sonrisa+",
  },
  pricingNote: "Desde $79/mes por doctor. Planes ilimitados para clínicas con varios sillones.",
};

export default function LandingDental() {
  return <LandingShell config={config} />;
}
