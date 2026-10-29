/**
 * Calculador de Escala de Alerta Temprana Nacional (NEWS2 - National Early Warning Score)
 * Estándar clínico del Royal College of Physicians (RCP) para detección temprana de deterioro fisiológico.
 */

export interface ParametrosNEWS2 {
  frecuenciaRespiratoria?: number; // rpm
  saturacionO2?: number;          // %
  oxigenoSuplementario?: boolean;  // Aire ambiente (false) o con O2 (true)
  presionSistolica?: number;      // mmHg
  frecuenciaCardiaca?: number;     // lpm
  nivelConsciencia?: "A" | "V" | "P" | "U"; // Alert, Voice, Pain, Unresponsive
  temperatura?: number;           // °C
  hipercapnica?: boolean;         // Escala 2 para fallo respiratorio hipercápnico (EPOC)
}

export type NivelRiesgoNEWS2 = "bajo" | "medio" | "alto";

export interface ResultadoNEWS2 {
  scoreTotal: number;
  nivelRiesgo: NivelRiesgoNEWS2;
  colorHex: string;
  badgeLabel: string;
  respuestaClinica: string;
  frecuenciaMonitoreo: string;
  detalles: {
    frecuenciaRespiratoria: number;
    saturacionO2: number;
    oxigenoSuplementario: number;
    presionSistolica: number;
    frecuenciaCardiaca: number;
    nivelConsciencia: number;
    temperatura: number;
  };
}

export function calcularNEWS2(params: ParametrosNEWS2): ResultadoNEWS2 {
  let scoreFR = 0;
  if (params.frecuenciaRespiratoria !== undefined) {
    const fr = params.frecuenciaRespiratoria;
    if (fr <= 8) scoreFR = 3;
    else if (fr >= 9 && fr <= 11) scoreFR = 1;
    else if (fr >= 12 && fr <= 20) scoreFR = 0;
    else if (fr >= 21 && fr <= 24) scoreFR = 2;
    else if (fr >= 25) scoreFR = 3;
  }

  let scoreSpO2 = 0;
  if (params.saturacionO2 !== undefined) {
    const sat = params.saturacionO2;
    if (!params.hipercapnica) {
      // Escala estándar 1
      if (sat <= 91) scoreSpO2 = 3;
      else if (sat === 92 || sat === 93) scoreSpO2 = 2;
      else if (sat === 94 || sat === 95) scoreSpO2 = 1;
      else if (sat >= 96) scoreSpO2 = 0;
    } else {
      // Escala 2 (EPOC hipercápnico)
      if (sat <= 83) scoreSpO2 = 3;
      else if (sat === 84 || sat === 85) scoreSpO2 = 2;
      else if (sat === 86 || sat === 87) scoreSpO2 = 1;
      else if (sat >= 88 && sat <= 92) scoreSpO2 = 0;
      else if (sat === 93 || sat === 94) scoreSpO2 = 1;
      else if (sat === 95 || sat === 96) scoreSpO2 = 2;
      else if (sat >= 97) scoreSpO2 = 3;
    }
  }

  let scoreO2 = 0;
  if (params.oxigenoSuplementario) {
    scoreO2 = 2;
  }

  let scoreTA = 0;
  if (params.presionSistolica !== undefined) {
    const pas = params.presionSistolica;
    if (pas <= 90) scoreTA = 3;
    else if (pas >= 91 && pas <= 100) scoreTA = 2;
    else if (pas >= 101 && pas <= 110) scoreTA = 1;
    else if (pas >= 111 && pas <= 219) scoreTA = 0;
    else if (pas >= 220) scoreTA = 3;
  }

  let scoreFC = 0;
  if (params.frecuenciaCardiaca !== undefined) {
    const fc = params.frecuenciaCardiaca;
    if (fc <= 40) scoreFC = 3;
    else if (fc >= 41 && fc <= 50) scoreFC = 1;
    else if (fc >= 51 && fc <= 90) scoreFC = 0;
    else if (fc >= 91 && fc <= 110) scoreFC = 1;
    else if (fc >= 111 && fc <= 130) scoreFC = 2;
    else if (fc >= 131) scoreFC = 3;
  }

  let scoreConsciencia = 0;
  if (params.nivelConsciencia) {
    scoreConsciencia = params.nivelConsciencia === "A" ? 0 : 3;
  }

  let scoreTemp = 0;
  if (params.temperatura !== undefined) {
    const t = params.temperatura;
    if (t <= 35.0) scoreTemp = 3;
    else if (t >= 35.1 && t <= 36.0) scoreTemp = 1;
    else if (t >= 36.1 && t <= 38.0) scoreTemp = 0;
    else if (t >= 38.1 && t <= 39.0) scoreTemp = 1;
    else if (t >= 39.1) scoreTemp = 2;
  }

  const scoreTotal =
    scoreFR + scoreSpO2 + scoreO2 + scoreTA + scoreFC + scoreConsciencia + scoreTemp;

  // Clasificación de Riesgo según directrices RCP
  let nivelRiesgo: NivelRiesgoNEWS2 = "bajo";
  let colorHex = "#10b981"; // emerald
  let badgeLabel = "Riesgo Bajo (0-4)";
  let respuestaClinica =
    "Manejo habitual de piso por enfermería. Continuar con monitoreo rutinario.";
  let frecuenciaMonitoreo = "Mínimo cada 12 horas";

  // Alerta si un solo parámetro da 3 o el total es 5-6
  const tienePuntajeExtremoIndividual =
    scoreFR === 3 ||
    scoreSpO2 === 3 ||
    scoreTA === 3 ||
    scoreFC === 3 ||
    scoreConsciencia === 3 ||
    scoreTemp === 3;

  if (scoreTotal >= 7) {
    nivelRiesgo = "alto";
    colorHex = "#ef4444"; // red
    badgeLabel = "Riesgo Alto (≥ 7) - Emergencia";
    respuestaClinica =
      "Alerta inmediata al equipo de respuesta rápida / médico de guardia / UCI. Monitoreo continuo y evaluación urgente.";
    frecuenciaMonitoreo = "Monitoreo continuo / Horario";
  } else if (scoreTotal >= 5 || tienePuntajeExtremoIndividual) {
    nivelRiesgo = "medio";
    colorHex = "#f59e0b"; // amber
    badgeLabel = tienePuntajeExtremoIndividual && scoreTotal < 5
      ? `Riesgo Medio (Score 3 individual)`
      : `Riesgo Medio (${scoreTotal})`;
    respuestaClinica =
      "Revisión urgente por médico tratante o enfermera supervisora. Determinar si requiere escalamiento.";
    frecuenciaMonitoreo = "Mínimo cada 4 a 6 horas";
  }

  return {
    scoreTotal,
    nivelRiesgo,
    colorHex,
    badgeLabel,
    respuestaClinica,
    frecuenciaMonitoreo,
    detalles: {
      frecuenciaRespiratoria: scoreFR,
      saturacionO2: scoreSpO2,
      oxigenoSuplementario: scoreO2,
      presionSistolica: scoreTA,
      frecuenciaCardiaca: scoreFC,
      nivelConsciencia: scoreConsciencia,
      temperatura: scoreTemp,
    },
  };
}
