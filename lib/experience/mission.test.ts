import { expect, test } from "vitest";
import { runMission } from "./mission";

const input = { batchSize: 8, threshold: .35, promptVersion: "v1", queriesText: "reset password | access\nreset billing password | billing\nreset password | access" };

test("same labeled queries expose the false hit introduced by loose similarity", async () => {
  const run = await runMission(input, new AbortController().signal, () => {});
  expect(run.result.comparison.selected.falseHits).toBe(1);
  expect(run.result.comparison.reference.falseHits).toBe(0);
  expect(run.result.comparison.selected.total).toBe(3);
  expect(run.result.comparison.reference.total).toBe(3);
  expect(run.result.comparison.selected.costCents).toBe(1);
  expect(run.result.comparison.reference.costCents).toBe(2);
  expect(run.input).toEqual(input);
});

test("equal thresholds yield equal cache outcomes without a savings claim", async () => {
  const run = await runMission({ ...input, threshold: .95 }, new AbortController().signal, () => {});
  expect(run.result.comparison.selected).toEqual(run.result.comparison.reference);
});

test("cancellation stops both runs and exposes no comparison", async () => {
  const controller = new AbortController();
  await expect(runMission(input, controller.signal, () => controller.abort())).rejects.toMatchObject({ name: "AbortError" });
});
