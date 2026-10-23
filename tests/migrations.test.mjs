import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { migrationTableSql, migrationSql } from "../lib/migrations.ts";

test("migrations apply once, preserve edits and roll back incompatible changes", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(migrationTableSql);
    const source = await readFile(
      new URL("../sql/001-initial.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migrationSql("001-initial", source));
    await db.query("INSERT INTO site_settings(id,data) VALUES(1,$1)", [
      JSON.stringify({ heroTitle: "Preserve this edit" }),
    ]);
    await db.exec(migrationSql("001-initial", source));
    const settings = await db.query(
      "SELECT data FROM site_settings WHERE id=1",
    );
    assert.equal(settings.rows[0].data.heroTitle, "Preserve this edit");
    const auth = await readFile(
      new URL("../sql/002-admin.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migrationSql("002-admin", auth));
    await db.exec(migrationSql("002-admin", auth));
    await assert.rejects(
      db.exec(
        migrationSql(
          "003-invalid",
          "CREATE TABLE rollback_check (id integer); SELECT missing_column FROM products;",
        ),
      ),
    );
    const tables = await db.query(
      "SELECT tablename FROM pg_tables WHERE tablename='rollback_check'",
    );
    assert.equal(tables.rows.length, 0);
    assert.equal(
      (await db.query("SELECT id FROM schema_migrations")).rows.length,
      2,
    );
  } finally {
    await db.close();
  }
});
