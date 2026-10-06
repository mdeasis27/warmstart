import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { ReplayResult } from "@/lib/cache/cache";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";

type Outcome = ReplayResult["outcomes"][number];
export type SceneRun = { outcomes: readonly Outcome[]; servedIntents: readonly (string | null)[]; questions: readonly { query: string; intent: string }[] };
export type Customer = { number: number; query: string; asked: string; served: string | null; outcome: Outcome };

const CELL: Record<Outcome, TapeStatus> = { exact: "served", semantic: "served", miss: "rerouted", false: "lost" };

export function warmstartCells(outcomes: readonly Outcome[], revealed: number): TapeStatus[] {
  return outcomes.map((o, i) => (i >= revealed ? "pending" : CELL[o]));
}

/** The trace has one step per question; a complete frame (or no trace) shows them all. */
export function revealedQuestions(frame: { visible: number; total: number; complete: boolean }, n: number): number {
  if (frame.complete || frame.total === 0) return n;
  return Math.min(frame.visible, n);
}

export function customerAt(run: SceneRun, i: number): Customer {
  return { number: i + 1, query: run.questions[i].query, asked: run.questions[i].intent, served: run.servedIntents[i], outcome: run.outcomes[i] };
}

/** The first customer handed someone else's answer among the first `revealed`. */
export function firstWrong(run: SceneRun, revealed: number): Customer | undefined {
  const i = run.outcomes.slice(0, revealed).indexOf("false");
  return i < 0 ? undefined : customerAt(run, i);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };
