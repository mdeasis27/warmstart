import { describe, expect, it } from "vitest";
import { runExperience } from "./adapter";
describe("Warmstart experience", () => { it("uses integer cents and changes results as the threshold changes", async () => { const signal = new AbortController().signal; const loose = await runExperience({ batchSize: 40, threshold: 0.2, promptVersion: "v1" }, signal, () => undefined); const strict = await runExperience({ batchSize: 40, threshold: 0.98, promptVersion: "v1" }, signal, () => undefined); expect(Number.isInteger(loose.result.costCents)).toBe(true); expect(loose.result.semanticHits).toBeGreaterThanOrEqual(strict.result.semanticHits); }); });

describe("Warmstart validation", () => {
  it("rejects a non-finite similarity threshold", async () => {
    await expect(runExperience({ batchSize: 4, threshold: Number.NaN, promptVersion: "v1" }, new AbortController().signal, () => undefined)).rejects.toThrow("Threshold");
  });
  it("rejects a custom workload above the 200-query budget before replay", async () => {
    const queriesText = Array.from({ length: 201 }, (_, index) => `query ${index} | intent ${index}`).join("\n");
    await expect(runExperience({ batchSize: 8, threshold: .7, promptVersion: "v1", queriesText }, new AbortController().signal, () => {})).rejects.toThrow("200");
  });
  it("rejects oversized query text before similarity computation", async () => {
    await expect(runExperience({ batchSize: 8, threshold: .7, promptVersion: "v1", queriesText: `${"q".repeat(501)} | intent` }, new AbortController().signal, () => {})).rejects.toThrow("500");
  });
});

describe("Warmstart version invalidation", () => {
  it("invalidates the seeded v1 entries when the prompt version changes", async () => {
    const input = { batchSize: 8, threshold: 0.7 };
    const v1 = await runExperience({ ...input, promptVersion: "v1" }, new AbortController().signal, () => undefined);
    const v2 = await runExperience({ ...input, promptVersion: "v2" }, new AbortController().signal, () => undefined);
    expect(v1.result.invalidatedCount).toBe(0);
    expect(v2.result.invalidatedCount).toBe(Math.ceil(input.batchSize / 3));
    expect(v1.result.exactHits).toBeGreaterThan(v2.result.exactHits);
    expect(v2.result.misses).toBeGreaterThan(v1.result.misses);
  });
});

describe("Warmstart per-question playback", () => {
  it("emits one trace event per question, in order, and returns the questions it replayed", async () => {
    const events: string[] = [];
    const run = await runExperience({ batchSize: 48, threshold: .65, promptVersion: "v1" }, new AbortController().signal, e => events.push(e.messageKey));
    expect(run.trace).toHaveLength(48);
    expect(events).toEqual(run.result.outcomes);
    expect(run.trace.map(e => e.evidenceIds?.[0])).toEqual(run.result.questions.map(q => q.query));
    expect(run.result.questions).toHaveLength(48);
  });
});
