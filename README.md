# Warmstart

**Three-layer cache for LLM APIs** — exact match, semantic match above a tunable
similarity floor, and provider prefix caching (modeled) — with a measured hit
rate, cost savings, false-hit rate, and a precision curve that turns the
threshold into a business decision.

> **Result:** Replaying 120 production-shaped queries (60% are the same handful
> of questions rephrased) at the tuned threshold **0.8** yields **82.5% hit
> rate**, **74% cost savings**, and **0% false hits**. Lowering the threshold to
> 0.4 raises hit rate to 86.7% but introduces **30% false hits** — the precision
> curve makes that tradeoff explicit. A system-prompt version change busts the
> cache to **0 hits** against the previous version.

---

## Result

| Measure | Value |
|---|---|
| Hit rate (threshold 0.8) | **82.5%** (93 exact + 6 semantic of 120) |
| Cost savings | **74%** ($0.31 vs $1.20 modeled) |
| False-hit rate (0.8) | **0%** |
| False-hit rate (0.4) | **30%** (hit rate 86.7%) |
| Version change → v4 hits vs v3 cache | **0** |

### The three layers

1. **Exact** — key includes `model + temperature + tier + prompt version + query`.
2. **Semantic** — char-trigram Dice similarity above a tunable floor; measured
   against ground-truth intent labels for false hits.
3. **Prefix caching** — provider-side, modeled as a constant (documented).

### The precision curve is the deliverable

The similarity threshold is a *business* decision about how wrong you can afford
to be. This project plots it instead of asserting it.

| Threshold | Hit rate | False-hit rate |
|---|---|---|
| 0.4 | 86.7% | 30% |
| 0.6 | 83.3% | 100% |
| **0.8** | **82.5%** | **0%** |
| 0.9 | 82.5% | 0% |

The 0.6 row is the honest gotcha: my lexical proxy merges the *"how do returns
work"* and *"how do I return a damaged item"* intents, so at that floor every
semantic hit is wrong. That is exactly the failure mode a semantic cache has
when its similarity is naive — measured, not hidden.

---

## Architecture

```
lib/cache/
  semantic.ts    # normalisation, char-trigram Dice similarity, stable hash
  cache.ts       # three-layer cache + replay (hit rate, cost, false hits)
  workload.ts    # 6 intents × paraphrases, weighted like real support traffic
  demo.ts        # dashboard + precision curve + version-bust proof
backend/
  src/warmstart/cache.py   # canonical Python implementation
  tests/                   # pinned to the same cases as the TS tests
app/               # Next.js demo dashboard + landing
```

## Design decisions & tradeoffs

1. **Version in the key.** The exact key includes the prompt version, so a v4
   query can never serve a v3 answer. This is the single highest-value detail:
   it is what prevents serving "yesterday's behaviour".
2. **Deterministic Dice, not an embedding model.** The offline demo can't ship
   an embedder, so similarity is char-trigram Dice. Its ceiling is paraphrase
   coverage (a real embedding model would capture more); the harness and the
   precision-curve mechanics are what transfer.
3. **Math in two languages.** TS for the browser, Python for the canonical
   backend, pinned by identical test cases.

## What did not work

- **The lexical proxy merges near-duplicate intents.** At threshold 0.6 the
  false-hit rate is 100% because "returns policy" and "return a damaged item"
  are lexically near-identical. A real semantic cache fixes this with embeddings
  or a judge — the demo exists to *show* the failure before it costs you money.

## Run it

```bash
pnpm install && pnpm dev      # http://localhost:3000
pnpm test                     # 10 vitest tests
cd backend && uv sync --extra dev && uv run pytest   # 6 tests
```

## Stack

Next.js 16 · TypeScript · Vitest · Tailwind v4 · Python 3.14 · pytest
