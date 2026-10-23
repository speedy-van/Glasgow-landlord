import { test } from "node:test";
import assert from "node:assert/strict";
import { hasTrustedOrigin } from "../lib/request-origin.ts";

function request(origin, fetchSite = "same-origin", extraHeaders = {}) {
  return new Request("http://0.0.0.0:3000/api/quotes", {
    method: "POST",
    headers: {
      ...(origin === undefined ? {} : { origin }),
      ...(fetchSite == null ? {} : { "sec-fetch-site": fetchSite }),
      ...extraHeaders,
    },
  });
}

test("public canonical origin is accepted when Next exposes an internal bind address", () => {
  assert.equal(
    hasTrustedOrigin(request("http://localhost:3000"), "http://localhost:3000"),
    true,
  );
  assert.equal(
    hasTrustedOrigin(
      request("https://store.example.invalid"),
      "https://store.example.invalid",
    ),
    true,
  );
  assert.equal(
    hasTrustedOrigin(
      request("http://localhost:3000", null),
      "http://localhost:3000",
    ),
    true,
  );
});

test("cross-site, missing and noncanonical origins remain rejected", () => {
  for (const origin of [
    undefined,
    "null",
    "http://0.0.0.0:3000",
    "http://localhost:3001",
    "https://localhost:3000",
    "http://localhost:3000.attacker.invalid",
    "https://other.example.invalid",
  ]) {
    assert.equal(
      hasTrustedOrigin(request(origin), "http://localhost:3000"),
      false,
    );
  }
  assert.equal(
    hasTrustedOrigin(
      request("http://localhost:3000", "cross-site"),
      "http://localhost:3000",
    ),
    false,
  );
  assert.equal(
    hasTrustedOrigin(
      request("https://other.example.invalid", "same-origin", {
        host: "other.example.invalid",
        "x-forwarded-host": "other.example.invalid",
        "x-forwarded-proto": "https",
      }),
      "http://localhost:3000",
    ),
    false,
  );
});
