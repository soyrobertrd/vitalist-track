import LandingShell, { VerticalConfig } from "@/components/landing/LandingShell";
import { Activity, BedDouble, Pill, FlaskConical, Stethoscope, Users, ShieldCheck, Heart, Microscope, AlertTriangle, ClipboardList, Truck } from "lucide-react";

const config: VerticalConfig = {
  slug: "clinica",
  name: "Clínicas y Hospitales",
  tagline: "hospitales, clínicas y centros de atención multinivel",
  hero: {
    eyebrow: "Hospital Suite",
    title: "El sistema operativo para tu hospital",
    subtitle: "Hospitalización, quirófano, UCI, urgencias, laboratorio, farmacia y todos los módulos clínicos integrados en una sola plataforma.",
    icon: Activity,
    accent: "bg-gradient-to-br from-primary/5 via-background to-blue-500/5",
  },
  pains: [
    { problem: "Pierdes tiempo entre 4 sistemas distintos para historia clínica, farmacia, laboratorio y facturación.", solution: "Una sola plataforma con todos los módulos hablando entre sí en tiempo real." },
    { problem: "El censo de camas siempre está desactualizado y los ingresos se demoran.", solution: "Mapa de camas en vivo, asignación con un click y alta hospitalaria con firma digital." },
    { problem: "Las órdenes médicas en papel se pierden y generan errores de medicación.", solution: "CPOE electrónico con alertas de alergias, interacciones y dosis incorrectas." },
    { problem: "No tienes visibilidad real de KPIs hospitalarios hasta fin de mes.", solution: "Centro de Comando con métricas operativas, clínicas y financieras en tiempo real." },
  ],
  modules: [
    { icon: BedDouble, title: "Hospitalización & UCI", desc: "Censo de camas, kardex, infusiones, signos vitales y rondas médicas." },
    { icon: Stethoscope, title: "Quirófano", desc: "Programación quirúrgica, checklist OMS, time-out y reportes operatorios." },
    { icon: AlertTriangle, title: "Urgencias & Triage", desc: "Triage Manchester, observación, código rojo/azul, transferencias." },
    { icon: Pill, title: "Farmacia & CPOE", desc: "Órdenes médicas electrónicas, dispensación unitaria y conciliación." },
    { icon: FlaskConical, title: "Laboratorio", desc: "Solicitudes, muestras, resultados, QC interno e interoperabilidad LIS." },
    { icon: Microscope, title: "Imagenología & DICOM", desc: "RIS/PACS integrado, visor DICOM, informes radiológicos firmados." },
    { icon: Heart, title: "Maternidad & Neonatología", desc: "Partograma, neonatos, vacunación y educación al alta." },
    { icon: Users, title: "Oncología & Quimio", desc: "Protocolos quimio, cálculos por superficie corporal, infusiones." },
    { icon: ClipboardList, title: "Banco de Sangre", desc: "Donantes, tipificación, pruebas cruzadas, trazabilidad de hemoderivados." },
    { icon: ShieldCheck, title: "Calidad & Acreditación", desc: "Indicadores JCI, eventos adversos, gestión de riesgos clínicos." },
    { icon: Truck, title: "Logística & Suministros", desc: "Inventario por servicio, compras, esterilización, mantenimiento." },
    { icon: Activity, title: "Telemedicina integrada", desc: "Consultas virtuales, salas seguras y receta electrónica." },
  ],
  workflow: [
    "Paciente ingresa por urgencias o admisión programada con verificación de seguro en línea.",
    "Médico hace órdenes electrónicas (CPOE) que llegan automáticamente a farmacia, lab e imagen.",
    "Enfermería administra medicación, registra signos vitales y completa rondas en el módulo móvil.",
    "Al alta: resumen clínico firmado digitalmente, receta electrónica y facturación lista.",
  ],
  benefits: [
    { metric: "−45%", label: "Errores de medicación con CPOE" },
    { metric: "+30%", label: "Rotación de camas" },
    { metric: "−60%", label: "Tiempo de facturación al alta" },
    { metric: "100%", label: "Trazabilidad clínica" },
  ],
  useCases: ["Hospitales generales", "Clínicas privadas", "Centros médicos", "Hospitales materno-infantiles", "Centros oncológicos", "Hospitales públicos", "Cadenas hospitalarias", "Centros de día"],
  testimonial: {
    quote: "Pasamos de 4 sistemas desconectados a una sola plataforma. La rotación de camas subió 32% en el primer trimestre.",
    author: "Dr. Roberto Méndez",
    role: "Director Médico, Clínica San Rafael",
  },
  pricingNote: "Planes desde $499/mes para clínicas pequeñas. Hospitales con tarifa por número de camas.",
};

export default function LandingClinica() {
  return <LandingShell config={config} />;
}
