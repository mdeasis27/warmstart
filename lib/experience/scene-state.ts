import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { ReplayResult } from "@/lib/cache/cache";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";

const CELL: Record<ReplayResult["outcomes"][number], TapeStatus> = { exact: "served", semantic: "served", miss: "rerouted", false: "lost" };

export function warmstartCells(outcomes: readonly ReplayResult["outcomes"][number][], revealed: number): TapeStatus[] {
  return outcomes.map((o, i) => (i >= revealed ? "pending" : CELL[o]));
}

/** The trace has three summary steps, not one per question: reveal the tape in proportion. */
export function revealedQuestions(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return n;
  return Math.ceil((n * frame.visible) / frame.total);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };
