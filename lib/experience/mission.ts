import { runExperience, type ExperienceInput, type ExperienceResult } from "./adapter";
import type { DemoAdapter } from "@/design-system/demo/types";

export type MissionResult = ExperienceResult & {
  comparison: { selected: ExperienceResult; reference: ExperienceResult };
};

export const runMission: DemoAdapter<ExperienceInput, MissionResult> = async (input, signal, onEvent) => {
  const started = performance.now();
  const run = await runExperience(input, signal, onEvent);
  const reference = await runExperience({ ...input, threshold: .95 }, signal, () => {});
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return { ...run, executionMs: performance.now() - started, result: { ...run.result, comparison: { selected: run.result, reference: reference.result } } };
};
