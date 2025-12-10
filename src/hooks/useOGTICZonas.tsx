import { useState, useEffect } from "react";

interface Zone {
  value: string;
  label: string;
}

// Lista estática de municipios
// Values must match the zona_distrito enum in the database
const MUNICIPIOS: Zone[] = [
  { value: "distrito_nacional", label: "Distrito Nacional" },
  { value: "santo_domingo_este", label: "Santo Domingo Este" },
  { value: "santo_domingo_oeste", label: "Santo Domingo Oeste" },
  { value: "santo_domingo_norte", label: "Santo Domingo Norte" },
  { value: "Boca Chica", label: "Boca Chica" },
  { value: "Los Alcarrizos", label: "Los Alcarrizos" },
  { value: "San Luis", label: "San Luis" },
  { value: "San Antonio de Guerra", label: "San Antonio de Guerra" },
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
