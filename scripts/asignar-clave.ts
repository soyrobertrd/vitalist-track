#!/usr/bin/env -S npx tsx
/** Asigna contraseña a un usuario de Turso: npm run db:clave -- correo@ejemplo.com "nueva-clave" */
import fs from "node:fs";
import { createClient } from "@libsql/client";
import { hashClave } from "../src/server/auth/clave";
import { configTurso } from "../src/server/db/conexion-app";

for (const archivo of [".env.local", ".env"]) {
  if (!fs.existsSync(archivo)) continue;
  for (const l of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
const [email, clave] = process.argv.slice(2);
if (!email || !clave || clave.length < 8) {
  console.error("Uso: npm run db:clave -- correo \"clave de al menos 8 caracteres\"");
  process.exit(1);
}
const db = createClient(configTurso());
const r = await db.execute({ sql: "UPDATE auth_usuarios SET password_hash = ? WHERE email = ?", args: [await hashClave(clave), email] });
console.log(r.rowsAffected ? `Clave asignada a ${email}.` : `No existe el usuario ${email}.`);
