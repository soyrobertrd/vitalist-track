import {
  AlertOctagon,
  Zap,
  Clock,
  Activity,
} from "lucide-react";

export type NivelManchester = 1 | 2 | 3 | 4 | 5;

export interface InfoNivelMTS {
  nivel: NivelManchester;
  codigoColor: string;
  nombre: string;
  tiempoMaxMin: number;
  badgeClass: string;
  cardBorder: string;
  bgLight: string;
  icono: any;
  prioridadTexto: string;
}

export const CONFIG_MANCHESTER: Record<NivelManchester, InfoNivelMTS> = {
  1: {
    nivel: 1,
    codigoColor: "rojo",
    nombre: "Nivel 1 - Reanimación (STAT)",
    tiempoMaxMin: 0,
    badgeClass: "bg-red-600 text-white border-red-700 animate-pulse",
    cardBorder: "border-red-500/60 dark:border-red-500/40",
    bgLight: "bg-red-500/10",
    icono: AlertOctagon,
    prioridadTexto: "Inmediata / Cero demora",
  },
  2: {
    nivel: 2,
    codigoColor: "naranja",
    nombre: "Nivel 2 - Muy Urgente",
    tiempoMaxMin: 10,
    badgeClass: "bg-orange-500 text-white border-orange-600",
    cardBorder: "border-orange-500/50 dark:border-orange-500/30",
    bgLight: "bg-orange-500/10",
    icono: Zap,
    prioridadTexto: "≤ 10 minutos",
  },
  3: {
    nivel: 3,
    codigoColor: "amarillo",
    nombre: "Nivel 3 - Urgente",
    tiempoMaxMin: 60,
    badgeClass: "bg-amber-400 text-slate-950 border-amber-500 font-semibold",
    cardBorder: "border-amber-500/40 dark:border-amber-500/20",
    bgLight: "bg-amber-500/10",
    icono: Clock,
    prioridadTexto: "≤ 60 minutos",
  },
  4: {
    nivel: 4,
    codigoColor: "verde",
    nombre: "Nivel 4 - Poco Urgente",
    tiempoMaxMin: 120,
    badgeClass: "bg-emerald-600 text-white border-emerald-700",
    cardBorder: "border-emerald-500/40 dark:border-emerald-500/20",
    bgLight: "bg-emerald-500/10",
    icono: Activity,
    prioridadTexto: "≤ 120 minutos",
  },
  5: {
    nivel: 5,
    codigoColor: "azul",
    nombre: "Nivel 5 - No Urgente",
    tiempoMaxMin: 240,
    badgeClass: "bg-blue-600 text-white border-blue-700",
    cardBorder: "border-blue-500/40 dark:border-blue-500/20",
    bgLight: "bg-blue-500/10",
    icono: Clock,
    prioridadTexto: "≤ 240 minutos",
  },
};

export interface PacienteUrgencias {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  motivo_consulta: string;
  flujograma: string;
  discriminador: string;
  nivel: NivelManchester;
  hora_llegada: string;
  hora_triage: string;
  estado: "en_espera" | "en_atencion" | "observacion" | "egresado";
  box_asignado?: string;
  signos_vitales: {
    ta: string;
    fc: number;
    fr: number;
    spo2: number;
    temp: number;
    eva: number;
    glasgow: number;
    glicemia?: number;
  };
  observaciones?: string;
  activacion_alerta?: "codigo_azul" | "codigo_trauma" | null;
}

export const FLUJOGRAMAS_MTS = [
  {
    id: "dolor_toracico",
    nombre: "Dolor Torácico en Adultos",
    discriminadores: [
      { texto: "Paro o dolor con hipotensión / shock / diaforesis fría", nivel: 1 },
      { texto: "Dolor opresivo retroesternal con irradiación típica a brazo/mandíbula", nivel: 2 },
      { texto: "Dolor pleurítico o punzante sin compromiso hemodinámico (EVA 6-8)", nivel: 3 },
      { texto: "Dolor osteomuscular reproducible a la palpación", nivel: 4 },
    ],
  },
  {
    id: "dificultad_respiratoria",
    nombre: "Dificultad Respiratoria / Disnea",
    discriminadores: [
      { texto: "Obstrucción de vía aérea / Estridor / Bradipnea < 8 rpm", nivel: 1 },
      { texto: "Disnea severa / Imposibilidad de hablar frases / SatO2 < 90%", nivel: 2 },
      { texto: "Disnea moderada / Sibilancias audibles / SatO2 91-94%", nivel: 3 },
      { texto: "Tos o congestión nasal sin dificultad ventilatoria / SatO2 > 95%", nivel: 4 },
    ],
  },
  {
    id: "trauma_mayor",
    nombre: "Traumatismo / Politraumatizado",
    discriminadores: [
      { texto: "Hemorragia exanguinante masiva / Trauma torácico inestable", nivel: 1 },
      { texto: "Amputación traumática / Fractura abierta con pulsos débiles / Glasgow < 13", nivel: 2 },
      { texto: "Deformidad evidente en extremidad cerrada con pulso distal presente", nivel: 3 },
      { texto: "Contusión o esguince con dolor leve a moderado", nivel: 4 },
    ],
  },
  {
    id: "neurologico",
    nombre: "Déficit Neurológico / Cefalea / Convulsión",
    discriminadores: [
      { texto: "Convulsión activa continua (Status) / Coma Glasgow ≤ 8", nivel: 1 },
      { texto: "Sospecha ACV agudo (<4.5h) con asimetría facial o hemiparesia", nivel: 2 },
      { texto: "Cefalea intensa súbita sin signos meníngeos (EVA 7-8)", nivel: 3 },
      { texto: "Cefalea crónica habitual o mareo sin inestabilidad", nivel: 4 },
    ],
  },
  {
    id: "dolor_abdominal",
    nombre: "Dolor Abdominal Agudo",
    discriminadores: [
      { texto: "Abdomen agudo en tabla con shock séptico / peritonítico", nivel: 1 },
      { texto: "Dolor abdominal severo intratable (EVA 9-10) con vómitos incoercibles", nivel: 2 },
      { texto: "Dolor localizado en FID / Murphy positivo (EVA 5-8)", nivel: 3 },
      { texto: "Cólico gastrointestinal difuso de baja intensidad", nivel: 4 },
      { texto: "Constipación crónica de días de evolución", nivel: 5 },
    ],
  },
];

export const BOXES_URGENCIAS = [
  { id: "SHOCK-1", nombre: "Box Reanimación 1 (Shock Room)", tipo: "critico", ocupadoPor: "José Tavárez (STAT)" },
  { id: "SHOCK-2", nombre: "Box Reanimación 2", tipo: "critico", ocupadoPor: null },
  { id: "BOX-1", nombre: "Box Crítico 1", tipo: "agudos", ocupadoPor: "Mercedes Almonte" },
  { id: "BOX-2", nombre: "Box Crítico 2", tipo: "agudos", ocupadoPor: null },
  { id: "BOX-3", nombre: "Box Observación 3", tipo: "observacion", ocupadoPor: "Manuel Reyes" },
  { id: "BOX-4", nombre: "Box Observación 4", tipo: "observacion", ocupadoPor: null },
  { id: "TOPICO-1", nombre: "Tópico de Suturas / Yesos", tipo: "rapido", ocupadoPor: "Laura Pimentel" },
  { id: "FILTRO-1", nombre: "Consulta Rápida / Filtro", tipo: "rapido", ocupadoPor: null },
];

export const PACIENTES_INICIALES: PacienteUrgencias[] = [
  {
    id: "URG-2026-001",
    paciente_nombre: "José Tavárez Grullón",
    edad_sexo: "54a / M",
    motivo_consulta: "Dolor precordial opresivo con irradiación a mandíbula y shock",
    flujograma: "Dolor Torácico en Adultos",
    discriminador: "Paro o dolor con hipotensión / shock / diaforesis fría",
    nivel: 1,
    hora_llegada: new Date(Date.now() - 6 * 60000).toISOString(),
    hora_triage: new Date(Date.now() - 5 * 60000).toISOString(),
    estado: "en_atencion",
    box_asignado: "Box Reanimación 1 (Shock Room)",
    signos_vitales: { ta: "80/45", fc: 132, fr: 28, spo2: 89, temp: 35.8, eva: 10, glasgow: 12, glicemia: 110 },
    observaciones: "Electrocardiograma STAT: Elevación ST en DII, DIII, aVF (Infarto Inferior). Código Azul activado.",
    activacion_alerta: "codigo_azul",
  },
  {
    id: "URG-2026-002",
    paciente_nombre: "Mercedes Almonte Cruz",
    edad_sexo: "68a / F",
    motivo_consulta: "Pérdida de fuerza en hemicuerpo derecho de 45 minutos de evolución",
    flujograma: "Déficit Neurológico / Cefalea / Convulsión",
    discriminador: "Sospecha ACV agudo (<4.5h) con asimetría facial o hemiparesia",
    nivel: 2,
    hora_llegada: new Date(Date.now() - 14 * 60000).toISOString(),
    hora_triage: new Date(Date.now() - 11 * 60000).toISOString(),
    estado: "en_atencion",
    box_asignado: "Box Crítico 1",
    signos_vitales: { ta: "185/105", fc: 94, fr: 18, spo2: 96, temp: 36.7, eva: 4, glasgow: 14, glicemia: 135 },
    observaciones: "Ventana terapéutica ACV abierta. TAC de cráneo simple urgente solicitada sin contraste.",
    activacion_alerta: null,
  },
  {
    id: "URG-2026-003",
    paciente_nombre: "Carlos Daniel Santana",
    edad_sexo: "29a / M",
    motivo_consulta: "Dolor abdominal intenso en fosa ilíaca derecha de 18 horas de evolución",
    flujograma: "Dolor Abdominal Agudo",
    discriminador: "Dolor localizado en FID / Murphy positivo (EVA 5-8)",
    nivel: 3,
    hora_llegada: new Date(Date.now() - 38 * 60000).toISOString(),
    hora_triage: new Date(Date.now() - 32 * 60000).toISOString(),
    estado: "en_espera",
    box_asignado: undefined,
    signos_vitales: { ta: "120/75", fc: 102, fr: 20, spo2: 98, temp: 38.3, eva: 7, glasgow: 15 },
    observaciones: "Signo de Blumberg dudoso. Hemograma y ecografía abdominal en proceso.",
    activacion_alerta: null,
  },
  {
    id: "URG-2026-004",
    paciente_nombre: "Laura Pimentel Rosario",
    edad_sexo: "22a / F",
    motivo_consulta: "Corte superficial en antebrazo derecho con vidrio de cocina",
    flujograma: "Traumatismo / Politraumatizado",
    discriminador: "Contusión o esguince con dolor leve a moderado",
    nivel: 4,
    hora_llegada: new Date(Date.now() - 52 * 60000).toISOString(),
    hora_triage: new Date(Date.now() - 48 * 60000).toISOString(),
    estado: "en_atencion",
    box_asignado: "Tópico de Suturas / Yesos",
    signos_vitales: { ta: "115/70", fc: 78, fr: 16, spo2: 99, temp: 36.5, eva: 3, glasgow: 15 },
    observaciones: "Herida limpia de 3 cm. No compromete tendones ni paquete vasculonervioso.",
    activacion_alerta: null,
  },
  {
    id: "URG-2026-005",
    paciente_nombre: "Manuel Reyes Méndez",
    edad_sexo: "45a / M",
    motivo_consulta: "Crisis asmática moderada con sibilancias espiratorias difusas",
    flujograma: "Dificultad Respiratoria / Disnea",
    discriminador: "Disnea moderada / Sibilancias audibles / SatO2 91-94%",
    nivel: 3,
    hora_llegada: new Date(Date.now() - 25 * 60000).toISOString(),
    hora_triage: new Date(Date.now() - 20 * 60000).toISOString(),
    estado: "en_atencion",
    box_asignado: "Box Observación 3",
    signos_vitales: { ta: "135/85", fc: 110, fr: 24, spo2: 92, temp: 36.8, eva: 5, glasgow: 15 },
    observaciones: "Iniciadas nebulizaciones seriadas con Salbutamol + Ipratropio y corticoide IV.",
    activacion_alerta: null,
  },
];
