import { useState, useEffect } from "react";

interface Neighborhood {
  id: number;
  name: string;
  municipalityId: number;
}

export function useOGTICBarrios(municipalityId: number | null) {
  const [barrios, setBarrios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!municipalityId) {
      setBarrios([]);
      return;
    }

    const fetchBarrios = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch("https://api.digital.gob.do/v1/territories/Neighborhoods");
        const allNeighborhoods: Neighborhood[] = await response.json();
        
        const filteredBarrios = allNeighborhoods
          .filter((n) => n.municipalityId === municipalityId)
          .map((n) => n.name)
          .sort();
        
        setBarrios(filteredBarrios);
      } catch (err) {
        console.error("Error fetching barrios:", err);
        setError("Error al cargar los barrios");
        setBarrios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBarrios();
  }, [municipalityId]);

  return { barrios, loading, error };
}
