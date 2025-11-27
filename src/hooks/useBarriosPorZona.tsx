import { useOGTICBarrios } from "./useOGTICBarrios";

type ZonaType = "santo_domingo_oeste" | "santo_domingo_este" | "santo_domingo_norte" | "distrito_nacional" | "san_luis" | "los_alcarrizos" | "boca_chica";

export function useBarriosPorZona(zona: ZonaType | string | null | undefined) {
  const { barrios, loading } = useOGTICBarrios(zona);
  return { barrios, loading };
}
