import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Mapeo de IDs internos a nombres de municipio para la API
const MUNICIPIO_NOMBRES: Record<string, string> = {
  "distrito_nacional": "Distrito Nacional",
  "santo_domingo_este": "Santo Domingo Este",
  "santo_domingo_oeste": "Santo Domingo Oeste",
  "santo_domingo_norte": "Santo Domingo Norte",
  "boca_chica": "Boca Chica",
  "los_alcarrizos": "Los Alcarrizos",
  "san_luis": "San Luis",
  "san_antonio_de_guerra": "San Antonio de Guerra",
};

export function useOGTICBarrios(municipioId: string | null) {
  const [barrios, setBarrios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!municipioId) {
      setBarrios([]);
      return;
    }

    const fetchBarrios = async () => {
      setLoading(true);
      try {
        const municipioNombre = MUNICIPIO_NOMBRES[municipioId] || municipioId;
        
        const { data, error } = await supabase.functions.invoke('consultar-barrios', {
          body: { municipio: municipioNombre }
        });

        if (error) {
          console.error('Error fetching barrios:', error);
          setBarrios([]);
          return;
        }

        if (data?.success && data?.barrios) {
          setBarrios(data.barrios);
        } else {
          console.error('API error:', data?.error);
          setBarrios([]);
        }
      } catch (error) {
        console.error("Error fetching barrios:", error);
        setBarrios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBarrios();
  }, [municipioId]);

  return { barrios, loading };
}
