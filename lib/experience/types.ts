export type DemoMode = "local" | "simulation" | "live";
export type TraceEvent = { id: string; step: number; kind: string; messageKey: string; timestampMs: number; evidenceIds?: string[] };
export type DemoRun<I, R> = { input: I; result: R; trace: TraceEvent[]; executionMs: number; mode: DemoMode };
export type DemoAdapter<I, R> = (input: I, signal: AbortSignal, onEvent: (event: TraceEvent) => void) => Promise<DemoRun<I, R>>;
