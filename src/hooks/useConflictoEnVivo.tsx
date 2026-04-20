import { useState, useEffect } from "react";
import { useSmartRescheduling } from "./useSmartRescheduling";
import { useDebounce } from "./useDebounce";

interface Conflicto {
  id: string;
  tipo: "llamada" | "visita";
  fecha: Date;
  paciente: string;
  motivo: string;
}

/**
 * Hook reactivo que detecta conflictos en la agenda del profesional
 * mientras el usuario edita fecha/hora en un formulario.
 */
export function useConflictoEnVivo(
  profesionalId: string | null | undefined,
  fecha: string,
  hora: string,
  duracionMinutos = 30
) {
  const { detectConflicts } = useSmartRescheduling();
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [checking, setChecking] = useState(false);

  const debFecha = useDebounce(fecha, 400);
  const debHora = useDebounce(hora, 400);

  useEffect(() => {
    if (!profesionalId || !debFecha || !debHora) {
      setConflictos([]);
      return;
    }
    setChecking(true);
    detectConflicts(profesionalId, new Date(`${debFecha}T12:00:00`), debHora, duracionMinutos)
      .then((c) => setConflictos(c))
      .finally(() => setChecking(false));
  }, [profesionalId, debFecha, debHora, duracionMinutos, detectConflicts]);

  return { conflictos, checking, hasConflicto: conflictos.length > 0 };
}
