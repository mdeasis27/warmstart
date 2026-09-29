// lib/cache/demo.ts
// Computed demo layer: replay the workload at the tuned threshold, prove a
// system-prompt version change busts the cache, and sweep thresholds to
// produce the precision curve (hit rate vs false-hit rate).

import { generateWorkload } from "./workload";
import { createCache, replay, type CacheParams } from "./cache";

const PARAMS: CacheParams = {
  model: "frontier-chat",
  temperature: 0,
  tier: "free",
  promptVersion: "v3",
};

const WORKLOAD = generateWorkload(120, 42);

/** Tuned operating point: 0.8 keeps the false-hit rate at zero. */
export const TUNED_THRESHOLD = 0.8;

export function getDashboard() {
  const tuned = replay(WORKLOAD, PARAMS, TUNED_THRESHOLD);
  return { tuned, bust: getVersionBustDemo(), workloadSize: WORKLOAD.length };
}

/**
 * Prove a system-prompt version change busts the cache: warm the cache with v3,
 * then query with v4 — every lookup misses because the key includes the version.
 */
export function getVersionBustDemo() {
  const cache = createCache(TUNED_THRESHOLD);
  const v3: CacheParams = { ...PARAMS, promptVersion: "v3" };
  const v4: CacheParams = { ...PARAMS, promptVersion: "v4" };
  for (const item of WORKLOAD) {
    cache.put({ params: v3, query: item.query, intent: item.intent, response: `r:${item.query}` });
  }
  let v4Hits = 0;
  for (const item of WORKLOAD) {
    if (cache.get(item.query, v4, item.intent).kind !== "miss") v4Hits += 1;
  }
  return { warmedEntries: WORKLOAD.length, v4Hits, v4Misses: WORKLOAD.length - v4Hits };
}

export function getPrecisionCurve() {
  const thresholds = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  return thresholds.map((t) => {
    const r = replay(WORKLOAD, PARAMS, t);
    return { threshold: t, hitRate: r.hitRate, falseHitRate: r.falseHitRate };
  });
}
