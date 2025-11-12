import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhoneNumber } from "@/lib/validaciones";

interface DuplicadoEncontrado {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  contacto_px?: string;
  contacto_cuidador?: string;
  zona?: string;
  barrio?: string;
  motivo: string[];
}

export function useDetectarDuplicados(
  cedula?: string,
  nombre?: string,
  apellido?: string,
  contactoPx?: string,
  contactoCuidador?: string,
  excludeId?: string
) {
  const [duplicados, setDuplicados] = useState<DuplicadoEncontrado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const detectar = async () => {
      if (!cedula && !nombre && !contactoPx && !contactoCuidador) {
        setDuplicados([]);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from("pacientes")
          .select("*")
          .eq("status_px", "activo");

        if (excludeId) {
          query = query.neq("id", excludeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const encontrados: DuplicadoEncontrado[] = [];

        data?.forEach((paciente) => {
          const motivos: string[] = [];

          // Verificar por cédula
          if (cedula && cedula.trim() && paciente.cedula === cedula.trim()) {
            motivos.push("Misma cédula");
          }

          // Verificar por nombre completo
          if (
            nombre &&
            apellido &&
            nombre.trim() &&
            apellido.trim() &&
            paciente.nombre?.toLowerCase() === nombre.trim().toLowerCase() &&
            paciente.apellido?.toLowerCase() === apellido.trim().toLowerCase()
          ) {
            motivos.push("Mismo nombre completo");
          }

          // Verificar por teléfono del paciente (usando normalización)
          if (contactoPx && contactoPx.trim()) {
            const telefonoNormalizado = normalizePhoneNumber(contactoPx);
            if (paciente.contacto_px) {
              const telefonoPacienteNormalizado = normalizePhoneNumber(paciente.contacto_px);
              if (telefonoNormalizado === telefonoPacienteNormalizado && telefonoNormalizado !== "") {
                motivos.push("Mismo teléfono de paciente");
              }
            }
          }

          // Verificar por teléfono del cuidador (usando normalización)
          if (contactoCuidador && contactoCuidador.trim()) {
            const telefonoNormalizado = normalizePhoneNumber(contactoCuidador);
            if (paciente.contacto_cuidador) {
              const telefonoCuidadorNormalizado = normalizePhoneNumber(paciente.contacto_cuidador);
              if (telefonoNormalizado === telefonoCuidadorNormalizado && telefonoNormalizado !== "") {
                motivos.push("Mismo teléfono de cuidador");
              }
            }
          }

          if (motivos.length > 0) {
            encontrados.push({
              id: paciente.id,
              nombre: paciente.nombre,
              apellido: paciente.apellido,
              cedula: paciente.cedula,
              contacto_px: paciente.contacto_px,
              contacto_cuidador: paciente.contacto_cuidador,
              zona: paciente.zona,
              barrio: paciente.barrio,
              motivo: motivos,
            });
          }
        });

        setDuplicados(encontrados);
      } catch (error) {
        console.error("Error al detectar duplicados:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(detectar, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [cedula, nombre, apellido, contactoPx, contactoCuidador, excludeId]);

  return { duplicados, loading };
}
