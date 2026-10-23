import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { betterAuth } from "better-auth";
import { authOptions } from "../lib/auth-options.ts";
import { postgresTestPool } from "./helpers/postgres.mjs";

const origin = "http://localhost:3000";
const email = "administrator@example.invalid";
const password = "Test-only-password-unique-891!";
let pool, auth, options;
function request(path, body, cookie, ip = "192.0.2.10", from = origin) {
  return new Request(origin + "/api/auth/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      origin: from,
      "x-forwarded-for": ip,
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function cookieOf(response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
}
before(async () => {
  pool = await postgresTestPool();
  await pool.database.exec(
    await readFile(new URL("../sql/002-admin.sql", import.meta.url), "utf8"),
  );
  options = {
    database: pool,
    secret: "test-only-auth-secret-32-characters-minimum",
    origin,
    administrators: [email],
  };
  const provisioning = betterAuth(
    authOptions({ ...options, allowRegistration: true }),
  );
  await provisioning.api.signUpEmail({
    body: { name: "Administrator", email, password },
  });
  auth = betterAuth(authOptions(options));
});
after(async () => {
  await pool?.end();
});

test("public signup cannot create or take over administrator accounts", async () => {
  const response = await auth.handler(
    request("sign-up/email", {
      name: "Intruder",
      email: "intruder@example.invalid",
      password,
    }),
  );
  assert.ok([400, 403, 404].includes(response.status));
  const rows = await pool.database.query("SELECT email FROM admin_users");
  assert.deepEqual(
    rows.rows.map((row) => row.email),
    [email],
  );
});
test("server-side provisioning also enforces the administrator allowlist", async () => {
  const provisioning = betterAuth(
    authOptions({ ...options, allowRegistration: true }),
  );
  await assert.rejects(
    provisioning.api.signUpEmail({
      body: { name: "Unknown", email: "unknown@example.invalid", password },
    }),
  );
});
test("sign in issues an HTTP-only session and sign out revokes it", async () => {
  const response = await auth.handler(
    request("sign-in/email", { email, password }, undefined, "192.0.2.20"),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /httponly/i);
  const cookie = cookieOf(response);
  const session = await auth.handler(request("get-session", undefined, cookie));
  assert.equal((await session.json()).user.email, email);
  const signOut = await auth.handler(request("sign-out", {}, cookie));
  assert.equal(signOut.status, 200);
  const expired = await auth.handler(request("get-session", undefined, cookie));
  assert.equal(await expired.json(), null);
});
test("a tampered session cookie and spoofed platform headers cannot authenticate", async () => {
  const signedIn = await auth.handler(
    request("sign-in/email", { email, password }, undefined, "192.0.2.21"),
  );
  const cookie = cookieOf(signedIn).replace(
    /(session_token=)([^;]+)/,
    "$1invalid-token",
  );
  const response = await auth.handler(
    request("get-session", undefined, cookie),
  );
  assert.equal(await response.json(), null);
  const spoofed = request("get-session");
  spoofed.headers.set("oai-authenticated-user-id", "forged");
  spoofed.headers.set("oai-authenticated-user-email", email);
  assert.equal(await (await auth.handler(spoofed)).json(), null);
});
test("sign-in requests from another origin are rejected", async () => {
  const response = await auth.handler(
    request(
      "sign-in/email",
      { email, password },
      undefined,
      "192.0.2.22",
      "https://other.example.invalid",
    ),
  );
  assert.equal(response.status, 403);
});
test("sign-in limits are shared by independent server instances", async () => {
  const second = betterAuth(authOptions(options));
  const statuses = [];
  for (let index = 0; index < 7; index++) {
    const instance = index % 2 ? second : auth;
    const response = await instance.handler(
      request(
        "sign-in/email",
        { email, password: "Incorrect-password-123" },
        undefined,
        "192.0.2.50",
      ),
    );
    statuses.push(response.status);
  }
  assert.ok(statuses.includes(401));
  assert.ok(statuses.includes(429));
});
