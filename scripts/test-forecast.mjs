// Test runner directo en Node.js para motor de proyección estadística (Fase 7)

function calculateForecast(
  historical,
  horizon = 3,
  nextPeriodFormatter
) {
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

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += historical[i].valor;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const diffX = i - meanX;
    numerator += diffX * (historical[i].valor - meanY);
    denominator += diffX * diffX;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  let sumSqRes = 0;
  for (let i = 0; i < n; i++) {
    const fitted = slope * i + intercept;
    const res = historical[i].valor - fitted;
    sumSqRes += res * res;
  }
  const stdError = n > 2 ? Math.sqrt(sumSqRes / (n - 2)) : 0;

  const points = historical.map((h) => ({
    periodo: h.periodo,
    real: Math.round(h.valor * 10) / 10,
    esProyeccion: false,
  }));

  const lastIndex = n - 1;
  points[lastIndex].proyeccion = points[lastIndex].real;

  for (let step = 1; step <= horizon; step++) {
    const futureX = lastIndex + step;
    const projectedVal = Math.max(0, Math.round((slope * futureX + intercept) * 10) / 10);
    const label = nextPeriodFormatter
      ? nextPeriodFormatter(step)
      : `+${step}m`;

    const marginOfError = Math.round(1.96 * stdError * Math.sqrt(1 + 1 / n + Math.pow(futureX - meanX, 2) / (denominator || 1)) * 10) / 10;

    points.push({
      periodo: label,
      proyeccion: projectedVal,
      rangoMin: Math.max(0, Math.round((projectedVal - marginOfError) * 10) / 10),
      rangoMax: Math.round((projectedVal + marginOfError) * 10) / 10,
      esProyeccion: true,
    });
  }

  return {
    canForecast: true,
    slope: Math.round(slope * 1000) / 1000,
    intercept: Math.round(intercept * 1000) / 1000,
    stdError: Math.round(stdError * 1000) / 1000,
    points,
  };
}

function assert(condition, msg) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function testForecastEngine() {
  console.log('📈 Probando motor de proyección estadística (forecast.ts)...');

  // Caso 1: Menos de 4 puntos
  const smallSeries = [
    { periodo: 'Ene', valor: 10 },
    { periodo: 'Feb', valor: 20 },
    { periodo: 'Mar', valor: 30 },
  ];
  const resSmall = calculateForecast(smallSeries);
  assert(resSmall.canForecast === false, 'Debe rechazar series con menos de 4 puntos');
  console.log('  ✅ Serie corta (<4 puntos) rechazada correctamente');

  // Caso 2: Serie constante
  const constSeries = [
    { periodo: 'M1', valor: 50 },
    { periodo: 'M2', valor: 50 },
    { periodo: 'M3', valor: 50 },
    { periodo: 'M4', valor: 50 },
  ];
  const resConst = calculateForecast(constSeries, 3);
  assert(resConst.canForecast === true, 'Serie constante de 4 puntos debe proyectar');
  assert(Math.abs(resConst.slope) < 0.0001, 'Pendiente de serie constante debe ser 0');
  const proj1 = resConst.points.find((p) => p.esProyeccion);
  assert(proj1?.proyeccion === 50, 'Proyección de serie constante debe ser igual al valor');
  assert(Math.abs(resConst.stdError) < 0.0001, 'Error estándar de serie constante debe ser 0');
  console.log('  ✅ Serie constante proyecta exactamente plano con error 0');

  // Caso 3: Serie lineal perfecta (10, 20, 30, 40)
  const linearSeries = [
    { periodo: 'Sem 1', valor: 10 },
    { periodo: 'Sem 2', valor: 20 },
    { periodo: 'Sem 3', valor: 30 },
    { periodo: 'Sem 4', valor: 40 },
  ];
  const resLinear = calculateForecast(linearSeries, 2, (i) => `Sem ${4 + i}`);
  assert(resLinear.canForecast === true, 'Serie lineal debe proyectar');
  assert(Math.abs(resLinear.slope - 10) < 0.0001, 'Pendiente debe ser 10');
  const futurePoints = resLinear.points.filter((p) => p.esProyeccion);
  assert(futurePoints[0].proyeccion === 50, 'Sem 5 debe proyectar 50');
  assert(futurePoints[1].proyeccion === 60, 'Sem 6 debe proyectar 60');
  console.log('  ✅ Serie lineal proyecta 50 y 60 con precisión absoluta');

  // Caso 4: Serie con ruido
  const noisySeries = [
    { periodo: 'T1', valor: 12 },
    { periodo: 'T2', valor: 18 },
    { periodo: 'T3', valor: 15 },
    { periodo: 'T4', valor: 24 },
    { periodo: 'T5', valor: 22 },
  ];
  const resNoisy = calculateForecast(noisySeries, 3);
  assert(resNoisy.canForecast === true, 'Serie con ruido debe proyectar');
  assert(resNoisy.stdError > 0, 'Error estándar debe ser positivo');
  const noisyFuture = resNoisy.points.filter((p) => p.esProyeccion);
  assert(noisyFuture[0].rangoMax >= noisyFuture[0].rangoMin, 'Rango max >= min');
  console.log('  ✅ Serie con variabilidad calcula intervalos de confianza válidos');

  console.log('\n🎉 ¡TODOS LOS TESTS DE FORECAST PASARON EXITOSAMENTE!');
}

testForecastEngine().catch((err) => {
  console.error('\n❌ ERROR EN TEST FORECAST:', err);
  process.exit(1);
});
