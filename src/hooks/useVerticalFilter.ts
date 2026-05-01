import { useVertical } from "@/contexts/VerticalContext";

/**
 * Devuelve un objeto con la vertical activa y un helper para aplicar
 * el filtro `.eq("vertical", x)` a queries de Supabase de forma condicional.
 *
 * - Si la vertical activa es "todas" (admin), no aplica filtro.
 * - Si es una vertical específica, filtra por ella.
 *
 * Uso:
 *   const { applyVerticalFilter, verticalActiva } = useVerticalFilter();
 *   let q = supabase.from("pacientes").select("*").eq("workspace_id", wsId);
 *   q = applyVerticalFilter(q);
 */
export function useVerticalFilter() {
  const { verticalActiva } = useVertical();

  const applyVerticalFilter = <T extends { eq: (col: string, val: any) => T }>(
    query: T
  ): T => {
    if (verticalActiva && verticalActiva !== "todas") {
      return query.eq("vertical", verticalActiva);
    }
    return query;
  };

  /** Valor a guardar como `vertical` al crear nuevos registros */
  const verticalParaInsert = verticalActiva === "todas" ? "clinica" : verticalActiva;

  return { verticalActiva, applyVerticalFilter, verticalParaInsert };
}
