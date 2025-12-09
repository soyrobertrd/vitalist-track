import { useState, useEffect } from "react";

interface Zone {
  value: string;
  label: string;
}

// Lista estática de municipios
const MUNICIPIOS: Zone[] = [
  { value: "distrito_nacional", label: "Distrito Nacional" },
  { value: "santo_domingo_este", label: "Santo Domingo Este" },
  { value: "santo_domingo_oeste", label: "Santo Domingo Oeste" },
  { value: "santo_domingo_norte", label: "Santo Domingo Norte" },
  { value: "boca_chica", label: "Boca Chica" },
  { value: "los_alcarrizos", label: "Los Alcarrizos" },
  { value: "san_luis", label: "San Luis" },
  { value: "san_antonio_de_guerra", label: "San Antonio de Guerra" },
];

export function useOGTICZonas() {
  const [zonas, setZonas] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setZonas(MUNICIPIOS);
    setLoading(false);
  }, []);

  return { zonas, loading };
}
