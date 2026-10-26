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
