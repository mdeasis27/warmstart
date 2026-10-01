// scripts/seed.mjs
// Creates the warmstart schema + tables and seeds the cache_entries table with
// the known queries the semantic cache is warmed against. Lookups start empty —
// they accumulate as the dashboard runs.
// Run: node scripts/seed.mjs  (requires DATABASE_URL in env or .env.local)

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const ENTRIES = [
  ["¿Dónde está mi pedido?", "order_status"],
  ["¿cuándo llega mi compra?", "order_status"],
  ["¿Cómo funcionan las devoluciones?", "returns_policy"],
  ["quiero devolver un producto, ¿cómo?", "returns_policy"],
  ["¿Cómo devuelvo un producto dañado?", "returns_damaged"],
  ["¿puedo devolver lo que compré si llegó dañado?", "returns_damaged"],
  ["¿Envían a Canadá?", "shipping_canada"],
  ["hacen envíos a Canadá", "shipping_canada"],
  ["¿Cómo pago mi factura?", "payment_methods"],
  ["¿puedo pagar con tarjeta?", "payment_methods"],
  ["¿Cómo cambio mi dirección de envío?", "change_address"],
  ["necesito actualizar mi dirección", "change_address"],
];

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS warmstart`;
  await sql`DROP TABLE IF EXISTS warmstart.lookups`;
  await sql`DROP TABLE IF EXISTS warmstart.cache_entries`;

  await sql`
    CREATE TABLE warmstart.cache_entries (
      id serial PRIMARY KEY,
      query text NOT NULL,
      intent text NOT NULL
    )`;
  await sql`
    CREATE TABLE warmstart.lookups (
      id serial PRIMARY KEY,
      query text NOT NULL,
      kind text NOT NULL,
      hit boolean NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  for (const [query, intent] of ENTRIES) {
    await sql`INSERT INTO warmstart.cache_entries (query, intent) VALUES (${query}, ${intent})`;
  }

  const [{ c }] = await sql`SELECT count(*)::int AS c FROM warmstart.cache_entries`;
  const [{ l }] = await sql`SELECT count(*)::int AS l FROM warmstart.lookups`;
  console.log(`Seeded warmstart schema: ${c} cache entries, ${l} lookups`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
