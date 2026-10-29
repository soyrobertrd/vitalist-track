/**
 * Motor de Farmacovigilancia y Verificación de Interacciones Medicamentosas y Alergias en Tiempo Real
 * Basado en directrices de la FDA, ISMP y bases de datos farmacológicas estándar.
 */

export type SeveridadInteraccion = "critica" | "moderada" | "leve";

export interface InteraccionMedicamentosa {
  farmacoA: string;
  farmacoB: string;
  severidad: SeveridadInteraccion;
  mecanismo: string;
  efectoClinico: string;
  recomendacion: string;
}

export interface AlertaAlergia {
  farmaco: string;
  alergiaRegistrada: string;
  severidad: SeveridadInteraccion;
  mensaje: string;
}

export interface ResultadoFarmacovigilancia {
  tieneRiesgo: boolean;
  scoreMaximo: SeveridadInteraccion | "ninguno";
  interacciones: InteraccionMedicamentosa[];
  alertasAlergias: AlertaAlergia[];
}

// Catálogo curado de interacciones mayores frecuentes en hospitalización y urgencias
const BASE_INTERACCIONES: InteraccionMedicamentosa[] = [
  {
    farmacoA: "warfarina",
    farmacoB: "ibuprofeno",
    severidad: "critica",
    mecanismo: "Inhibición plaquetaria por AINE sumada a hipoprotrombinemia por anticoagulante oral.",
    efectoClinico: "Riesgo severo de hemorragia digestiva alta y sangrado mayor.",
    recomendacion: "Evitar AINEs. Usar Paracetamol para analgesia o cambiar a anticoagulante directo con monitoreo de INR.",
  },
  {
    farmacoA: "warfarina",
    farmacoB: "ketorolaco",
    severidad: "critica",
    mecanismo: "Potente antiinflamatorio con toxicidad gástrica directa + anticoagulación.",
    efectoClinico: "Riesgo crítico de hemorragia gastrointestinal letal.",
    recomendacion: "Contraindicación absoluta de Ketorolaco en pacientes anticoagulados.",
  },
  {
    farmacoA: "enalapril",
    farmacoB: "espironolactona",
    severidad: "moderada",
    mecanismo: "Doble bloqueo aldosterónico y retención de potasio renal.",
    efectoClinico: "Riesgo de hiperpotasemia grave (K+ > 6.0 mEq/L) y arritmias ventriculares.",
    recomendacion: "Monitorear potasio sérico y función renal a las 48h del inicio.",
  },
  {
    farmacoA: "nitroglicerina",
    farmacoB: "sildenafilo",
    severidad: "critica",
    mecanismo: "Potenciación de la vía GMPc / Óxido Nítrico.",
    efectoClinico: "Hipotensión refractaria severa, colapso cardiovascular y shock.",
    recomendacion: "Contraindicación absoluta. No administrar nitratos en las 24-48h post-inhibidor PDE5.",
  },
  {
    farmacoA: "ciprofloxacino",
    farmacoB: "teofilina",
    severidad: "moderada",
    mecanismo: "Inhibición enzimática del citocromo CYP1A2 por la quinolona.",
    efectoClinico: "Elevación de niveles de teofilina con riesgo de convulsiones y arritmias.",
    recomendacion: "Reducir dosis de teofilina al 50% o elegir Levofloxacino / Cefalosporina.",
  },
  {
    farmacoA: "amiodarona",
    farmacoB: "digoxina",
    severidad: "critica",
    mecanismo: "Inhibición de la glicoproteína P renal y aclaramiento de digoxina.",
    efectoClinico: "Intoxicación digitálica (bloqueo AV completo, xantopsias, náuseas).",
    recomendacion: "Reducir la dosis de digoxina a la mitad al iniciar amiodarona.",
  },
  {
    farmacoA: "tramadol",
    farmacoB: "sertralina",
    severidad: "moderada",
    mecanismo: "Efecto serotoninérgico sinérgico.",
    efectoClinico: "Síndrome serotoninérgico (hipertermia, mioclonías, agitación autonómica).",
    recomendacion: "Vigilar síntomas serotoninérgicos. Considerar analgesia alternativa no opioide.",
  },
  {
    farmacoA: "clopidogrel",
    farmacoB: "omeprazol",
    severidad: "moderada",
    mecanismo: "Competencia por bioactivación en el citocromo CYP2C19.",
    efectoClinico: "Disminución de la eficacia antiplaquetaria del clopidogrel con mayor riesgo de trombosis de stent.",
    recomendacion: "Sustituir omeprazol por Pantoprazol, que presenta mínima interacción con CYP2C19.",
  },
];

// Familias con reactividad alérgica cruzada
const GRUPOS_ALERGIAS: Record<string, string[]> = {
  penicilina: ["amoxicilina", "ampicilina", "piperacilina", "penicilina", "cefalotina", "ceftriaxona", "cefepime"],
  aines: ["ibuprofeno", "aspirina", "ketorolaco", "diclofenaco", "naproxeno", "meloxicam", "piroxicam"],
  sulfas: ["trimetoprima", "sulfametoxazol", "sulfadiazina", "furosemida"],
};

export function verificarFarmacovigilancia(
  farmacosPrescritos: string[],
  alergiasRegistradas: string[] = []
): ResultadoFarmacovigilancia {
  const normalizados = farmacosPrescritos.map(f => f.trim().toLowerCase());
  const alergiasNorm = alergiasRegistradas.map(a => a.trim().toLowerCase());

  const interaccionesEncontradas: InteraccionMedicamentosa[] = [];
  const alertasAlergias: AlertaAlergia[] = [];

  // 1. Detección de Alergias Cruzadas
  for (const farmaco of normalizados) {
    for (const alergia of alergiasNorm) {
      let coincide = farmaco.includes(alergia) || alergia.includes(farmaco);

      // Verificación de familias alérgicas
      for (const [familia, miembros] of Object.entries(GRUPOS_ALERGIAS)) {
        if (alergia.includes(familia)) {
          if (miembros.some(m => farmaco.includes(m))) {
            coincide = true;
          }
        }
      }

      if (coincide) {
        alertasAlergias.push({
          farmaco,
          alergiaRegistrada: alergia,
          severidad: "critica",
          mensaje: `El paciente tiene alergia registrada a "${alergia}". Riesgo alto de reacción anafiláctica al prescribir "${farmaco}".`,
        });
      }
    }
  }

  // 2. Detección de Interacciones entre pares de fármacos
  for (let i = 0; i < normalizados.length; i++) {
    for (let j = i + 1; j < normalizados.length; j++) {
      const fA = normalizados[i];
      const fB = normalizados[j];

      for (const interaccion of BASE_INTERACCIONES) {
        const coincide1 = fA.includes(interaccion.farmacoA) && fB.includes(interaccion.farmacoB);
        const coincide2 = fA.includes(interaccion.farmacoB) && fB.includes(interaccion.farmacoA);

        if (coincide1 || coincide2) {
          interaccionesEncontradas.push(interaccion);
        }
      }
    }
  }

  const tieneRiesgo = interaccionesEncontradas.length > 0 || alertasAlergias.length > 0;
  let scoreMaximo: SeveridadInteraccion | "ninguno" = "ninguno";

  if (alertasAlergias.length > 0 || interaccionesEncontradas.some(i => i.severidad === "critica")) {
    scoreMaximo = "critica";
  } else if (interaccionesEncontradas.some(i => i.severidad === "moderada")) {
    scoreMaximo = "moderada";
  } else if (interaccionesEncontradas.length > 0) {
    scoreMaximo = "leve";
  }

  return {
    tieneRiesgo,
    scoreMaximo,
    interacciones: interaccionesEncontradas,
    alertasAlergias,
  };
}
