import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { revealedQuestions, warmstartCells } from "./scene-state";
import { runMission } from "./mission";

it("maps outcomes to tape cells and hides the unrevealed ones", () => {
  expect(warmstartCells(["exact", "semantic", "miss", "false", "exact"], 4)).toEqual(["served", "served", "rerouted", "lost", "pending"]);
});

it("final tape counts equal the engine totals", async () => {
  const run = await runMission({ batchSize: 48, threshold: .65, promptVersion: "v1" }, new AbortController().signal, () => {});
  const r = run.result;
  const counts = tapeCounts(warmstartCells(r.outcomes, r.outcomes.length));
  expect(counts).toEqual({ served: r.exactHits + r.semanticHits - r.falseHits, rerouted: r.misses, lost: r.falseHits, pending: 0 });
});

it("reveals questions in proportion to the playback, all of them when complete or under reduced motion", () => {
  expect(revealedQuestions({ visible: 1, total: 3, complete: false }, 48, false)).toBe(16);
  expect(revealedQuestions({ visible: 2, total: 3, complete: false }, 48, false)).toBe(32);
  expect(revealedQuestions({ visible: 3, total: 3, complete: true }, 48, false)).toBe(48);
  expect(revealedQuestions({ visible: 1, total: 3, complete: false }, 48, true)).toBe(48);
  expect(revealedQuestions({ visible: 0, total: 0, complete: false }, 48, false)).toBe(48);
});
