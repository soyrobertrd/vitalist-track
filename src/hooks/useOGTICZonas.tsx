import { useState, useEffect } from "react";
import { getMunicipios } from "@/data/barriosData";

interface Zone {
  value: string;
  label: string;
}

export function useOGTICZonas() {
  const [zonas, setZonas] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Load static data from Excel
    const municipios = getMunicipios();
    setZonas(municipios);
    setLoading(false);
  }, []);

  return { zonas, loading };
}
