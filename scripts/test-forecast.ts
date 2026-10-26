import { calculateForecast } from '../src/lib/forecast';

function assert(condition: boolean, msg: string) {
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
  assert(noisyFuture[0].rangoMax! >= noisyFuture[0].rangoMin!, 'Rango max >= min');
  console.log('  ✅ Serie con variabilidad calcula intervalos de confianza válidos');

  console.log('\n🎉 ¡TODOS LOS TESTS DE FORECAST PASARON EXITOSAMENTE!');
}

testForecastEngine().catch((err) => {
  console.error('\n❌ ERROR EN TEST FORECAST:', err);
  process.exit(1);
});
