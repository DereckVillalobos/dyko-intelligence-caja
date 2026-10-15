import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { marginPct, markupPct } from "../src/lib/pos/types.ts";

describe("indicadores de rentabilidad", () => {
  it("separa margen sobre venta de recargo sobre costo", () => {
    // Compra ₡1000, venta ₡1300: margen 23%, recargo 30%.
    assert.equal(marginPct(1300, 1000), 23);
    assert.equal(markupPct(1300, 1000), 30);
  });

  it("no divide por cero ni permite resultados no finitos", () => {
    assert.equal(marginPct(0, 1000), null);
    assert.equal(marginPct(1500, 0), null);
    assert.equal(marginPct(Infinity, 1000), null);
    assert.equal(markupPct(1300, 0), null);
  });

  it("reporta margen negativo para venta bajo costo", () => {
    assert.equal(marginPct(900, 1000), -11);
    assert.equal(markupPct(900, 1000), -10);
  });
});
