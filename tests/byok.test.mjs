import assert from "node:assert/strict";
import test from "node:test";

process.env.AUTH_SECRET ??= "test-only-secret";
const { encryptApiKey, decryptApiKey } = await import("../lib/byok.ts");

test("api key round-trips through encryption", () => {
  const key = "AIzaSy-test-key-0123456789abcdefghijklmn";
  const stored = encryptApiKey(key);
  assert.notEqual(stored, key);
  assert.ok(!stored.includes(key), "ciphertext must not contain the plaintext");
  assert.equal(decryptApiKey(stored), key);
});

test("each encryption uses a fresh nonce", () => {
  const key = "same-key-encrypted-twice-0123456789";
  assert.notEqual(encryptApiKey(key), encryptApiKey(key));
});

test("tampered or malformed ciphertext is rejected", () => {
  const stored = encryptApiKey("AIzaSy-test-key-0123456789abcdefghijklmn");
  const [iv, tag, data] = stored.split(":");
  const flipped = Buffer.from(data, "base64");
  flipped[0] ^= 0xff;
  assert.throws(() =>
    decryptApiKey([iv, tag, flipped.toString("base64")].join(":")),
  );
  assert.throws(() => decryptApiKey("not-a-valid-record"));
  assert.throws(() => decryptApiKey(`${iv}:${tag}`));
});
