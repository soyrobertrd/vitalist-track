import type React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Regla de UI: títulos, badges, columnas y etiquetas nunca empiezan en minúscula.
 * Pone en mayúscula la primera letra del primer texto (los íconos previos se respetan).
 */
export function capFirst(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") return node.replace(/^(\s*)(\p{Ll})/u, (_, sp, c) => sp + c.toUpperCase());
  if (Array.isArray(node)) {
    const i = node.findIndex((n) => (typeof n === "string" && n.trim() !== "") || typeof n === "number");
    if (i === -1 || typeof node[i] !== "string") return node;
    const copia = [...node];
    copia[i] = capFirst(copia[i]);
    return copia;
  }
  return node;
}
