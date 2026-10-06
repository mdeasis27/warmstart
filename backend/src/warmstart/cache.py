"""Three-layer cache — mirrors lib/cache/cache.ts."""

from __future__ import annotations

import re
import unicodedata


def normalize(text: str) -> str:
    folded = "".join(
        c for c in unicodedata.normalize("NFD", text.lower()) if not unicodedata.combining(c)
    )
    return folded


def _char_ngrams(text: str, n: int = 3) -> set[str]:
    s = re.sub(r"[^a-z0-9]", "", normalize(text))
    return {s[i : i + n] for i in range(len(s) - n + 1)}


def similarity(a: str, b: str) -> float:
    ta, tb = _char_ngrams(a), _char_ngrams(b)
    if not ta and not tb:
        return 1.0
    inter = len(ta & tb)
    return (2 * inter) / (len(ta) + len(tb))


def _hash(s: str) -> str:
    h = 5381
    for ch in s:
        h = ((h << 5) + h + ord(ch)) & 0xFFFFFFFF
    return f"{h:08x}"


def exact_key(query: str, params: dict) -> str:
    return _hash(f"{params['model']}|{params['temperature']}|{params['tier']}|{params['promptVersion']}::{query}")


def create_cache(threshold: float) -> dict:
    exact: dict[str, dict] = {}
    semantic: list[dict] = []

    def _params_key(params: dict) -> str:
        return f"{params['model']}|{params['temperature']}|{params['tier']}|{params['promptVersion']}"

    def get(query: str, params: dict, intent: str) -> dict:
        key = exact_key(query, params)
        if key in exact:
            return {"kind": "exact", "entry": exact[key]}
        best = None
        for entry in semantic:
            if _params_key(entry["params"]) != _params_key(params):
                continue
            sim = similarity(query, entry["query"])
            if sim >= threshold and (best is None or sim > best[0]):
                best = (sim, entry)
        if best is not None:
            entry = best[1]
            return {"kind": "semantic", "entry": entry, "falseHit": entry["intent"] != intent}
        return {"kind": "miss"}

    def put(entry: dict) -> None:
        exact[exact_key(entry["query"], entry["params"])] = entry
        semantic.append(entry)

    def invalidate_prompt_version(version: str) -> int:
        removed = 0
        for key, entry in list(exact.items()):
            if entry["params"]["promptVersion"] == version:
                del exact[key]
                removed += 1
        for entry in list(semantic):
            if entry["params"]["promptVersion"] == version:
                semantic.remove(entry)
                removed += 1
        return removed

    return {"get": get, "put": put, "invalidatePromptVersion": invalidate_prompt_version}


MISS_COST_USD = 0.01
HIT_COST_USD = 0.001


def replay(workload: list[dict], params: dict, threshold: float) -> dict:
    cache = create_cache(threshold)
    exact_hits = semantic_hits = false_hits = misses = 0
    outcomes = []
    served_intents = []
    for item in workload:
        hit = cache["get"](item["query"], params, item["intent"])
        outcomes.append("false" if hit["kind"] == "semantic" and hit.get("falseHit") else hit["kind"])
        served_intents.append(hit["entry"]["intent"] if "entry" in hit else None)
        if hit["kind"] == "exact":
            exact_hits += 1
        elif hit["kind"] == "semantic":
            semantic_hits += 1
            if hit.get("falseHit"):
                false_hits += 1
        else:
            misses += 1
            cache["put"]({
                "params": params,
                "query": item["query"],
                "intent": item["intent"],
                "response": f"respuesta para {item['query']}",
            })
    total = len(workload)
    hits = exact_hits + semantic_hits
    cost = hits * HIT_COST_USD + misses * MISS_COST_USD
    baseline = total * MISS_COST_USD
    return {
        "total": total,
        "exactHits": exact_hits,
        "semanticHits": semantic_hits,
        "falseHits": false_hits,
        "misses": misses,
        "hitRate": hits / total if total else 0.0,
        "falseHitRate": false_hits / semantic_hits if semantic_hits else 0.0,
        "costUsd": cost,
        "baselineCostUsd": baseline,
        "savingsPct": 1 - cost / baseline if baseline else 0.0,
        "outcomes": outcomes,
        "servedIntents": served_intents,
    }
