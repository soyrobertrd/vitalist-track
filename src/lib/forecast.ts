/**
 * Módulo de proyección estadística simple para series temporales clínicas (Fase 7).
 * Utiliza regresión lineal por mínimos cuadrados y cálculo de bandas de confianza por desviación de residuos.
 */

export interface TimeSeriesPoint {
  periodo: string;
  real?: number;
  proyeccion?: number;
  rangoMin?: number;
  rangoMax?: number;
  esProyeccion?: boolean;
}

export interface ForecastResult {
  canForecast: boolean;
  slope: number;
  intercept: number;
  stdError: number;
  points: TimeSeriesPoint[];
  reason?: string;
}

/**
 * Calcula la proyección lineal para los próximos `horizon` periodos.
 * @param historical Serie cronológica de datos históricos conocidos.
 * @param horizon Número de periodos futuros a proyectar (por defecto 3).
 * @param nextPeriodFormatter Función para generar la etiqueta del siguiente periodo.
 */
export function calculateForecast(
  historical: { periodo: string; valor: number }[],
  horizon: number = 3,
  nextPeriodFormatter?: (index: number) => string
): ForecastResult {
  const n = historical.length;

  if (n < 4) {
    return {
      canForecast: false,
      slope: 0,
      intercept: 0,
      stdError: 0,
      points: historical.map((h) => ({
        periodo: h.periodo,
        real: h.valor,
        esProyeccion: false,
      })),
      reason: "Se requieren al menos 4 puntos históricos para proyectar con confianza.",
    };
  }

  // 1. Medias de X e Y
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += historical[i].valor;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // 2. Pendiente (slope) e Intercepto
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const diffX = i - meanX;
    numerator += diffX * (historical[i].valor - meanY);
    denominator += diffX * diffX;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // 3. Residuos y desviación estándar
  let sumSqRes = 0;
  for (let i = 0; i < n; i++) {
    const fitted = slope * i + intercept;
    const res = historical[i].valor - fitted;
    sumSqRes += res * res;
  }
  const stdError = n > 2 ? Math.sqrt(sumSqRes / (n - 2)) : 0;

  // 4. Construir puntos combinados (históricos + futuros)
  const points: TimeSeriesPoint[] = historical.map((h) => ({
    periodo: h.periodo,
    real: Math.round(h.valor * 10) / 10,
    esProyeccion: false,
  }));

  // En el último punto real, conectamos la proyección para continuidad visual en el gráfico
  const lastIndex = n - 1;
  points[lastIndex].proyeccion = points[lastIndex].real;

  for (let step = 1; step <= horizon; step++) {
    const futureX = lastIndex + step;
    const projectedVal = Math.max(0, Math.round((slope * futureX + intercept) * 10) / 10);
    const label = nextPeriodFormatter
      ? nextPeriodFormatter(step)
      : `+${step}m`;

    points.push({
      periodo: label,
      proyeccion: projectedVal,
      rangoMin: Math.max(0, Math.round((projectedVal - stdError) * 10) / 10),
      rangoMax: Math.round((projectedVal + stdError) * 10) / 10,
      esProyeccion: true,
    });
  }

  return {
    canForecast: true,
    slope,
    intercept,
    stdError,
    points,
  };
}
