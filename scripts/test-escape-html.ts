import assert from "node:assert";
import { escapeHtml, escapeDeep, safeColor } from "../src/lib/escape-html";

const ataque = `<img src=x onerror="alert('x')">&`;
assert.equal(escapeHtml(ataque), "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;");
assert.equal(escapeHtml(null), "");
assert.equal(escapeHtml(42), "42");

const p = escapeDeep({ nombre: "<b>Ana</b>", edad: 30, nulo: null, alergias: [{ sustancia: "<script>" }] });
assert.equal(p.nombre, "&lt;b&gt;Ana&lt;/b&gt;");
assert.equal(p.edad, 30);
assert.equal(p.nulo, null);
assert.equal(p.alergias[0].sustancia, "&lt;script&gt;");

assert.equal(safeColor("#1d4ed8", "#000"), "#1d4ed8");
assert.equal(safeColor("red;}</style><script>", "#000"), "#000");
assert.equal(safeColor(undefined, "#000"), "#000");
console.log("✅ escape-html OK");
