"use client";

import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { Meter } from "@/design-system/components/meter";
import { StatusBadge } from "@/design-system/components/status-badge";
import { getDashboard, getPrecisionCurve, TUNED_THRESHOLD } from "@/lib/cache/demo";

const DASH = getDashboard();
const CURVE = getPrecisionCurve();

export default function AppPage() {
  const tuned = DASH.tuned;
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
          <StatusBadge tone="info" dot className="px-3 py-1">
            Demo mode
          </StatusBadge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Hit rate" value={`${(tuned.hitRate * 100).toFixed(1)}%`} tone="success" hint={`umbral ${TUNED_THRESHOLD}`} />
          <MetricCard label="Ahorro" value={`${(tuned.savingsPct * 100).toFixed(0)}%`} hint={`$${tuned.costUsd.toFixed(2)} vs $${tuned.baselineCostUsd.toFixed(2)}`} />
          <MetricCard label="Falsos hits" value={`${(tuned.falseHitRate * 100).toFixed(0)}%`} tone={tuned.falseHitRate === 0 ? "success" : "danger"} />
          <MetricCard label="Queries" value={tuned.total} hint={`${tuned.exactHits} exactas · ${tuned.semanticHits} semánticas`} />
        </div>

        {/* Breakdown */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Desglose del replay</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {tuned.total} consultas con forma de producción (~60% son las mismas preguntas reformuladas).
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard label="Exact hits" value={tuned.exactHits} />
            <MetricCard label="Semantic hits" value={tuned.semanticHits} />
            <MetricCard label="Falsos hits" value={tuned.falseHits} tone={tuned.falseHits === 0 ? "success" : "danger"} />
            <MetricCard label="Misses" value={tuned.misses} />
          </div>
        </section>

        {/* Precision curve */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Curva de precisión</h2>
          <p className="text-sm text-muted-foreground mb-5">
            El umbral de similitud es una decisión de negocio: cuánto error te puedes permitir.
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Umbral</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hit rate</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">False-hit rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {CURVE.map((row) => (
                  <tr key={row.threshold} className={row.threshold === TUNED_THRESHOLD ? "bg-accent/5" : ""}>
                    <td className="px-5 py-3 text-foreground">
                      {row.threshold.toFixed(1)}
                      {row.threshold === TUNED_THRESHOLD && <span className="ml-2 text-xs text-accent">elegido</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{(row.hitRate * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={row.falseHitRate === 0 ? "text-success" : "text-danger"}>
                        {(row.falseHitRate * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Bajar el umbral a 0.4 sube el hit rate al 86.7% pero introduce un 30% de respuestas
            equivocadas. En 0.8, cero falsos hits manteniendo 82.5% de aciertos.
          </p>
        </section>

        {/* Version bust */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Cambio de prompt invalida la caché</h2>
          <p className="text-sm text-muted-foreground mb-5">
            La clave incluye la versión del system prompt, así que una consulta v4 nunca sirve una respuesta v3.
          </p>
          <div className="space-y-3">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">Cache calentada con v3</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{DASH.bust.warmedEntries} entradas</span>
              </div>
              <Meter value={DASH.bust.warmedEntries} max={DASH.bust.warmedEntries} tone="success" />
            </Card>
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">Consultas v4 que aciertan contra v3</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{DASH.bust.v4Hits}</span>
              </div>
              <Meter value={DASH.bust.v4Hits} max={DASH.bust.warmedEntries} tone="info" />
              <Alert tone={DASH.bust.v4Hits === 0 ? "success" : "danger"}>
                {DASH.bust.v4Hits === 0
                  ? "Cero aciertos: la versión está en la clave, no se sirve comportamiento de ayer."
                  : "Fuga: se sirvieron respuestas de una versión anterior."}
              </Alert>
            </Card>
          </div>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Warmstart · Caché semántica para LLM APIs · Demo mode</span>
          <a href="https://github.com/mdeasis27/warmstart" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
