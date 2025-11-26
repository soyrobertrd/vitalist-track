import { useState, useEffect } from "react";
import { useOGTICZonas } from "./useOGTICZonas";
import { useOGTICBarrios } from "./useOGTICBarrios";

type ZonaType = "santo_domingo_oeste" | "santo_domingo_este" | "santo_domingo_norte" | "distrito_nacional" | "san_luis" | "los_alcarrizos" | "boca_chica";

export function useBarriosPorZona(zona: ZonaType | string | null | undefined) {
  const { zonas } = useOGTICZonas();
  const [municipalityId, setMunicipalityId] = useState<number | null>(null);

  useEffect(() => {
    if (!zona) {
      setMunicipalityId(null);
      return;
    }

    const zonaData = zonas.find(z => z.value === zona);
    if (zonaData) {
      setMunicipalityId(zonaData.municipalityId);
    }
  }, [zona, zonas]);

  const { barrios, loading } = useOGTICBarrios(municipalityId);

  return { barrios, loading };
}
