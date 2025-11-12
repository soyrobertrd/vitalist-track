import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type ZonaType = "santo_domingo_oeste" | "santo_domingo_este" | "santo_domingo_norte" | "distrito_nacional" | "san_luis" | "los_alcarrizos" | "boca_chica";

export function useBarriosPorZona(zona: ZonaType | string | null | undefined) {
  const [barrios, setBarrios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zona) {
      setBarrios([]);
      return;
    }

    const fetchBarrios = async () => {
      setLoading(true);
      try {
        // Consultar barrios únicos de pacientes existentes en la zona seleccionada
        const { data, error } = await supabase
          .from("pacientes")
          .select("barrio")
          .eq("zona", zona as any)
          .not("barrio", "is", null)
          .order("barrio", { ascending: true });

        if (error) throw error;

        // Extraer barrios únicos
        const barriosUnicos = [...new Set(
          data
            .map((p) => p.barrio)
            .filter((b): b is string => b !== null && b.trim() !== "")
        )];

        setBarrios(barriosUnicos);
      } catch (error) {
        console.error("Error fetching barrios:", error);
        setBarrios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBarrios();
  }, [zona]);

  return { barrios, loading };
}
