import LandingShell, { VerticalConfig } from "@/components/landing/LandingShell";
import { BedDouble, ClipboardList, Heart, Pill, Calendar, MapPin, AlertTriangle, Activity, Users, MessageSquare, Camera, ShieldCheck } from "lucide-react";

const config: VerticalConfig = {
  slug: "recovery",
  name: "Recovery Care",
  tagline: "casas de recuperación, rehabilitación y cuidado prolongado",
  hero: {
    eyebrow: "Recovery Care",
    title: "Cuidado post-operatorio con trazabilidad completa",
    subtitle: "Para casas de recuperación, rehabilitación y cuidado prolongado. Funciona como producto independiente o integrado a tu clínica estética/hospital.",
    icon: BedDouble,
    accent: "bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10",
  },
  pains: [
    { problem: "Los enfermeros llevan turnos en cuadernos y se pierde información crítica.", solution: "Bitácora digital por paciente con cambio de turno estructurado y firma." },
    { problem: "No detectas a tiempo signos de complicación post-operatoria.", solution: "Alertas tempranas automáticas por desviaciones en signos vitales y evolución." },
    { problem: "El familiar llama todo el día pidiendo actualizaciones.", solution: "Portal del familiar con fotos, evolución y plan del día (con consentimiento)." },
    { problem: "Las clínicas que te refieren no ven cómo va su paciente.", solution: "Reportes automáticos al cirujano referente con evolución y fotos." },
  ],
  modules: [
    { icon: ClipboardList, title: "Plan de recuperación", desc: "Protocolo por etapa, objetivos diarios, actividades, restricciones." },
    { icon: Heart, title: "Cuidado post-operatorio", desc: "Curaciones programadas, drenajes, vendajes compresivos, control de heridas." },
    { icon: Activity, title: "Signos vitales & alertas", desc: "Toma estructurada, gráficas de tendencia y alertas automáticas." },
    { icon: Pill, title: "Medicación programada", desc: "Esquemas con horarios, dosis, vía y registro de administración." },
    { icon: Calendar, title: "Sesiones de terapia", desc: "Fisioterapia, drenaje linfático, terapia respiratoria, ocupacional." },
    { icon: AlertTriangle, title: "Detección temprana", desc: "Alertas por fiebre, hipotensión, taquicardia o desviaciones del plan." },
    { icon: Users, title: "Equipo multidisciplinario", desc: "Médico, enfermería, fisio, nutrición, psicología. Notas integradas." },
    { icon: MessageSquare, title: "Portal del familiar", desc: "Acceso seguro con fotos, evolución y horarios de visita." },
    { icon: Camera, title: "Evolución fotográfica", desc: "Registro diario de heridas, edema, postura. Comparativas." },
    { icon: ClipboardList, title: "Reportes al cirujano", desc: "Resumen automático periódico al médico que refirió al paciente." },
    { icon: MapPin, title: "Multi-locación", desc: "Funciona en casa propia, instalación independiente o anexo a tu clínica." },
    { icon: ShieldCheck, title: "Cumplimiento sanitario", desc: "Bitácoras auditables, consentimientos firmados, trazabilidad completa." },
  ],
  workflow: [
    "Paciente ingresa con plan post-operatorio definido por el cirujano referente.",
    "Enfermería ejecuta tomas, medicación y curaciones según protocolo con firma digital.",
    "Sistema detecta desviaciones y alerta al médico/cirujano automáticamente.",
    "Familiar y cirujano reciben actualizaciones diarias hasta el alta con resumen completo.",
  ],
  benefits: [
    { metric: "−65%", label: "Complicaciones detectadas a tiempo" },
    { metric: "+90%", label: "Satisfacción del familiar" },
    { metric: "+50%", label: "Referidos de cirujanos" },
    { metric: "100%", label: "Trazabilidad de cuidados" },
  ],
  useCases: ["Casas de recuperación post-quirúrgica", "Centros de rehabilitación", "Cuidado prolongado", "Recovery anexo a clínica estética", "Recovery anexo a hospital", "Hogares de adultos mayores", "Cuidados paliativos", "Recuperación deportiva"],
  testimonial: {
    quote: "Los cirujanos plásticos que antes nos referían 2 pacientes al mes ahora nos refieren 15. El reporte automático con fotos diarias hace toda la diferencia.",
    author: "Lic. Marisol Herrera",
    role: "Directora, Casa Recovery DR",
  },
  pricingNote: "Desde $89/mes por cama. Add-on al plan de Aesthetic Pro u Hospital Suite.",
};

export default function LandingRecovery() {
  return <LandingShell config={config} />;
}
