from warmstart.cache import create_cache, similarity, replay

PARAMS = {"model": "m", "temperature": 0, "tier": "free", "promptVersion": "v1"}


def test_similarity_related_vs_unrelated():
    related = similarity("¿dónde está mi pedido?", "quiero saber el estado de mi pedido")
    unrelated = similarity("¿dónde está mi pedido?", "¿cómo pago mi factura?")
    assert related > unrelated


def test_similarity_identical():
    assert similarity("hola", "hola") == 1.0


def test_exact_hit():
    cache = create_cache(0.6)
    cache["put"]({"params": PARAMS, "query": "¿dónde está mi pedido?", "intent": "x", "response": "r"})
    assert cache["get"]("¿dónde está mi pedido?", PARAMS, "x")["kind"] == "exact"


def test_semantic_false_hit():
    cache = create_cache(0.6)
    cache["put"]({"params": PARAMS, "query": "¿puedo devolver lo que compré?", "intent": "policy", "response": "r"})
    hit = cache["get"]("¿puedo devolver lo que compré si llegó dañado?", PARAMS, "damaged")
    assert hit["kind"] == "semantic"
    assert hit["falseHit"] is True


def test_prompt_version_invalidation():
    cache = create_cache(0.6)
    cache["put"]({"params": PARAMS, "query": "q", "intent": "i", "response": "r"})
    cache["invalidatePromptVersion"]("v1")
    assert cache["get"]("q", PARAMS, "i")["kind"] == "miss"


def test_replay_savings():
    workload = [
        {"query": "¿dónde está mi pedido?", "intent": "a"},
        {"query": "¿dónde está mi pedido?", "intent": "a"},
        {"query": "quiero saber dónde está mi pedido", "intent": "a"},
        {"query": "¿cómo pago mi factura?", "intent": "b"},
    ]
    r = replay(workload, PARAMS, 0.6)
    assert r["hitRate"] > 0.25
    assert r["costUsd"] < r["baselineCostUsd"]


import json
from pathlib import Path

# One fixture for both runners: vitest imports the same file.
FIXTURE = json.loads((Path(__file__).resolve().parents[2] / "lib" / "cache" / "fixtures" / "outcomes.json").read_text(encoding="utf-8"))


def test_outcomes_match_shared_fixture():
    for case in FIXTURE["cases"]:
        r = replay(FIXTURE["workload"], FIXTURE["params"], case["threshold"])
        assert r["outcomes"] == case["outcomes"], case["threshold"]
        assert r["servedIntents"] == case["servedIntents"], case["threshold"]


def test_served_intent_matches_outcome():
    r = replay(FIXTURE["workload"], FIXTURE["params"], 0.35)
    assert "false" in r["outcomes"]
    for o, served, item in zip(r["outcomes"], r["servedIntents"], FIXTURE["workload"]):
        if o == "miss":
            assert served is None
        elif o == "false":
            assert served != item["intent"]
        else:
            assert served == item["intent"]
