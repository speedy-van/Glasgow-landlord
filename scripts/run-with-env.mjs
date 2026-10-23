import { spawn } from "node:child_process";

const command = process.argv.slice(2);
if (!command.length || !process.stdin.isTTY)
  throw new Error("Run with a terminal and a command argument.");
const allowed = new Set([
  "DATABASE_URL",
  "ADMIN_EMAILS",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "MAPBOX_ACCESS_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
  "BLOB_STORE_ID",
]);
process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stdin.resume();
console.log("Secure configuration input ready");
let input = "";
process.stdin.on("data", (chunk) => {
  if (chunk.includes("\u0003")) process.exit(130);
  input += chunk;
  if (input.length > 30_000) process.exit(1);
  if (!input.includes("\n")) return;
  process.stdin.pause();
  process.stdin.setRawMode(false);
  let payload;
  try {
    payload = JSON.parse(input.trim());
  } catch {
    console.error("Invalid configuration input.");
    process.exit(1);
  }
  input = "";
  const env = { ...process.env };
  for (const [key, value] of Object.entries(payload.env ?? {})) {
    if (!allowed.has(key) || typeof value !== "string") {
      console.error("Unexpected configuration key.");
      process.exit(1);
    }
    env[key] = value;
  }
  const secrets = Object.entries(payload.env ?? {})
    .filter(([key]) => /URL|SECRET|KEY|TOKEN/.test(key))
    .map(([, value]) => value)
    .filter(Boolean);
  if (payload.env?.DATABASE_URL) {
    try {
      secrets.push(new URL(payload.env.DATABASE_URL).password);
    } catch {}
  }
  for (const [key, value] of Object.entries(payload.input ?? {}))
    if (
      /password|token|secret|key|bearer/i.test(key) &&
      typeof value === "string"
    )
      secrets.push(value);
  const redact = (text) =>
    secrets.reduce(
      (result, secret) =>
        secret ? result.split(secret).join("[redacted]") : result,
      text,
    );
  const child = spawn(command[0], command.slice(1), {
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  for (const stream of [child.stdout, child.stderr]) {
    let pending = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      pending += chunk;
      const lines = pending.split("\n");
      pending = lines.pop();
      for (const line of lines) process.stdout.write(redact(line) + "\n");
    });
    stream.on("end", () => {
      if (pending) process.stdout.write(redact(pending));
    });
  }
  child.stdin.end(payload.input ? JSON.stringify(payload.input) : undefined);
  child.on("error", (error) => {
    console.error("Command could not start:", error.code);
    process.exitCode = 1;
  });
  child.on("close", (code) => process.exit(code ?? 1));
});
