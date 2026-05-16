import {
  encryptToString,
  decryptFromString,
  generatePassphrase,
} from "../src/export/encrypt";

// Lower iteration count for tests so they finish in reasonable time.
// (We test the round-trip property at low iterations — the full count is
// applied in production via the same code path.)
jest.setTimeout(30_000);

describe("encrypt round-trip", () => {
  test("plaintext encrypts and decrypts with same password", async () => {
    const cipher = await encryptToString("hello world", "korrekt-hasten");
    const plain = await decryptFromString(cipher, "korrekt-hasten");
    expect(plain).toBe("hello world");
  });

  test("decryption fails with wrong password", async () => {
    const cipher = await encryptToString("secret data", "right-password");
    await expect(decryptFromString(cipher, "wrong-password")).rejects.toThrow();
  });

  test("encrypts JSON payload and decrypts to identical object", async () => {
    const payload = {
      version: 1,
      profiles: [{ id: "p1", name: "Lisa", risk: ["asthma"] }],
      vaccinations: [{ id: "v1", code: "MPR", date: "2026-01-15" }],
    };
    const json = JSON.stringify(payload);
    const cipher = await encryptToString(json, "test-pass");
    const decrypted = await decryptFromString(cipher, "test-pass");
    expect(JSON.parse(decrypted)).toEqual(payload);
  });

  test("envelope is valid JSON with expected fields", async () => {
    const cipher = await encryptToString("x", "p");
    const env = JSON.parse(cipher);
    expect(env.v).toBe(1);
    expect(env.kdf).toBe("sha512-chain");
    expect(typeof env.salt).toBe("string");
    expect(typeof env.nonce).toBe("string");
    expect(typeof env.data).toBe("string");
  });
});

describe("generatePassphrase", () => {
  test("returns 6 dash-separated words", () => {
    const phrase = generatePassphrase();
    const parts = phrase.split("-");
    expect(parts.length).toBe(6);
    expect(parts.every((p) => p.length > 0)).toBe(true);
  });

  test("subsequent calls produce different passphrases (with overwhelming probability)", () => {
    const a = generatePassphrase();
    const b = generatePassphrase();
    expect(a).not.toBe(b);
  });
});
