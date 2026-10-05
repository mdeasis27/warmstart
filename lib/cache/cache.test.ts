import { describe, expect, it } from "vitest";

import { createCache, exactKey, replay } from "./cache";
import { generateWorkload } from "./workload";
import { hashString, similarity, normalize } from "./semantic";

const PARAMS = { model: "m", temperature: 0, tier: "free", promptVersion: "v1" };

describe("semantic utilities", () => {
  it("normalize strips accents and case", () => {
    expect(normalize("¿Dónde está mi pedido?")).toBe("¿donde esta mi pedido?");
  });

  it("similarity is higher for related than unrelated queries", () => {
    const related = similarity("¿dónde está mi pedido?", "quiero saber el estado de mi pedido");
    const unrelated = similarity("¿dónde está mi pedido?", "¿cómo pago mi factura?");
    expect(related).toBeGreaterThan(unrelated);
  });

  it("similarity is 1 for identical text", () => {
    expect(similarity("hola", "hola")).toBe(1);
  });

  it("hashString is deterministic", () => {
    expect(hashString("hola")).toBe(hashString("hola"));
    expect(hashString("hola")).not.toBe(hashString("adios"));
  });
});

describe("cache", () => {
  it("exact hits differ from semantic hits", () => {
    const cache = createCache(0.6);
    cache.put({ params: PARAMS, query: "¿dónde está mi pedido?", intent: "x", response: "r" });
    const hit = cache.get("¿dónde está mi pedido?", PARAMS, "x");
    expect(hit.kind).toBe("exact");
  });

  it("a paraphrase under threshold is a semantic hit with the right intent", () => {
    const cache = createCache(0.6);
    cache.put({ params: PARAMS, query: "¿dónde está mi pedido?", intent: "order", response: "r" });
    const hit = cache.get("quiero saber dónde está mi pedido", PARAMS, "order");
    expect(hit.kind).toBe("semantic");
    expect(hit.falseHit).toBe(false);
  });

  it("a lookalike from a different intent is flagged as a false hit", () => {
    const cache = createCache(0.6);
    cache.put({ params: PARAMS, query: "¿puedo devolver lo que compré?", intent: "policy", response: "r" });
    const hit = cache.get("¿puedo devolver lo que compré si llegó dañado?", PARAMS, "damaged");
    expect(hit.kind).toBe("semantic");
    expect(hit.falseHit).toBe(true);
  });

  it("a prompt version change invalidates the exact layer", () => {
    const cache = createCache(0.6);
    cache.put({ params: PARAMS, query: "q", intent: "i", response: "r" });
    cache.invalidatePromptVersion("v1");
    expect(cache.get("q", PARAMS, "i").kind).toBe("miss");
  });

  it("exact key includes the prompt version", () => {
    const a = exactKey("q", PARAMS);
    const b = exactKey("q", { ...PARAMS, promptVersion: "v2" });
    expect(a).not.toBe(b);
  });
});

describe("replay", () => {
  it("bills aggregate rates in integer cents with one final rounding", () => {
    const result = replay([{ query: "q", intent: "i" }, { query: "q", intent: "i" }, { query: "q", intent: "i" }], PARAMS, .95);
    expect(result.costCents).toBe(2);
    expect(result.baselineCostCents).toBe(3);
  });
  it("reaches a non-trivial hit rate and reports savings", () => {
    const workload = generateWorkload(200, 7);
    const r = replay(workload, PARAMS, 0.6);
    expect(r.total).toBe(200);
    expect(r.hitRate).toBeGreaterThan(0.3);
    expect(r.costCents).toBeLessThan(r.baselineCostCents);
    expect(r.savingsPct).toBeGreaterThan(0);
    expect(r.falseHitRate).toBeLessThanOrEqual(1);
  });
});
