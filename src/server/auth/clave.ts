import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (p: string, s: Buffer, n: number, o: object) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1 };

/** Hash scrypt con sal aleatoria: "scrypt$<sal>$<hash>" en base64. */
export async function hashClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scrypt(clave, sal, 64, PARAMS);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function verificarClave(clave: string, guardado: string | null): Promise<boolean> {
  const [alg, sal, hash] = (guardado ?? "").split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const calculado = await scrypt(clave, Buffer.from(sal, "base64"), esperado.length, PARAMS);
  return timingSafeEqual(calculado, esperado);
}
