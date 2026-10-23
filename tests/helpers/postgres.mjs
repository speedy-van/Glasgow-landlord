import { PGlite } from "@electric-sql/pglite";

// A real PostgreSQL engine for offline schema and authentication tests.
// Kysely only needs this pg-compatible interface; production uses Neon Pool.
export async function postgresTestPool() {
  const database = await PGlite.create();
  const client = {
    async query(text, parameters = []) {
      const result = await database.query(text, parameters);
      return { ...result, rowCount: result.affectedRows ?? result.rows.length };
    },
    release() {},
    on() {
      return client;
    },
    off() {
      return client;
    },
  };
  return {
    database,
    async connect() {
      return client;
    },
    query: client.query,
    async end() {
      await database.close();
    },
  };
}
