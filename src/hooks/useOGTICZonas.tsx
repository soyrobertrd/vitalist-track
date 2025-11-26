import { useState, useEffect } from "react";

interface Municipality {
  id: number;
  name: string;
  provinceId: number;
}

interface Zone {
  value: string;
  label: string;
  municipalityId: number;
}

export function useOGTICZonas() {
  const [zonas, setZonas] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZonas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch provinces to get Santo Domingo and Distrito Nacional IDs
        const provincesRes = await fetch("https://api.digital.gob.do/v1/territories/provinces");
        const provinces = await provincesRes.json();
        
        const santoDomingoProvince = provinces.find((p: any) => p.name === "Santo Domingo");
        const distritoNacionalProvince = provinces.find((p: any) => p.name === "Distrito Nacional");
        
        if (!santoDomingoProvince || !distritoNacionalProvince) {
          throw new Error("No se encontraron las provincias requeridas");
        }

        // Fetch municipalities for both provinces
        const municipalitiesRes = await fetch("https://api.digital.gob.do/v1/territories/municipalities");
        const allMunicipalities = await municipalitiesRes.json();
        
        const filteredMunicipalities: Municipality[] = allMunicipalities.filter(
          (m: any) => m.provinceId === santoDomingoProvince.id || m.provinceId === distritoNacionalProvince.id
        );

        // Transform municipalities to zones format
        const zonasData: Zone[] = filteredMunicipalities.map((m) => ({
          value: m.name.toLowerCase().replace(/ /g, "_"),
          label: m.name,
          municipalityId: m.id
        }));

        setZonas(zonasData);
      } catch (err) {
        console.error("Error fetching zonas:", err);
        setError("Error al cargar las zonas");
        // Fallback to hardcoded zones if API fails
        setZonas([
          { value: "santo_domingo_oeste", label: "Santo Domingo Oeste", municipalityId: 0 },
          { value: "santo_domingo_este", label: "Santo Domingo Este", municipalityId: 0 },
          { value: "santo_domingo_norte", label: "Santo Domingo Norte", municipalityId: 0 },
          { value: "distrito_nacional", label: "Distrito Nacional", municipalityId: 0 },
          { value: "san_luis", label: "San Luis", municipalityId: 0 },
          { value: "los_alcarrizos", label: "Los Alcarrizos", municipalityId: 0 },
          { value: "boca_chica", label: "Boca Chica", municipalityId: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchZonas();
  }, []);

  return { zonas, loading, error };
}
