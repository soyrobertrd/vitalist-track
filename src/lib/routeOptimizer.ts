/**
 * Optimizador de rutas para visitas domiciliarias.
 * Implementa nearest-neighbor TSP — suficiente para 10-30 paradas por día.
 */

export interface VisitaPunto {
  id: string;
  paciente: string;
  zona: string | null;
  barrio: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  hora: string; // ISO
  motivo: string;
}

export interface RutaOptimizada {
  zona: string;
  paradas: VisitaPunto[];
  distanciaTotalKm: number;
}

// Haversine en km
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Agrupa visitas por zona y dentro de cada zona ordena por proximidad
 * usando el algoritmo nearest-neighbor partiendo del punto más al norte.
 */
export function optimizarRutas(visitas: VisitaPunto[]): RutaOptimizada[] {
  const porZona = new Map<string, VisitaPunto[]>();
  for (const v of visitas) {
    const key = v.zona || "Sin zona";
    if (!porZona.has(key)) porZona.set(key, []);
    porZona.get(key)!.push(v);
  }

  const result: RutaOptimizada[] = [];
  for (const [zona, lista] of porZona) {
    const conCoords = lista.filter((v) => v.latitud != null && v.longitud != null);
    const sinCoords = lista.filter((v) => v.latitud == null || v.longitud == null);

    if (conCoords.length === 0) {
      result.push({ zona, paradas: lista, distanciaTotalKm: 0 });
      continue;
    }

    // Punto inicial = el más al norte (mayor latitud)
    const restantes = [...conCoords];
    restantes.sort((a, b) => (b.latitud! - a.latitud!));
    const ordenadas: VisitaPunto[] = [restantes.shift()!];
    let dist = 0;

    while (restantes.length > 0) {
      const ult = ordenadas[ordenadas.length - 1];
      let mejorIdx = 0;
      let mejorDist = Infinity;
      for (let i = 0; i < restantes.length; i++) {
        const d = haversine(
          { lat: ult.latitud!, lng: ult.longitud! },
          { lat: restantes[i].latitud!, lng: restantes[i].longitud! }
        );
        if (d < mejorDist) {
          mejorDist = d;
          mejorIdx = i;
        }
      }
      dist += mejorDist;
      ordenadas.push(restantes.splice(mejorIdx, 1)[0]);
    }

    result.push({
      zona,
      paradas: [...ordenadas, ...sinCoords],
      distanciaTotalKm: Math.round(dist * 10) / 10,
    });
  }

  // Ordenar zonas por número de paradas desc
  return result.sort((a, b) => b.paradas.length - a.paradas.length);
}

/**
 * Genera URL de Google Maps con waypoints para abrir la ruta optimizada.
 */
export function generarGoogleMapsUrl(paradas: VisitaPunto[]): string {
  const puntos = paradas
    .filter((p) => p.latitud != null && p.longitud != null)
    .map((p) => `${p.latitud},${p.longitud}`);

  if (puntos.length === 0) return "";
  if (puntos.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${puntos[0]}`;
  }
  const origin = puntos[0];
  const destination = puntos[puntos.length - 1];
  const waypoints = puntos.slice(1, -1).join("|");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
    waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""
  }&travelmode=driving`;
}
