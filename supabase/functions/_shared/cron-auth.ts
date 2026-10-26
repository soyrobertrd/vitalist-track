/**
 * Autenticación para funciones invocadas por cron / procesos internos.
 *
 * La anon key de Supabase es PÚBLICA (va en el bundle del frontend), por lo que
 * `verify_jwt` por sí solo NO protege estos endpoints. Se exige además un
 * secreto compartido (`CRON_SECRET`) en el header `x-cron-secret`.
 *
 * Configurar:  supabase secrets set CRON_SECRET=<valor-largo-aleatorio>
 */

const encoder = new TextEncoder();

/** Comparación en tiempo constante para evitar timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/**
 * Devuelve `null` si la petición está autorizada, o una `Response` 401/500
 * que el handler debe retornar de inmediato.
 */
export function requireCronSecret(req: Request): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected || expected.length < 24) {
    // Fallar cerrado: sin secreto configurado el endpoint queda deshabilitado.
    return new Response(JSON.stringify({ ok: false, error: "cron_secret_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const provided = req.headers.get("x-cron-secret") ?? "";
  if (!safeEqual(provided, expected)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
