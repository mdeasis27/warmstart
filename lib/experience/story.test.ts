import { describe, expect, it } from "vitest";
import { STORY } from "./story";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

describe("Warmstart story copy", () => {
  it("has the same shape in English and Spanish", () => {
    // Heading.before/after are optional word-order slots that legitimately differ between languages.
    const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];
    expect(keys(STORY.es)).toEqual(keys(STORY.en));
    expect(STORY.es.analogy.dictionary).toHaveLength(STORY.en.analogy.dictionary.length);
  });

  it("has no empty strings except the owner-supplied why note", () => {
    for (const locale of ["en", "es"] as const) {
      const { why, ...rest } = STORY[locale];
      expect(why.title.trim()).not.toBe("");
      for (const s of strings(rest)) expect(s.trim(), `${locale}: empty string`).not.toBe("");
    }
  });

  it("avoids AI-sounding patterns and brand names", () => {
    for (const locale of ["en", "es"] as const) expect(lintStory(STORY[locale]), locale).toEqual([]);
  });

  it("states the comparison truthfully at a gap, a tie, zero and the reverse case", () => {
    expect(STORY.es.compare.sentence(3, 0)).toBe("Con tu ajuste, 3 clientes recibieron la respuesta de otro. Con 95%, ninguno.");
    expect(STORY.es.compare.sentence(1, 0)).toContain("un cliente recibió");
    expect(STORY.es.compare.sentence(0, 0)).toContain("Ningún ajuste");
    expect(STORY.es.compare.sentence(2, 2)).toBe("Los dos ajustes dieron 2 respuestas equivocadas.");
    expect(STORY.es.compare.sentence(1, 2)).toContain("el ajuste estricto se equivocó más");
    expect(STORY.en.compare.sentence(3, 0)).toBe("With your setting, 3 customers got someone else's answer. At 95%, nobody did.");
    expect(STORY.en.compare.sentence(1, 1)).toBe("Both settings gave 1 wrong answer.");
    expect(STORY.en.compare.sentence(1, 2)).toContain("the strict setting made more mistakes");
  });

  it("asks the bet about the similarity the visitor chose", () => {
    expect(STORY.en.tryIt.question(.65)).toContain("minimum similarity of 65%");
    expect(STORY.es.tryIt.question(.78)).toContain("parecido mínimo de 78%");
  });

  it("keeps the one-liner the hub shows on the card", () => {
    expect(STORY.es.oneLiner).toBe("Reutiliza respuestas que ya diste, sin darle a nadie la respuesta de otro.");
  });
});
