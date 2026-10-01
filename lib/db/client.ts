// lib/db/client.ts
// Real Postgres access (Neon serverless) for the Warmstart demo. The schema is
// isolated under the "warmstart" Postgres schema so sibling projects can share
// the same database without table collisions.

import { neon } from "@neondatabase/serverless";

export const DB_SCHEMA = "warmstart";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}
