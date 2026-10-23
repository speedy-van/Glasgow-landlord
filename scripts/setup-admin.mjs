import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { administratorEmails } from "../lib/config.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
let raw = "";
for await (const chunk of process.stdin) {
  raw += chunk;
  if (raw.length > 3000) throw new Error("Administrator input is too large.");
}
const input = z
  .object({ email: z.string().email(), password: z.string().min(12).max(128) })
  .parse(JSON.parse(raw));
raw = "";
const email = input.email.toLowerCase();
if (!administratorEmails().includes(email))
  throw new Error("Administrator email is not allowed.");
const sql = neon(process.env.DATABASE_URL);
const hash = await hashPassword(input.password);
const id = randomUUID();
const result = await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(hashtextextended(${"admin-provision:" + email},0))`,
  sql`WITH inserted AS (
    INSERT INTO admin_users(id,name,email,"emailVerified") VALUES(${id},${"Administrator"},${email},false)
    ON CONFLICT(email) DO NOTHING RETURNING id
  ) INSERT INTO admin_accounts(id,"accountId","providerId","userId",password,"updatedAt")
    SELECT ${randomUUID()},id,${"credential"},id,${hash},now() FROM inserted RETURNING id`,
]);
console.log(
  JSON.stringify({
    administrator: result[1].length ? "created" : "existing account preserved",
  }),
);
