#!/usr/bin/env node
// Genera el esquema SQLite (Turso) y las relaciones a partir de los tipos de la app.
// Uso: npm run db:esquema → src/integrations/db/esquema.ts y relaciones.ts
// esquema: { tabla: { columna: "text" | "real" | "bool" | "json" } }
// relaciones: [tabla, columna, tabla_referenciada][]
import fs from "node:fs";

const s = fs.readFileSync("src/integrations/db/types.ts", "utf8").replace(/\r/g, "");
const tablas = s.split("\n    Views:")[0];
const esquema = {};
const relaciones = [];
let actual = null;
let enRow = false;
for (const l of tablas.split("\n")) {
  let m = l.match(/^      (\w+): \{$/);
  if (m) { actual = m[1]; esquema[actual] = {}; enRow = false; continue; }
  if (/^        Row: \{$/.test(l)) { enRow = true; continue; }
  if (enRow && /^        \}$/.test(l)) { enRow = false; continue; }
  if (enRow) {
    m = l.match(/^          (\w+)\??: (.*)$/);
    if (!m) continue;
    const t = m[2].replace(/ \| null$/, "");
    esquema[actual][m[1]] =
      t === "number" ? "real" : t === "boolean" ? "bool" : t === "Json" || t.endsWith("[]") || t.startsWith("{") ? "json" : "text";
    continue;
  }
  m = l.match(/columns: \["(\w+)"\]/);
  if (m && actual) { relaciones.push([actual, m[1]]); continue; }
  m = l.match(/referencedRelation: "(\w+)"/);
  if (m && relaciones.at(-1)?.length === 2) relaciones.at(-1).push(m[1]);
}

const cabecera = "// Generado por scripts/generar-esquema-sqlite.mjs. No editar a mano.\nexport default ";
fs.writeFileSync("src/integrations/db/esquema.ts", cabecera + JSON.stringify(esquema) + ";\n");
fs.writeFileSync("src/integrations/db/relaciones.ts", cabecera + JSON.stringify(relaciones.filter((r) => r.length === 3)) + ";\n");
console.log(`${Object.keys(esquema).length} tablas, ${relaciones.length} relaciones → src/integrations/db/esquema.ts y relaciones.ts`);
