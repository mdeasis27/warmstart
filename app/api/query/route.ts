import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { createCache, type CacheEntry, type CacheParams } from "@/lib/cache/cache";
import { INTENTS } from "@/lib/cache/workload";

const PARAMS: CacheParams = {
  model: "frontier-chat",
  temperature: 0,
  tier: "free",
  promptVersion: "v3",
};

function buildSeed(): CacheEntry[] {
  return INTENTS.map((intent) => ({
    params: PARAMS,
    query: intent.variants[0],
    intent: intent.id,
    response: `respuesta para "${intent.variants[0]}"`,
  }));
}

export async function POST(request: Request) {
  let query: string;
  let threshold: number;
  try {
    const body = await request.json();
    query = typeof body.query === "string" ? body.query.trim() : "";
    threshold =
      typeof body.threshold === "number" && Number.isFinite(body.threshold)
        ? Math.min(1, Math.max(0, body.threshold))
        : 0.8;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: "Escribe una consulta" }, { status: 400 });
  }

  const cache = createCache(threshold);
  for (const entry of buildSeed()) cache.put(entry);

  const hit = cache.get(query, PARAMS, "");
  const isHit = hit.kind !== "miss";

  try {
    const db = getSql();
    await db`INSERT INTO warmstart.lookups (query, kind, hit) VALUES (${query}, ${hit.kind}, ${isHit})`;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error guardando la consulta" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    kind: hit.kind,
    hit: isHit,
    intent: hit.entry?.intent ?? null,
    cachedQuery: hit.entry?.query ?? null,
    response: hit.entry?.response ?? null,
  });
}
