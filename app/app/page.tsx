"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { StatusBadge } from "@/design-system/components/status-badge";

interface LookupResult {
  kind: "exact" | "semantic" | "miss";
  hit: boolean;
  intent: string | null;
  cachedQuery: string | null;
  response: string | null;
  error?: string;
}

interface HistoryItem {
  id: number;
  query: string;
  kind: string;
  hit: boolean;
  created_at: string;
}

const KIND_TONE: Record<string, "success" | "warning" | "danger"> = {
  exact: "success",
  semantic: "success",
  miss: "warning",
};

export default function AppPage() {
  const [query, setQuery] = useState("¿Cómo funcionan las devoluciones de productos?");
  const [threshold, setThreshold] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.lookups ?? []);
      }
    } catch {
      /* history is best-effort */
    }
  }

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, threshold }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) loadHistory();
    } catch (err) {
      setResult({ kind: "miss", hit: false, intent: null, cachedQuery: null, response: null, error: err instanceof Error ? err.message : "Error de red" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/history")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setHistory(data.lookups ?? []);
      })
      .catch(() => {
        /* history is best-effort */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Warmstart</h1>
                <p className="text-xs text-muted-foreground">Caché semántica</p>
              </div>
            </div>
          </div>
          <StatusBadge tone="success" dot className="px-3 py-1">
            Postgres en vivo
          </StatusBadge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Consulta la caché semántica</h2>
          <p className="text-sm text-muted-foreground mt-2">
            La caché viene calentada con consultas conocidas. Ajusta el umbral de similitud y
            consulta: cada lookup queda <strong>persistido en Postgres</strong> y aparece en el historial.
          </p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-sm text-foreground">Consulta</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="Escribe una consulta…"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Umbral de similitud</span>
              <span className="font-mono text-sm tabular-nums text-foreground">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={0.9}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-foreground"
            />
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Consultando…" : "Consultar caché"}
          </button>
        </Card>

        {result && (
          <div className="space-y-4">
            {result.error && (
              <Alert tone="danger" title="No se pudo consultar">{result.error}</Alert>
            )}

            {!result.error && (
              <Card className="p-5">
                {result.kind === "miss" ? (
                  <div className="flex items-center gap-3">
                    <StatusBadge tone="warning" dot>miss</StatusBadge>
                    <span className="text-sm text-muted-foreground">
                      Sin coincidencia por encima de {threshold.toFixed(2)} — esta consulta iría al LLM.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge tone={KIND_TONE[result.kind]} dot>hit</StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {result.kind === "exact" ? "Coincidencia exacta" : "Coincidencia semántica"}
                      </span>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Intent detectado</span>
                        <span className="font-mono text-foreground">{result.intent}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Consulta cacheada</span>
                        <span className="text-foreground text-right max-w-[60%]">{result.cachedQuery}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Respuesta servida: </span>
                        <span className="text-foreground">{result.response}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {history.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Historial de lookups (persistido en Postgres)</h3>
            <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consulta</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2.5 text-foreground">{h.query}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={h.hit ? KIND_TONE[h.kind] ?? "success" : "warning"}>
                          {h.kind}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {new Date(h.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
