"use client";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape } from "@/design-system/demo/project-story";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import type { ExperienceResult } from "./adapter";
import { customerAt, firstWrong, revealedQuestions, warmstartCells } from "./scene-state";
import { STORY } from "./story";

// The waiter waits next to the customer at the door, walks to the shelf or the kitchen, and comes back with the plate.
const SERVE = "translate(136px,112px)";
const KEYFRAMES = `
@keyframes ws-shelf { 0% { transform: ${SERVE} } 40% { transform: translate(196px,52px) } 85%, 100% { transform: ${SERVE} } }
@keyframes ws-kitchen { 0% { transform: ${SERVE} } 40% { transform: translate(196px,168px) } 85%, 100% { transform: ${SERVE} } }
@keyframes ws-plate { 0%, 45% { opacity: 0 } 55%, 100% { opacity: 1 } }
@keyframes ws-arrive { 0% { opacity: 0; transform: translateX(-24px) } 30%, 100% { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .ws-anim { animation: none !important } }`;
const PLATE = { exact: "fill-success", semantic: "fill-success", miss: "fill-info", false: "fill-danger" } as const;

export function WarmstartStoryScene({ frame, result, locale }: { frame: PlaybackFrame<TraceEvent>; result: ExperienceResult; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const total = result.outcomes.length;
  const revealed = revealedQuestions(frame, total);
  const done = revealed >= total;
  const cells = warmstartCells(result.outcomes, revealed);
  const c = tapeCounts(cells);
  const wrong = firstWrong(result, revealed);
  // At the end the scene rests on the first wrong answer, if there was one.
  const focus = revealed === 0 ? undefined : done && wrong ? wrong : customerAt(result, revealed - 1);
  const dish = (intent: string) => copy.intents[intent] ?? intent;
  const kitchen = focus?.outcome === "miss";
  const summary = `${copy.reusedOf(c.served, total)}. ${STORY[locale].compare.verdict(c.lost)}.`;

  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={revealed} total={total}>
    <div data-waiter-scene className="min-w-0">
      <p className="font-mono text-sm font-semibold">{focus ? copy.customerOf(focus.number, total) : ""}</p>
      <svg viewBox="0 0 400 222" className="mt-2 block h-auto w-full" role="img" aria-label={done ? summary : focus ? `${copy.customerOf(focus.number, total)}: ${dish(focus.served ?? focus.asked)}` : copy.title}>
        <style>{KEYFRAMES}</style>
        <rect x="10" y="62" width="34" height="96" rx="4" className="fill-none stroke-muted-foreground" />
        <text x="27" y="180" fontSize="13" textAnchor="middle" className="fill-muted-foreground">{copy.places.door}</text>

        <g className={kitchen ? "opacity-50" : undefined}>
          <rect x="230" y="8" width="162" height="88" rx="8" className={`fill-success/10 stroke-success ${focus && !kitchen ? "stroke-2" : ""}`} />
          <text x="311" y="34" fontSize="15" fontWeight="600" textAnchor="middle" className="fill-foreground">{copy.places.shelf}</text>
          <text x="311" y="53" fontSize="13" textAnchor="middle" className="fill-muted-foreground">{copy.places.shelfSub}</text>
          {[266, 296, 326, 356].map(x => <circle key={x} cx={x} cy="76" r="9" className="fill-success/70" />)}
        </g>
        <g className={focus && !kitchen ? "opacity-50" : undefined}>
          <rect x="230" y="126" width="162" height="88" rx="8" className={`fill-info/10 stroke-info ${kitchen ? "stroke-2" : ""}`} />
          <text x="311" y="152" fontSize="15" fontWeight="600" textAnchor="middle" className="fill-foreground">{copy.places.kitchen}</text>
          <text x="311" y="171" fontSize="13" textAnchor="middle" className="fill-muted-foreground">{copy.places.kitchenSub}</text>
          <path d="M283 200 q14 -18 28 0 q14 -18 28 0" fill="none" strokeWidth="3" className="stroke-info" />
        </g>

        {focus ? <g key={`c${focus.number}`} className="ws-anim" style={{ animation: "ws-arrive 700ms ease-out" }}>
          <circle cx="74" cy="120" r="14" className="fill-muted-foreground" />
          <circle cx="74" cy="96" r="9" className="fill-muted-foreground" />
        </g> : null}
        {focus ? <g key={`w${focus.number}`} className="ws-anim" style={{ transform: SERVE, animation: `${kitchen ? "ws-kitchen" : "ws-shelf"} 700ms ease-in-out` }}>
          <circle cx="0" cy="-30" r="10" className="fill-foreground" />
          <circle cx="0" cy="0" r="17" className="fill-foreground" />
          <rect x="-11" y="-3" width="22" height="18" className="fill-background" opacity=".85" />
          <g className="ws-anim" style={{ animation: "ws-plate 700ms linear" }}>
            <circle cx="-30" cy="-6" r="12" className={PLATE[focus.outcome]} />
            {focus.outcome === "false" ? <text x="-30" y="0" fontSize="17" fontWeight="700" textAnchor="middle" className="fill-white">×</text> : null}
          </g>
        </g> : <g style={{ transform: SERVE }}><circle cx="0" cy="-30" r="10" className="fill-foreground" /><circle cx="0" cy="0" r="17" className="fill-foreground" /></g>}
      </svg>

      {focus ? <div className="mt-3 space-y-2 text-sm leading-6">
        <p className="rounded-lg border border-border bg-background px-3 py-2">“{focus.query}”</p>
        <p>{focus.outcome === "false" ? copy.brought.wrong : kitchen ? copy.brought.fresh : copy.brought.usual} <strong>{dish(focus.served ?? focus.asked)}</strong></p>
      </div> : null}
      <p data-wrong-note className="mt-2 min-h-6 text-sm font-medium text-danger">{wrong ? copy.wrongNote(wrong.number, dish(wrong.asked), dish(wrong.served ?? wrong.asked)) : ""}</p>

      <div className="mt-5">
        <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={12} />
        <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.reusedOf(c.served, total)}</p>
        <p role="status" className="sr-only">{done ? summary : ""}</p>
      </div>
    </div>
  </StoryStage>;
}
