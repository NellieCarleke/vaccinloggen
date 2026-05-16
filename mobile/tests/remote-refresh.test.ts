import { readFileSync } from "fs";
import { join } from "path";

import {
  setChildProgram,
  resetChildProgramToBundled,
  getChildProgram,
  BUNDLED_CHILD_PROGRAM,
} from "../src/schedules/child-program";
import {
  setValidityRules,
  resetValidityRulesToBundled,
  getValidityRule,
  BUNDLED_VALIDITY_RULES,
} from "../src/schedules/validity";

// The JSON file at data/schedules/v1.json is what we'd serve from the CDN.
// This test verifies it stays in sync with the bundled TS values, so a
// schedule edit in one place doesn't silently diverge from the other.
const REMOTE_JSON_PATH = join(
  __dirname,
  "..",
  "..",
  "data",
  "schedules",
  "v1.json",
);

describe("schedule getters/setters — runtime override", () => {
  afterEach(() => {
    resetChildProgramToBundled();
    resetValidityRulesToBundled();
  });

  test("setChildProgram swaps the active program", () => {
    const before = getChildProgram();
    expect(before).toBe(BUNDLED_CHILD_PROGRAM);

    const replacement = [
      {
        code: "TEST",
        dose: 1,
        trigger: { kind: "months" as const, value: 3 },
        reason: "barnprogram-bvc" as const,
      },
    ];
    setChildProgram(replacement);
    expect(getChildProgram()).toBe(replacement);
    expect(getChildProgram()).not.toBe(BUNDLED_CHILD_PROGRAM);

    resetChildProgramToBundled();
    expect(getChildProgram()).toBe(BUNDLED_CHILD_PROGRAM);
  });

  test("setValidityRules swaps the active rule set", () => {
    expect(getValidityRule("DTAP")?.fullSeriesDoses).toBe(5);

    setValidityRules({
      DTAP: { fullSeriesDoses: 99, boosterEveryYears: 1 },
    });
    expect(getValidityRule("DTAP")?.fullSeriesDoses).toBe(99);
    // Codes outside the replacement set return null (entire rule table replaced)
    expect(getValidityRule("MMR")).toBeNull();
  });
});

describe("CDN JSON ↔ bundled TS — stay in sync", () => {
  const raw = readFileSync(REMOTE_JSON_PATH, "utf8");
  const payload = JSON.parse(raw) as {
    version: string;
    source: string;
    childProgram: typeof BUNDLED_CHILD_PROGRAM;
    validityRules: typeof BUNDLED_VALIDITY_RULES;
  };

  test("childProgram matches bundled length and codes", () => {
    expect(payload.childProgram).toHaveLength(BUNDLED_CHILD_PROGRAM.length);
    for (let i = 0; i < BUNDLED_CHILD_PROGRAM.length; i++) {
      expect(payload.childProgram[i]!.code).toBe(BUNDLED_CHILD_PROGRAM[i]!.code);
      expect(payload.childProgram[i]!.dose).toBe(BUNDLED_CHILD_PROGRAM[i]!.dose);
    }
  });

  test("validityRules contain the same codes as bundled", () => {
    const bundledKeys = Object.keys(BUNDLED_VALIDITY_RULES).sort();
    const remoteKeys = Object.keys(payload.validityRules).sort();
    expect(remoteKeys).toEqual(bundledKeys);
  });

  test("payload has version + source fields", () => {
    expect(payload.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.source).toBe("Folkhälsomyndigheten");
  });
});
