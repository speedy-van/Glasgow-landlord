import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { seedProducts, seedSettings } from "../lib/seed.ts";
import { migrationTableSql, migrationSql } from "../lib/migrations.ts";

if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before running migrations.");
const sql = neon(process.env.DATABASE_URL);
const migrations = [];
for (const id of ["001-initial", "002-admin"]) {
  const source = await readFile(
    new URL(`../sql/${id}.sql`, import.meta.url),
    "utf8",
  );
  migrations.push(sql.query(migrationSql(id, source), []));
}
await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(hashtextextended('furnishing-schema',0))`,
  sql.query(migrationTableSql, []),
  ...migrations,
  sql`INSERT INTO site_settings(id,data,version) VALUES(1,${JSON.stringify(seedSettings)}::jsonb,1) ON CONFLICT(id) DO NOTHING`,
  ...seedProducts.map(
    (p) =>
      sql`INSERT INTO products(id,slug,title,category,description,finish,price_pence,stock,images,active,featured,version) VALUES(${p.id},${p.slug},${p.title},${p.category},${p.description},${p.finish},${p.pricePence},${p.stock},${JSON.stringify(p.images)}::jsonb,${p.active},${p.featured},1) ON CONFLICT(id) DO NOTHING`,
  ),
]);
console.log(
  "Neon migrations completed atomically. Existing records and administrator accounts were preserved.",
);
