#!/usr/bin/env node
// Genera el esquema SQLite (Turso) a partir de los tipos de la app.
// Uso: node scripts/generar-esquema-sqlite.mjs  → src/integrations/db/esquema.json
// Formato: { tabla: { columna: "text" | "real" | "bool" | "json" } }
import fs from "node:fs";

const fuente = "src/integrations/db/types.ts";
const s = fs.readFileSync(fuente, "utf8").replace(/\r/g, "");
const tablas = s.split("\n    Views:")[0];
const esquema = {};
let actual = null;
let enRow = false;
for (const l of tablas.split("\n")) {
  let m = l.match(/^      (\w+): \{$/);
  if (m) { actual = m[1]; esquema[actual] = {}; enRow = false; continue; }
  if (/^        Row: \{$/.test(l)) { enRow = true; continue; }
  if (enRow && /^        \}$/.test(l)) { enRow = false; continue; }
  if (!enRow) continue;
  m = l.match(/^          (\w+)\??: (.*)$/);
  if (!m) continue;
  const t = m[2].replace(/ \| null$/, "");
  esquema[actual][m[1]] =
    t === "number" ? "real" : t === "boolean" ? "bool" : t === "Json" || t.endsWith("[]") || t.startsWith("{") ? "json" : "text";
}
fs.writeFileSync("src/integrations/db/esquema.json", JSON.stringify(esquema));
console.log(`${Object.keys(esquema).length} tablas → src/integrations/db/esquema.json`);
