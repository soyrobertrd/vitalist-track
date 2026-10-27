import DOMPurify from "dompurify";

/**
 * Sanitiza HTML proveniente de la base de datos (plantillas, mensajes, etc.)
 * antes de inyectarlo con `dangerouslySetInnerHTML`. Evita XSS almacenado.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  return DOMPurify.sanitize(dirty ?? "", {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "onerror", "onload"],
  });
}

/**
 * Sanitiza SVG para códigos QR y gráficos vectoriales inyectados
 */
export function sanitizeSvg(dirty: string | null | undefined): string {
  return DOMPurify.sanitize(dirty ?? "", {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
}
