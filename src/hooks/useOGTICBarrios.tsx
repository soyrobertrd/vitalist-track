import { useState, useEffect } from "react";

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

interface ApiResponse {
  mode: string;
  scope: { municipio: string };
  items: Array<{
    nombre: string;
    municipios: Array<{
      nombre: string;
      zona_grupo: string;
      dm: Array<{
        nombre: string | null;
        zonas: Array<{
          nombre: string;
          barrios: string[];
        }>;
        barrios: string[];
      }>;
    }>;
  }>;
}

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
        const response = await fetch(
          `https://phpstack-616350-6059894.cloudwaysapps.com/api/localizacion.php?municipio=${encodeURIComponent(municipioNombre)}`
        );
        
        if (!response.ok) {
          throw new Error("Error fetching barrios");
        }

        const data: ApiResponse = await response.json();
        
        // Extraer todos los barrios de la respuesta
        const barriosSet = new Set<string>();
        
        data.items?.forEach(item => {
          item.municipios?.forEach(municipio => {
            municipio.dm?.forEach(dm => {
              // Barrios directos del DM
              dm.barrios?.forEach(barrio => {
                if (barrio) barriosSet.add(barrio);
              });
              
              // Barrios dentro de zonas
              dm.zonas?.forEach(zona => {
                zona.barrios?.forEach(barrio => {
                  if (barrio) barriosSet.add(barrio);
                });
              });
            });
          });
        });

        // Ordenar alfabéticamente
        const barriosArray = Array.from(barriosSet).sort((a, b) => 
          a.localeCompare(b, 'es')
        );
        
        setBarrios(barriosArray);
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
