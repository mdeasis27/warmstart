// lib/cache/semantic.ts
// Deterministic lexical utilities for the cache demo: normalisation, token-set
// Jaccard similarity, and a stable string hash for exact keys.

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function charNgrams(text: string, n = 3): Set<string> {
  const s = normalize(text).replace(/[^a-z0-9]/g, "");
  const out = new Set<string>();
  for (let i = 0; i + n <= s.length; i += 1) out.add(s.slice(i, i + n));
  return out;
}

/** Dice coefficient over character trigrams, in [0, 1]. More forgiving than
 *  word tokens for short, rephrased Spanish queries. */
export function similarity(a: string, b: string): number {
  const ta = charNgrams(a);
  const tb = charNgrams(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter += 1;
  });
  return (2 * inter) / (ta.size + tb.size);
}

/** Stable djb2 hash, hex-encoded — used for exact cache keys. */
export function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
