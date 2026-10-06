"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { FlowDiagram, type FlowTone } from "@/design-system/demo/flow-diagram";
import type { ReplayResult } from "@/lib/cache/cache";
import { revealedQuestions, warmstartCells } from "./scene-state";
import { STORY } from "./story";

const POS = { clients: { x: 10, y: 95 }, cache: { x: 230, y: 95 }, saved: { x: 470, y: 20 }, kitchen: { x: 470, y: 170 } } as const;

export function WarmstartStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: ReplayResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const cells = warmstartCells(result.outcomes, revealedQuestions(frame, result.outcomes.length, reduced));
  const c = tapeCounts(cells);
  const tone: Record<keyof typeof POS, FlowTone> = {
    clients: "idle",
    cache: "active",
    saved: c.lost > 0 ? "danger" : c.served > 0 ? "success" : "idle",
    kitchen: c.rerouted > 0 ? "success" : "idle",
  };
  const nodes = (Object.keys(POS) as (keyof typeof POS)[]).map(id => ({ id, ...POS[id], ...copy.nodes[id], tone: tone[id] }));
  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <FlowDiagram nodes={nodes} width={640} height={260} ariaLabel={copy.reusedOf(c.served, result.total)} statusLabels={copy.statusLabels} edges={[
      { from: "clients", to: "cache" },
      { from: "cache", to: "saved", tone: c.lost > 0 ? "danger" : c.served > 0 ? "success" : "idle" },
      { from: "cache", to: "kitchen", tone: c.rerouted > 0 ? "success" : "idle" },
    ]} />
    <div className="mt-6">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={12} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.reusedOf(c.served, result.total)}</p>
    </div>
  </StoryStage>;
}
