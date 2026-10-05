import { StoryBrief, ScenarioPicker } from "@/design-system/demo/decision-lab";
import story from "@/docs/quality/business-story.json";
export type StoryVisualKind = string;
export function DecisionNarrative({ locale, selected, onScenario }: {
  kind?: StoryVisualKind; locale: "en" | "es"; selected: string; onScenario: (id: string) => void;
}) {
  const s = story[locale];
  const es = locale === "es";
  return <>
    <StoryBrief locale={locale} story={{
      eyebrow: es ? "Laboratorio de decisión" : "Decision lab",
      mission: es ? "Reutiliza respuestas con un límite visible por versión de prompt." : "Reuse answers with a visible prompt-version boundary.",
      context: s.problem, role: s.user, decision: s.decision, stakes: s.value,
    }} />
    <ScenarioPicker locale={locale} selected={selected} onSelect={onScenario} options={[
      { id: "a", label: s.scenarioA.title, description: s.scenarioA.input },
      { id: "b", label: s.scenarioB.title, description: s.scenarioB.input },
    ]} />
  </>;
}
