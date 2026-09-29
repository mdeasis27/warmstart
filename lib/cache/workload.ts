// lib/cache/workload.ts
// Production-shaped query workload: ~60% of traffic is the same handful of
// questions rephrased, plus a few near-duplicate "lookalike" queries that risk
// false semantic hits.

export type Intent = {
  id: string;
  variants: string[];
};

export const INTENTS: Intent[] = [
  {
    id: "order_status",
    variants: [
      "¿Dónde está mi pedido?",
      "quiero saber el estado de mi pedido",
      "mi orden no ha llegado, ¿dónde está?",
      "¿cuándo llega mi compra?",
    ],
  },
  {
    id: "returns_policy",
    variants: [
      "¿Cómo funcionan las devoluciones?",
      "cuál es la política de devoluciones",
      "quiero devolver un producto, ¿cómo?",
      "¿puedo devolver lo que compré?",
    ],
  },
  {
    id: "returns_damaged",
    variants: [
      "¿Cómo devuelvo un producto dañado?",
      "recibí algo dañado, ¿cómo lo devuelvo?",
      "mi pedido llegó dañado, ¿qué hago?",
      "¿puedo devolver lo que compré si llegó dañado?",
    ],
  },
  {
    id: "shipping_canada",
    variants: [
      "¿Envían a Canadá?",
      "hacen envíos a Canadá",
      "¿hay envío internacional a Canadá?",
    ],
  },
  {
    id: "payment_methods",
    variants: [
      "¿Cómo pago mi factura?",
      "qué métodos de pago aceptan",
      "¿puedo pagar con tarjeta?",
    ],
  },
  {
    id: "change_address",
    variants: [
      "¿Cómo cambio mi dirección de envío?",
      "necesito actualizar mi dirección",
      "¿dónde edito mi dirección?",
    ],
  },
];

/** Deterministic pseudo-random generator so replays are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weighted so the first few intents dominate, like real support traffic. */
const WEIGHTS = [0.3, 0.22, 0.16, 0.12, 0.12, 0.08];

export function generateWorkload(n: number, seed = 42): { query: string; intent: string }[] {
  const rng = mulberry32(seed);
  const out: { query: string; intent: string }[] = [];
  for (let i = 0; i < n; i += 1) {
    let r = rng();
    let idx = 0;
    for (let j = 0; j < WEIGHTS.length; j += 1) {
      r -= WEIGHTS[j];
      if (r <= 0) {
        idx = j;
        break;
      }
      idx = j;
    }
    const intent = INTENTS[idx];
    const variant = intent.variants[Math.floor(rng() * intent.variants.length)];
    out.push({ query: variant, intent: intent.id });
  }
  return out;
}
