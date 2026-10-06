import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { customerAt, firstWrong, revealedQuestions, warmstartCells } from "./scene-state";
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

it("reveals one question per playback step, all of them when complete", () => {
  expect(revealedQuestions({ visible: 17, total: 48, complete: false }, 48)).toBe(17);
  expect(revealedQuestions({ visible: 48, total: 48, complete: true }, 48)).toBe(48);
  expect(revealedQuestions({ visible: 0, total: 0, complete: true }, 48)).toBe(48);
});

const result = {
  outcomes: ["miss", "exact", "false", "false"] as const,
  servedIntents: [null, "order", "damaged", "order"],
  questions: [{ query: "where is it", intent: "order" }, { query: "where is it", intent: "order" }, { query: "can I return it", intent: "policy" }, { query: "pay by card", intent: "pay" }],
};

it("describes each customer from the run: what was asked and what was served", () => {
  expect(customerAt(result, 0)).toEqual({ number: 1, query: "where is it", asked: "order", served: null, outcome: "miss" });
  expect(customerAt(result, 2)).toEqual({ number: 3, query: "can I return it", asked: "policy", served: "damaged", outcome: "false" });
});

it("finds the first wrong answer among the customers already served", () => {
  expect(firstWrong(result, 2)).toBeUndefined();
  expect(firstWrong(result, 4)?.number).toBe(3);
});
