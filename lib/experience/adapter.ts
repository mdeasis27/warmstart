import { createCache, replay } from "@/lib/cache/cache";
import { generateWorkload } from "@/lib/cache/workload";
import type { DemoAdapter, TraceEvent } from "./types";
export type ExperienceInput = { batchSize: number; threshold: number; promptVersion: string; queriesText?: string };
export type ExperienceResult = ReturnType<typeof replay> & { costCents: number; baselineCostCents: number; invalidatedCount: number; questions: { query: string; intent: string }[] };
export const runExperience: DemoAdapter<ExperienceInput, ExperienceResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  if (!Number.isInteger(input.batchSize) || input.batchSize < 1 || input.batchSize > 200) throw new Error("Batch size must be an integer from 1 to 200.");
  if (!Number.isFinite(input.threshold) || input.threshold < 0 || input.threshold > 1) throw new Error("Threshold must be between 0 and 1.");
  if (!input.promptVersion.trim()) throw new Error("A prompt version is required.");
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const customLines = input.queriesText?.trim().split(/\r?\n/).filter(Boolean);
  if (customLines && customLines.length > 200) throw new Error("Use at most 200 custom queries.");
  const custom = customLines?.map((line) => {
    const [query, intent] = line.split("|").map((part) => part.trim());
    if (!query || !intent) throw new Error("Each custom query must use query | intent.");
    if (query.length > 500 || intent.length > 80) throw new Error("Use at most 500 characters per query and 80 per intent.");
    return { query, intent };
  });
  const workload = custom && custom.length > 0 ? custom : generateWorkload(input.batchSize);
  const baseParams = { model: "local-proxy", temperature: 0, tier: "standard", promptVersion: "v1" };
  const cache = createCache(input.threshold);
  const seed = workload.filter((_, index) => index % 3 === 0);
  seed.forEach((item) => cache.put({ params: baseParams, query: item.query, intent: item.intent, response: `seeded response for ${item.intent}` }));
  const invalidatedCount = input.promptVersion === "v1" ? 0 : cache.invalidatePromptVersion("v1");
  const raw = replay(workload, { ...baseParams, promptVersion: input.promptVersion }, input.threshold, cache);
  const result = {
    ...raw,
    invalidatedCount,
    questions: workload,
  };
  // One step per question so the scene plays each customer in turn.
  const trace: TraceEvent[] = raw.outcomes.map((outcome, index) => ({ id: `q${index + 1}`, step: index + 1, kind: "lookup", messageKey: outcome, evidenceIds: [workload[index].query], timestampMs: performance.now() - startedAt })); for (const event of trace) { if (signal.aborted) throw new DOMException("Aborted", "AbortError"); onEvent(event); if (signal.aborted) throw new DOMException("Aborted", "AbortError"); }
  return { input, result, trace, executionMs: performance.now() - startedAt, mode: "simulation" };
};
