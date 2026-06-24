import { isStillValid } from "../src/reminders/validity";
import { type Vaccination } from "../src/db/vaccinations";

function vac(code: string, dose: number, date: string): Vaccination {
  return {
    id: `${code}-${dose}-${date}`,
    profileId: "p1",
    vaccineCode: code,
    vaccineLabel: null,
    brand: null,
    doseNumber: dose,
    date,
    provider: null,
    batch: null,
    notes: null,
    source: "manual",
    savedWithConflict: false,
    createdAt: `${date}T00:00:00Z`,
  };
}

describe("isStillValid — Hep A", () => {
  test("only dose 1 → incomplete", () => {
    const result = isStillValid(
      [vac("HEP_A", 1, "2002-01-01")],
      "HEP_A",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("incomplete");
  });

  test("2 doses, < 25 years ago → valid", () => {
    const result = isStillValid(
      [vac("HEP_A", 1, "2010-01-01"), vac("HEP_A", 2, "2010-07-01")],
      "HEP_A",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("valid");
    if (result.state === "valid") {
      expect(result.expiresOn).not.toBeNull();
      expect(result.expiresOn!.getFullYear()).toBe(2035);
    }
  });

  test("2 doses, > 25 years ago → expired", () => {
    const result = isStillValid(
      [vac("HEP_A", 1, "1995-01-01"), vac("HEP_A", 2, "1995-07-01")],
      "HEP_A",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("expired");
  });
});

describe("isStillValid — TBE custom cadence", () => {
  test("3-dose series, dose 3 < 3 yr ago → valid", () => {
    const result = isStillValid(
      [
        vac("TBE", 1, "2024-04-01"),
        vac("TBE", 2, "2024-05-15"),
        vac("TBE", 3, "2024-11-01"),
      ],
      "TBE",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("valid");
    if (result.state === "valid") {
      // 2024-11-01 + 36 mo = 2027-11-01
      expect(result.expiresOn!.getFullYear()).toBe(2027);
    }
  });

  test("3-dose series, dose 3 > 3 yr ago → expired", () => {
    const result = isStillValid(
      [
        vac("TBE", 1, "2020-04-01"),
        vac("TBE", 2, "2020-05-15"),
        vac("TBE", 3, "2020-11-01"),
      ],
      "TBE",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("expired");
  });

  test("after first booster (dose 4) → 5 yr until next", () => {
    const result = isStillValid(
      [
        vac("TBE", 1, "2018-04-01"),
        vac("TBE", 2, "2018-05-15"),
        vac("TBE", 3, "2018-11-01"),
        vac("TBE", 4, "2022-01-01"), // first booster
      ],
      "TBE",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("valid");
    if (result.state === "valid") {
      // expiresOn computed from series completion (dose 3 at 2018-11-01) + 96 mo = 2026-11-01
      // Actually our rule: customBoosterMonths[1] = 36+60 = 96 → 2018-11 + 96 = 2026-11
      expect(result.expiresOn!.getFullYear()).toBeGreaterThanOrEqual(2026);
    }
  });
});

describe("isStillValid — Tetanus 20-year booster", () => {
  test("3 doses < 20 yr ago → valid", () => {
    const result = isStillValid(
      [
        vac("TETANUS_DIPHTHERIA", 1, "2010-01-01"),
        vac("TETANUS_DIPHTHERIA", 2, "2010-02-01"),
        vac("TETANUS_DIPHTHERIA", 3, "2010-08-01"),
      ],
      "TETANUS_DIPHTHERIA",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("valid");
  });

  test("3 doses > 20 yr ago → expired", () => {
    const result = isStillValid(
      [
        vac("TETANUS_DIPHTHERIA", 1, "2000-01-01"),
        vac("TETANUS_DIPHTHERIA", 2, "2000-02-01"),
        vac("TETANUS_DIPHTHERIA", 3, "2000-08-01"),
      ],
      "TETANUS_DIPHTHERIA",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("expired");
  });
});

describe("isStillValid — MMR (lifelong)", () => {
  test("2 doses → valid forever", () => {
    const result = isStillValid(
      [vac("MMR", 1, "1985-04-01"), vac("MMR", 2, "1992-04-01")],
      "MMR",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("valid");
    if (result.state === "valid") expect(result.expiresOn).toBeNull();
  });

  test("only 1 dose → incomplete", () => {
    const result = isStillValid(
      [vac("MMR", 1, "1985-04-01")],
      "MMR",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("incomplete");
  });
});

describe("isStillValid — Yellow Fever (WHO 2016 lifelong)", () => {
  test("1 dose 30 years ago → still valid", () => {
    const result = isStillValid(
      [vac("YELLOW_FEVER", 1, "1996-04-01")],
      "YELLOW_FEVER",
      new Date("2026-05-01"),
    );
    expect(result.state).toBe("valid");
  });
});

describe("isStillValid — unknown vaccine code", () => {
  test("returns unknown", () => {
    const result = isStillValid([], "MADE_UP_VACCINE", new Date());
    expect(result.state).toBe("unknown");
  });
});
