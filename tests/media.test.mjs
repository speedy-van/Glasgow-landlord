import { test } from "node:test";
import assert from "node:assert/strict";
import { imageType, validMediaKey, MAX_IMAGE_BYTES } from "../lib/media.ts";

test("media rejects short or executable files while recognizing supported signatures", () => {
  assert.equal(
    imageType(new TextEncoder().encode('<svg onload="alert(1)">')),
    null,
  );
  assert.equal(imageType(Uint8Array.from([137, 80, 78, 71])), null);
  assert.equal(imageType(Uint8Array.from([255, 216, 255, 0])), "jpg");
  assert.equal(
    imageType(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "png",
  );
  assert.equal(imageType(new TextEncoder().encode("RIFF1234WEBP")), "webp");
});
test("only generated image keys can be requested and payloads fit Vercel limits", () => {
  assert.equal(
    validMediaKey("00000000-0000-4000-8000-000000000000.webp"),
    true,
  );
  assert.equal(validMediaKey("../../secret.png"), false);
  assert.equal(
    validMediaKey("------------------------------------.png"),
    false,
  );
  assert.ok(MAX_IMAGE_BYTES < 4_500_000);
});
