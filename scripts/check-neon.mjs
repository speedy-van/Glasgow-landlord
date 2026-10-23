import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = neon(process.env.DATABASE_URL);
const tables =
  await sql`SELECT tablename FROM pg_tables WHERE schemaname=${"public"} ORDER BY tablename`;
console.log(
  JSON.stringify({
    connected: true,
    tables: tables.map((row) => row.tablename),
  }),
);
