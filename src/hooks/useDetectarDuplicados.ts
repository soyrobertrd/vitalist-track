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
  motivosCampos: { campo: string; valor: string }[];
}

interface ExcepcionDuplicado {
  paciente_existente_id: string;
  campo_duplicado: string;
  valor_duplicado: string;
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
  const [excepciones, setExcepciones] = useState<ExcepcionDuplicado[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing exceptions
  useEffect(() => {
    const fetchExcepciones = async () => {
      const { data, error } = await supabase
        .from("excepciones_duplicados")
        .select("paciente_existente_id, campo_duplicado, valor_duplicado");
      
      if (!error && data) {
        setExcepciones(data);
      }
    };
    fetchExcepciones();
  }, []);

  const refetchExcepciones = async () => {
    const { data, error } = await supabase
      .from("excepciones_duplicados")
      .select("paciente_existente_id, campo_duplicado, valor_duplicado");
    
    if (!error && data) {
      setExcepciones(data);
    }
  };

  const confirmarDuplicado = async (
    pacienteExistenteId: string,
    campo: string,
    valor: string,
    notas?: string
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("excepciones_duplicados")
      .upsert({
        paciente_existente_id: pacienteExistenteId,
        campo_duplicado: campo,
        valor_duplicado: valor,
        confirmado_por: userData?.user?.id,
        notas: notas
      }, {
        onConflict: 'paciente_existente_id,campo_duplicado,valor_duplicado'
      });

    if (!error) {
      await refetchExcepciones();
      // Re-trigger duplicate detection
      setDuplicados(prev => prev.filter(d => {
        const hasThisCampo = d.motivosCampos.some(
          m => m.campo === campo && m.valor === valor && d.id === pacienteExistenteId
        );
        if (hasThisCampo) {
          // Remove this specific motivo
          const newMotivos = d.motivosCampos.filter(
            m => !(m.campo === campo && m.valor === valor)
          );
          if (newMotivos.length === 0) {
            return false; // Remove this duplicate entirely
          }
          d.motivosCampos = newMotivos;
          d.motivo = newMotivos.map(m => {
            switch (m.campo) {
              case 'cedula': return 'Misma cédula';
              case 'nombre_completo': return 'Mismo nombre completo';
              case 'telefono_px': return 'Mismo teléfono de paciente';
              case 'telefono_cuidador': return 'Mismo teléfono de cuidador';
              default: return m.campo;
            }
          });
        }
        return true;
      }));
    }
    return !error;
  };

  const isExcepcionConfirmada = (
    pacienteId: string,
    campo: string,
    valor: string
  ): boolean => {
    return excepciones.some(
      e => e.paciente_existente_id === pacienteId &&
           e.campo_duplicado === campo &&
           e.valor_duplicado === valor
    );
  };

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
          const motivosCampos: { campo: string; valor: string }[] = [];

          // Verificar por cédula
          if (cedula && cedula.trim() && paciente.cedula === cedula.trim()) {
            const valor = cedula.trim();
            if (!isExcepcionConfirmada(paciente.id, 'cedula', valor)) {
              motivos.push("Misma cédula");
              motivosCampos.push({ campo: 'cedula', valor });
            }
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
            const valor = `${nombre.trim().toLowerCase()}|${apellido.trim().toLowerCase()}`;
            if (!isExcepcionConfirmada(paciente.id, 'nombre_completo', valor)) {
              motivos.push("Mismo nombre completo");
              motivosCampos.push({ campo: 'nombre_completo', valor });
            }
          }

          // Verificar por teléfono del paciente (usando normalización)
          if (contactoPx && contactoPx.trim()) {
            const telefonoNormalizado = normalizePhoneNumber(contactoPx);
            if (paciente.contacto_px) {
              const telefonoPacienteNormalizado = normalizePhoneNumber(paciente.contacto_px);
              if (telefonoNormalizado === telefonoPacienteNormalizado && telefonoNormalizado !== "") {
                if (!isExcepcionConfirmada(paciente.id, 'telefono_px', telefonoNormalizado)) {
                  motivos.push("Mismo teléfono de paciente");
                  motivosCampos.push({ campo: 'telefono_px', valor: telefonoNormalizado });
                }
              }
            }
          }

          // Verificar por teléfono del cuidador (usando normalización)
          if (contactoCuidador && contactoCuidador.trim()) {
            const telefonoNormalizado = normalizePhoneNumber(contactoCuidador);
            if (paciente.contacto_cuidador) {
              const telefonoCuidadorNormalizado = normalizePhoneNumber(paciente.contacto_cuidador);
              if (telefonoNormalizado === telefonoCuidadorNormalizado && telefonoNormalizado !== "") {
                if (!isExcepcionConfirmada(paciente.id, 'telefono_cuidador', telefonoNormalizado)) {
                  motivos.push("Mismo teléfono de cuidador");
                  motivosCampos.push({ campo: 'telefono_cuidador', valor: telefonoNormalizado });
                }
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
              motivosCampos: motivosCampos,
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
  }, [cedula, nombre, apellido, contactoPx, contactoCuidador, excludeId, excepciones]);

  return { duplicados, loading, confirmarDuplicado, refetchExcepciones };
}
