export const migrationTableSql =
  "CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())";

export function migrationSql(id: string, source: string) {
  if (!/^\d{3}-[a-z-]+$/.test(id) || source.includes("$app_migration$"))
    throw new Error("Invalid migration input");
  const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'";
  return `DO $app_migration$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE id=${literal(id)}) THEN
      EXECUTE ${literal(source)};
      INSERT INTO schema_migrations(id) VALUES(${literal(id)});
    END IF;
  END $app_migration$;`;
}
