// lib/cache/cache.ts
// Three-layer LLM cache for the offline demo:
//   1. exact match (key includes model, temperature, tier, prompt version)
//   2. semantic match above a tunable similarity floor
//   3. provider prefix caching (modeled as a constant, documented)
//
// The false-hit rate is measured against ground-truth intent labels, which is
// how you validate a semantic cache offline before deploying it.

import { hashString, similarity } from "./semantic";

export type CacheParams = {
  model: string;
  temperature: number;
  tier: string;
  promptVersion: string;
};

export type CacheEntry = {
  params: CacheParams;
  query: string;
  intent: string;
  response: string;
};

export type CacheHit = {
  kind: "exact" | "semantic" | "miss";
  entry?: CacheEntry;
  falseHit?: boolean;
};

function paramsKey(params: CacheParams): string {
  return `${params.model}|${params.temperature}|${params.tier}|${params.promptVersion}`;
}

export function exactKey(query: string, params: CacheParams): string {
  return hashString(`${paramsKey(params)}::${query}`);
}

export function createCache(threshold: number) {
  const exact = new Map<string, CacheEntry>();
  const semantic: CacheEntry[] = [];

  function get(query: string, params: CacheParams, intent: string): CacheHit {
    const key = exactKey(query, params);
    const e = exact.get(key);
    if (e) return { kind: "exact", entry: e };

    let best: { entry: CacheEntry; sim: number } | null = null;
    for (const entry of semantic) {
      if (paramsKey(entry.params) !== paramsKey(params)) continue;
      const sim = similarity(query, entry.query);
      if (sim >= threshold && (!best || sim > best.sim)) best = { entry, sim };
    }
    if (best) {
      return {
        kind: "semantic",
        entry: best.entry,
        falseHit: best.entry.intent !== intent,
      };
    }
    return { kind: "miss" };
  }

  function put(entry: CacheEntry): void {
    exact.set(exactKey(entry.query, entry.params), entry);
    semantic.push(entry);
  }

  function invalidatePromptVersion(version: string): number {
    for (const [key, entry] of exact) {
      if (entry.params.promptVersion === version) {
        exact.delete(key);
      }
    }
    let removed = 0;
    for (let i = semantic.length - 1; i >= 0; i -= 1) {
      if (semantic[i].params.promptVersion === version) {
        semantic.splice(i, 1);
        removed += 1;
      }
    }
    return removed;
  }

  return { get, put, invalidatePromptVersion, size: () => semantic.length };
}

export type ReplayResult = {
  total: number;
  exactHits: number;
  semanticHits: number;
  falseHits: number;
  misses: number;
  hitRate: number;
  falseHitRate: number; // false hits over semantic hits
  costCents: number;
  baselineCostCents: number;
  savingsPct: number;
  /** One per workload item, in order. "false" is a semantic hit that served another intent's answer. */
  outcomes: ("exact" | "semantic" | "miss" | "false")[];
};

export const MISS_CENTS_PER_THOUSAND = 1000;
export const HIT_CENTS_PER_THOUSAND = 100;

export function replay(
  workload: readonly { query: string; intent: string }[],
  params: CacheParams,
  threshold: number,
  cache = createCache(threshold),
): ReplayResult {
  let exactHits = 0;
  let semanticHits = 0;
  let falseHits = 0;
  let misses = 0;
  const outcomes: ReplayResult["outcomes"] = [];

  for (const item of workload) {
    const hit = cache.get(item.query, params, item.intent);
    outcomes.push(hit.kind === "semantic" && hit.falseHit ? "false" : hit.kind);
    if (hit.kind === "exact") exactHits += 1;
    else if (hit.kind === "semantic") {
      semanticHits += 1;
      if (hit.falseHit) falseHits += 1;
    } else {
      misses += 1;
      cache.put({
        params,
        query: item.query,
        intent: item.intent,
        response: `respuesta para "${item.query}"`,
      });
    }
  }

  const total = workload.length;
  const hits = exactHits + semanticHits;
  const costCents = Math.ceil((hits * HIT_CENTS_PER_THOUSAND + misses * MISS_CENTS_PER_THOUSAND) / 1000);
  const baselineCostCents = Math.ceil(total * MISS_CENTS_PER_THOUSAND / 1000);

  return {
    total,
    exactHits,
    semanticHits,
    falseHits,
    misses,
    hitRate: hits / total,
    falseHitRate: semanticHits === 0 ? 0 : falseHits / semanticHits,
    costCents,
    baselineCostCents,
    savingsPct: baselineCostCents === 0 ? 0 : 1 - costCents / baselineCostCents,
    outcomes,
  };
}
