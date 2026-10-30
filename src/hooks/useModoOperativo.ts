import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export type ModoOperativoTipo = "solo" | "centro";

const STORAGE_KEY = "vitalist_modo_operativo";

export function useModoOperativo() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const [modo, setModoState] = useState<ModoOperativoTipo>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${wsId || "default"}`);
      if (saved === "solo" || saved === "centro") return saved;
    } catch {}
    return "centro"; // Por defecto centro
  });

  useEffect(() => {
    if (!wsId) return;
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${wsId}`);
      if (saved === "solo" || saved === "centro") {
        setModoState(saved);
      }
    } catch {}
  }, [wsId]);

  const setModo = (nuevoModo: ModoOperativoTipo) => {
    setModoState(nuevoModo);
    try {
      localStorage.setItem(`${STORAGE_KEY}_${wsId || "default"}`, nuevoModo);
    } catch {}
  };

  const toggleModo = () => {
    setModo(modo === "solo" ? "centro" : "solo");
  };

  const isSolo = modo === "solo";
  const isCentro = modo === "centro";

  return {
    modo,
    setModo,
    toggleModo,
    isSolo,
    isCentro,
    labelModo: isSolo ? "Profesional Independiente" : "Centro / Policlínica Multi-Especialista",
    shortLabel: isSolo ? "Modo Solo" : "Multi-Centro",
  };
}
