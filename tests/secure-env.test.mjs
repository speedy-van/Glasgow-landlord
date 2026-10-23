import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const runner = fileURLToPath(
  new URL("../scripts/run-with-env.mjs", import.meta.url),
);
// Pipes let this test send exact Windows and Unix terminators. The shim supplies
// only the terminal methods required by the interactive runner.
const terminalShim =
  "data:text/javascript," +
  encodeURIComponent(
    'Object.defineProperty(process.stdin,"isTTY",{value:true});process.stdin.setRawMode=()=>{};',
  );

function run(input, script) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", terminalShim, runner, process.execPath, "-e", script],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    let output = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Secure runner did not finish."));
    }, 5000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, output });
    });
    child.stdin.end(input);
  });
}

test("secure configuration accepts terminal line endings and redacts forwarded credentials", async () => {
  const secret = "test-only-forwarded-secret-729";
  const password = "test-only-input-password-546";
  const payload = { env: { BETTER_AUTH_SECRET: secret }, input: { password } };
  const script = `let input="";process.stdin.on("data",chunk=>input+=chunk);process.stdin.on("end",()=>{const value=JSON.parse(input);console.log("forwarded="+(process.env.BETTER_AUTH_SECRET===${JSON.stringify(secret)}&&value.password===${JSON.stringify(password)}));process.stdout.write(process.env.BETTER_AUTH_SECRET.slice(0,9));process.stdout.write(process.env.BETTER_AUTH_SECRET.slice(9)+"\\n");console.error(value.password);});`;
  for (const ending of ["\r", "\n", "\r\n"]) {
    const result = await run(JSON.stringify(payload) + ending, script);
    assert.equal(result.code, 0);
    assert.match(result.output, /forwarded=true/);
    assert.match(result.output, /\[redacted\]/);
    assert.ok(!result.output.includes(secret));
    assert.ok(!result.output.includes(password));
  }
});

test("secure configuration rejects unexpected environment keys before launching a child", async () => {
  const result = await run(
    JSON.stringify({ env: { UNEXPECTED_CONFIG: "fixture" } }) + "\r",
    'console.log("CHILD_LAUNCHED");',
  );
  assert.equal(result.code, 1);
  assert.match(result.output, /Unexpected configuration key/);
  assert.doesNotMatch(result.output, /CHILD_LAUNCHED/);
});
