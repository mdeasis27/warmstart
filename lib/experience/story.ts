import type { Heading } from "@/design-system/demo/project-story";

type NodeCopy = { name: string; sub: string; analogy: string };

export interface WarmstartStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (threshold: number) => string; yes: string; no: string; thresholdLabel: string; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; mine: (threshold: number) => string; strict: string; wrong: string; cost: (cents: number) => string; sentence: (mine: number, strict: number) => string; verdict: (falseHits: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: { title: string; caption: string; statusLabels: { active: string; danger: string; success: string }; tapeLabel: string; nodes: { clients: NodeCopy; cache: NodeCopy; saved: NodeCopy; kitchen: NodeCopy }; tape: { served: string; rerouted: string; lost: string }; reusedOf: (n: number, total: number) => string };
}

const pct = (threshold: number) => Math.round(threshold * 100);

export const STORY: Record<"en" | "es", WarmstartStory> = {
  en: {
    name: "Warmstart",
    oneLiner: "Reuses answers you already gave, without handing anyone someone else's answer.",
    chips: ["Semantic cache", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "The waiter at your usual diner knows your regular order and brings it without asking. That works until you order something close to it but different. If he brings the usual, he got your order wrong.",
        "Warmstart keeps answers that were already worked out and reuses them when an almost identical question comes in. The slider decides how close it has to be.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "the customers", means: "the questions" },
        { term: "the waiter", means: "the cache" },
        { term: "the usual order", means: "a saved answer" },
        { term: "the kitchen", means: "the model working out a new answer" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "Forty-eight customers ask an online store about orders, returns and payments. A third of the answers are already saved.",
      question: (t) => `Before you run it, place a bet: with a minimum similarity of ${pct(t)}%, does any customer get someone else's answer?`,
      yes: "Yes, at least one",
      no: "No, nobody",
      thresholdLabel: "Minimum similarity to reuse an answer",
      note: "Each square is one customer question, in the order they arrived. Lower the slider and the waiter reuses more, and guesses more.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The questions could not be replayed. Try another similarity.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      verdict: (n) => n === 0 ? "Nobody got someone else's answer" : n === 1 ? "1 customer got someone else's answer" : `${n} customers got someone else's answer`,
      heading: { before: "Your setting", accent: "or a strict one" },
      lead: "Same questions, same saved answers. The only change is how close a question has to be.",
      mine: (t) => `Your setting (${pct(t)}%)`,
      strict: "Strict setting (95%)",
      wrong: "wrong answers",
      cost: (cents) => `cost of the batch: ${cents}¢`,
      sentence: (mine, strict) => {
        if (mine === 0 && strict === 0) return "Neither setting gave anyone a wrong answer. The strict one just reused less and cost more.";
        if (mine === strict) return `Both settings gave ${mine} wrong ${mine === 1 ? "answer" : "answers"}.`;
        if (mine < strict) return `This time the strict setting made more mistakes: ${strict} against your ${mine}.`;
        return `With your setting, ${mine === 1 ? "one customer" : `${mine} customers`} got someone else's answer. At 95%, ${strict === 0 ? "nobody did" : strict}.`;
      },
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "When many people ask the same thing in different words. I picture a store's returns questions in the week after the holidays, when half the inbox is some version of \"can I send this back?\".",
      notLabel: "Not needed",
      not: "When every question is unique, or when a wrong answer costs more than working out a fresh one.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I measured the savings together with the mistakes that come with them. Reusing 70% of answers is worthless if one of them tells a customer their return is approved when it isn't.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "Exact cache keyed by model, temperature, tier and prompt version, plus a semantic layer that matches on trigram Dice similarity.",
        "A new prompt version invalidates the semantic entries saved under the old one.",
        "Costs are integer cents; the per-question outcome list is identical in TypeScript and Python, pinned by a shared fixture.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "Where each question was answered",
      caption: "Watch the waiter decide, question by question, whether to bring a saved answer or send it to the kitchen.",
      statusLabels: { active: "deciding", success: "in use", danger: "served a wrong answer" },
      tapeLabel: "Forty-eight customer questions, in order",
      nodes: {
        clients: { name: "Customers", sub: "48 questions", analogy: "the diners" },
        cache: { name: "Warmstart", sub: "reuse or compute", analogy: "the waiter" },
        saved: { name: "Saved answers", sub: "reused", analogy: "the usual order" },
        kitchen: { name: "Model", sub: "fresh answer", analogy: "the kitchen" },
      },
      tape: { served: "reused", rerouted: "worked out again", lost: "wrong answer" },
      reusedOf: (n, total) => `${n} of ${total} answers reused`,
    },
  },
  es: {
    name: "Warmstart",
    oneLiner: "Reutiliza respuestas que ya diste, sin darle a nadie la respuesta de otro.",
    chips: ["Caché semántica", "2 min", "Demo en vivo"],
    analogy: {
      heading: { before: "La", accent: "analogía" },
      paragraphs: [
        "El mesero de tu fonda ya se sabe tu pedido de siempre y lo trae sin preguntar. Funciona hasta que pides algo parecido pero distinto: si te trae lo de siempre, te equivocó el pedido.",
        "Warmstart guarda respuestas que ya se calcularon y las reutiliza cuando llega una pregunta casi igual. El control decide qué tan parecida tiene que ser.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "los clientes", means: "las preguntas" },
        { term: "el mesero", means: "la caché" },
        { term: "el pedido de siempre", means: "una respuesta guardada" },
        { term: "la cocina", means: "el modelo que calcula una respuesta nueva" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Cuarenta y ocho clientes le preguntan a una tienda en línea por pedidos, devoluciones y pagos. Un tercio de las respuestas ya está guardado.",
      question: (t) => `Antes de correrlo, apuesta: con un parecido mínimo de ${pct(t)}%, ¿algún cliente recibe la respuesta de otro?`,
      yes: "Sí, alguno",
      no: "No, ninguno",
      thresholdLabel: "Parecido mínimo para reutilizar una respuesta",
      note: "Cada cuadrito es la pregunta de un cliente, en el orden en que llegó. Si bajas el control, el mesero reutiliza más y adivina más.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "No se pudieron repetir las preguntas. Prueba otro parecido.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      verdict: (n) => n === 0 ? "Nadie recibió la respuesta de otro" : n === 1 ? "1 cliente recibió la respuesta de otro" : `${n} clientes recibieron la respuesta de otro`,
      heading: { before: "Tu ajuste", accent: "o uno estricto" },
      lead: "Las mismas preguntas y las mismas respuestas guardadas. Solo cambia qué tan parecida tiene que ser una pregunta.",
      mine: (t) => `Tu ajuste (${pct(t)}%)`,
      strict: "Ajuste estricto (95%)",
      wrong: "respuestas equivocadas",
      cost: (cents) => `costo del lote: ${cents}¢`,
      sentence: (mine, strict) => {
        if (mine === 0 && strict === 0) return "Ningún ajuste le dio a nadie una respuesta equivocada. El estricto solo reutilizó menos y costó más.";
        if (mine === strict) return `Los dos ajustes dieron ${mine} ${mine === 1 ? "respuesta equivocada" : "respuestas equivocadas"}.`;
        if (mine < strict) return `Esta vez el ajuste estricto se equivocó más: ${strict} contra tus ${mine}.`;
        return `Con tu ajuste, ${mine === 1 ? "un cliente recibió" : `${mine} clientes recibieron`} la respuesta de otro. Con 95%, ${strict === 0 ? "ninguno" : strict}.`;
      },
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve?" },
      worthLabel: "Vale la pena",
      worth: "Cuando mucha gente pregunta lo mismo con otras palabras. Me imagino las preguntas de devoluciones de una tienda la semana después de las fiestas, cuando media bandeja de entrada es alguna versión de \"¿puedo regresar esto?\".",
      notLabel: "No hace falta",
      not: "Cuando cada pregunta es única, o cuando una respuesta equivocada cuesta más que calcular una nueva.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "Medí el ahorro junto con el error que lo acompaña. Un 70% de respuestas reutilizadas no sirve si una de ellas le dice a alguien que su devolución procede cuando no.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Caché exacta por modelo, temperatura, nivel y versión de prompt, más una capa semántica que compara con similitud Dice de trigramas.",
        "Una versión nueva del prompt invalida las entradas semánticas guardadas con la anterior.",
        "Los costos van en centavos enteros; la lista de resultados por pregunta es idéntica en TypeScript y Python, fijada por un fixture compartido.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "Dónde se respondió cada pregunta",
      caption: "Mira cómo el mesero decide, pregunta por pregunta, si trae una respuesta guardada o la manda a la cocina.",
      statusLabels: { active: "decidiendo", success: "en uso", danger: "dio una respuesta equivocada" },
      tapeLabel: "Cuarenta y ocho preguntas de clientes, en orden",
      nodes: {
        clients: { name: "Clientes", sub: "48 preguntas", analogy: "los comensales" },
        cache: { name: "Warmstart", sub: "reutiliza o calcula", analogy: "el mesero" },
        saved: { name: "Respuestas guardadas", sub: "reutilizadas", analogy: "el pedido de siempre" },
        kitchen: { name: "Modelo", sub: "respuesta nueva", analogy: "la cocina" },
      },
      tape: { served: "reutilizada", rerouted: "calculada de nuevo", lost: "respuesta equivocada" },
      reusedOf: (n, total) => `${n} de ${total} respuestas reutilizadas`,
    },
  },
};
