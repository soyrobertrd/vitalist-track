import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CedulaData {
  nombres?: string;
  apellido1?: string;
  apellido2?: string;
  fecha_nac?: string;
  sexo?: string;
  foto_encoded?: string;
}

export function useCedulaLookup() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CedulaData | null>(null);

  const lookup = useCallback(async (cedula: string): Promise<CedulaData | null> => {
    const cedulaLimpia = cedula.replace(/\D/g, '');
    if (cedulaLimpia.length !== 11) return null;
    
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('consultar-cedula', {
        body: { cedula: cedulaLimpia }
      });

      if (error) throw error;

      if (response?.success && response?.nombres) {
        setData(response);
        toast.success("Datos cargados desde JCE");
        return response;
      } else if (response?.message) {
        toast.info(response.message);
      }
      return null;
    } catch (error) {
      console.error("Error fetching cedula data:", error);
      toast.info("Servicio de consulta no disponible. Ingrese los datos manualmente.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
  }, []);

  return {
    loading,
    data,
    lookup,
    reset
  };
}
