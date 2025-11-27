import { useState, useEffect } from "react";
import { getBarriosPorMunicipio } from "@/data/barriosData";

export function useOGTICBarrios(municipioId: string | null) {
  const [barrios, setBarrios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!municipioId) {
      setBarrios([]);
      return;
    }

    setLoading(true);
    // Load static data from Excel
    const barriosData = getBarriosPorMunicipio(municipioId);
    setBarrios(barriosData);
    setLoading(false);
  }, [municipioId]);

  return { barrios, loading };
}
