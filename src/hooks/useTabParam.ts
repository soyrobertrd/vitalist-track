import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Sincroniza un estado de tab con el query param `?tab=` de la URL.
 * Permite enlaces directos desde el menú lateral hacia tabs específicos
 * dentro de páginas verticales (Aesthetic, Dental, Vision, Recovery).
 */
export function useTabParam(defaultValue: string): [string, (v: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("tab") || defaultValue;
  const [tab, setTabState] = useState<string>(initial);

  // Cuando cambia el query param desde fuera (clic en sidebar), actualizar
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== tab) setTabState(urlTab);
  }, [searchParams]);

  const setTab = (v: string) => {
    setTabState(v);
    const next = new URLSearchParams(searchParams);
    next.set("tab", v);
    setSearchParams(next, { replace: true });
  };

  return [tab, setTab];
}
