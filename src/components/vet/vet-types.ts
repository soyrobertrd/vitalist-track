export type EspecieVet = "perro" | "gato" | "ave" | "conejo" | "reptil" | "roedor" | "equino" | "otro";

export const ESPECIES_VET: EspecieVet[] = ["perro", "gato", "ave", "conejo", "reptil", "roedor", "equino", "otro"];

export const ESPECIE_ICONOS: Record<string, string> = {
  perro: "🐶",
  gato: "🐱",
  ave: "🦜",
  conejo: "🐰",
  reptil: "🦎",
  roedor: "🐹",
  equino: "🐴",
  otro: "🐾",
};

export interface Mascota {
  id: string;
  paciente_id: string;
  nombre: string;
  especie: EspecieVet;
  raza: string;
  sexo: "macho" | "hembra";
  fecha_nacimiento: string;
  peso_kg: number;
  esterilizado: boolean;
  microchip?: string;
  color_pelaje?: string;
  tutor_nombre: string;
  tutor_telefono: string;
  tutor_email?: string;
  alergias_condiciones?: string;
}

export interface RegistroVacunaDesparasitacion {
  id: string;
  paciente_id: string;
  mascota_nombre: string;
  tipo: "vacuna" | "desparasitacion_interna" | "desparasitacion_externa";
  producto: string;
  fecha_aplicada: string;
  proxima_dosis: string;
  lote?: string;
  veterinario: string;
  observaciones?: string;
}

export interface ConsultaVeterinaria {
  id: string;
  paciente_id: string;
  mascota_nombre: string;
  especie: EspecieVet;
  fecha: string;
  veterinario: string;
  motivo: string;
  peso_kg: number;
  temperatura_c: number;
  frecuencia_cardiaca_lpm: number;
  frecuencia_respiratoria_rpm: number;
  tllc_segundos: number;
  mucosas: "rosadas" | "palidas" | "ictericas" | "cianoticas" | "congestivas";
  condicion_corporal: string;
  hidratacion: string;
  anamnesis: string;
  diagnostico: string;
  tratamiento_receta: string;
  estado: "completada" | "en_curso" | "revision";
}

export interface HospitalizacionCirugia {
  id: string;
  paciente_id: string;
  mascota_nombre: string;
  tipo_procedimiento: "cirugia" | "hospitalizacion" | "procedimiento";
  titulo: string;
  jaula_box?: string;
  fecha_ingreso: string;
  fecha_alta_estimada?: string;
  cirujano_veterinario: string;
  clasificacion_asa?: "ASA I" | "ASA II" | "ASA III" | "ASA IV" | "ASA V";
  tipo_anestesia?: string;
  fluidoterapia?: string;
  estado: "pre-quirurgico" | "en_quirofano" | "en_recuperacion" | "hospitalizado_estable" | "alta";
  notas_evolucion: string;
}

export interface GroomingServicio {
  id: string;
  paciente_id: string;
  mascota_nombre: string;
  tipo_servicio: "bano_corte" | "bano_medicado" | "corte_higienico" | "deslanado" | "spa_completo";
  estilista: string;
  temperamento: "docil" | "nervioso" | "miedoso" | "reactivo";
  servicios_adicionales: string[];
  fecha_hora: string;
  estado: "espera" | "en_bano" | "en_corte" | "listo_para_entrega" | "entregado";
  observaciones?: string;
}

export interface FarmacoDosisVet {
  id: string;
  nombre: string;
  categoria: string;
  indicacion: string;
  dosis_canina_mg_kg: number;
  dosis_felina_mg_kg: number;
  concentracion_default_mg_ml: number;
  vias: string;
  precauciones: string;
}

// Catálogo de fármacos de emergencia y uso diario en veterinaria
export const FARMACOS_VETERINARIOS: FarmacoDosisVet[] = [
  {
    id: "meloxicam",
    nombre: "Meloxicam",
    categoria: "AINE / Analgésico Antiinflamatorio",
    indicacion: "Dolor agudo, osteoartritis, analgesia postquirúrgica",
    dosis_canina_mg_kg: 0.2,
    dosis_felina_mg_kg: 0.1,
    concentracion_default_mg_ml: 5,
    vias: "SC / IV / Oral",
    precauciones: "No usar en animales deshidratados o con falla renal/hepática.",
  },
  {
    id: "amoxi_clav",
    nombre: "Amoxicilina + Ác. Clavulánico",
    categoria: "Antibiótico de amplio espectro",
    indicacion: "Infecciones dérmicas, respiratorias, urinarias y dentales",
    dosis_canina_mg_kg: 12.5,
    dosis_felina_mg_kg: 12.5,
    concentracion_default_mg_ml: 50,
    vias: "Oral / SC",
    precauciones: "Puede provocar emesis o heces blandas transitorias.",
  },
  {
    id: "enrofloxacina",
    nombre: "Enrofloxacina",
    categoria: "Fluoroquinolona / Antimicrobiano",
    indicacion: "Infecciones severas Gram-negativas, urogenitales y digestivas",
    dosis_canina_mg_kg: 5.0,
    dosis_felina_mg_kg: 5.0,
    concentracion_default_mg_ml: 50,
    vias: "IM / SC / Oral",
    precauciones: "Contraindicado en cachorros en fase de crecimiento (cartílago).",
  },
  {
    id: "tramadol",
    nombre: "Tramadol",
    categoria: "Opioide menor / Analgésico central",
    indicacion: "Dolor moderado a severo oncológico, traumatismos o cirugías",
    dosis_canina_mg_kg: 3.0,
    dosis_felina_mg_kg: 2.0,
    concentracion_default_mg_ml: 50,
    vias: "IV lento / IM / Oral",
    precauciones: "Monitorear sedación. En gatos puede causar disforia o salivación.",
  },
  {
    id: "metronidazol",
    nombre: "Metronidazol",
    categoria: "Antiprotozoario / Antibiótico anaerobios",
    indicacion: "Giardiasis, colitis bacteriana y diarrea aguda",
    dosis_canina_mg_kg: 15.0,
    dosis_felina_mg_kg: 12.0,
    concentracion_default_mg_ml: 5,
    vias: "IV infusión / Oral",
    precauciones: "Sabor amargo. Dosis altas prolongadas causan signos neurológicos.",
  },
  {
    id: "maropitant",
    nombre: "Maropitant (Cerenia)",
    categoria: "Antiemético / Antagonista NK1",
    indicacion: "Vómitos agudos, prevención de mareo por movimiento",
    dosis_canina_mg_kg: 1.0,
    dosis_felina_mg_kg: 1.0,
    concentracion_default_mg_ml: 10,
    vias: "SC / Oral",
    precauciones: "Mantener refrigerado para disminuir molestia en inyección SC.",
  },
  {
    id: "dexametasona",
    nombre: "Dexametasona",
    categoria: "Corticoesteroide de alta potencia",
    indicacion: "Shock anafiláctico, inflamación aguda, crisis alérgicas",
    dosis_canina_mg_kg: 0.15,
    dosis_felina_mg_kg: 0.15,
    concentracion_default_mg_ml: 2,
    vias: "IV / IM / SC",
    precauciones: "No combinar con AINEs (riesgo de úlceras gastrointestinales).",
  },
  {
    id: "furosemida",
    nombre: "Furosemida",
    categoria: "Diurético de asa",
    indicacion: "Edema pulmonar cardiogénico, insuficiencia cardíaca congestiva",
    dosis_canina_mg_kg: 2.0,
    dosis_felina_mg_kg: 1.5,
    concentracion_default_mg_ml: 50,
    vias: "IV / IM / Oral",
    precauciones: "Controlar electrolitos y función renal.",
  },
];
