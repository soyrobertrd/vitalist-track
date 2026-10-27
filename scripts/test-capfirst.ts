import assert from "node:assert";
import { capFirst } from "../src/lib/utils";

assert.equal(capFirst("activo"), "Activo");
assert.equal(capFirst("  ñandú"), "  Ñandú");
assert.equal(capFirst("Ya"), "Ya");
assert.equal(capFirst("123 abc"), "123 abc");
assert.deepEqual(capFirst([null, " ", "pendiente", "x"]), [null, " ", "Pendiente", "x"]);
assert.deepEqual(capFirst([5, " días"]), [5, " días"]);
console.log("✅ capFirst OK");
