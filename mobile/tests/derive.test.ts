import { deriveExpectedDoses } from "../src/reminders/derive";
import { type Profile } from "../src/db/profiles";
import { type Vaccination } from "../src/db/vaccinations";
import { dayjs } from "../src/utils/dates";

function ymd(d: Date): string {
  return dayjs(d).format("YYYY-MM-DD");
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    name: "Test",
    birthdate: "2025-11-01",
    sex: null,
    riskGroups: [],
    avatarPath: null,
    reminderLeadDays: [30, 7, 0],
    remindersEnabled: true,
    createdAt: "2025-11-01T00:00:00Z",
    ...overrides,
  };
}

function vac(
  code: string,
  dose: number,
  date: string,
  profileId = "p1",
): Vaccination {
  return {
    id: `${code}-${dose}-${date}`,
    profileId,
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

describe("deriveExpectedDoses — child program", () => {
  test("newborn: all BVC doses are upcoming", () => {
    const today = new Date("2025-11-01");
    const p = profile({ birthdate: "2025-11-01" });
    const out = deriveExpectedDoses(p, [], today);
    // First dose is rotavirus at 6 weeks; remaining BVC + skola also there
    expect(out.length).toBeGreaterThan(10);
    expect(out.every((d) => d.status !== "overdue")).toBe(true);
  });

  test("6-month-old with nothing recorded: 6w/3mo/5mo doses are overdue", () => {
    // born 2025-05-01, today 2025-11-01 → 6 months old
    const today = new Date("2025-11-01");
    const p = profile({ birthdate: "2025-05-01" });
    const out = deriveExpectedDoses(p, [], today);

    // Rotavirus 1 (6w) — should be overdue
    const rota1 = out.find((d) => d.code === "ROTAVIRUS" && d.doseNumber === 1);
    expect(rota1?.status).toBe("overdue");

    // 12mo doses — should be soon (within 60d) or upcoming
    const dtp3 = out.find(
      (d) => d.code === "DTP_IPV_HIB_HEPB" && d.doseNumber === 3,
    );
    expect(dtp3).toBeDefined();
    expect(["soon", "upcoming"]).toContain(dtp3!.status);
  });

  test("dose taken silences that expected dose", () => {
    const today = new Date("2025-11-01");
    const p = profile({ birthdate: "2025-05-01" });
    const recorded = [vac("ROTAVIRUS", 1, "2025-06-15")];
    const out = deriveExpectedDoses(p, recorded, today);
    expect(
      out.find((d) => d.code === "ROTAVIRUS" && d.doseNumber === 1),
    ).toBeUndefined();
    // But ROTAVIRUS dose 2 is still expected
    expect(
      out.find((d) => d.code === "ROTAVIRUS" && d.doseNumber === 2),
    ).toBeDefined();
  });

  test("MMR 2nd dose expected at school age", () => {
    // 7.5-year-old
    const today = new Date("2025-11-01");
    const p = profile({ birthdate: "2018-05-01" });
    const recorded = [
      vac("MMR", 1, "2019-11-01"), // dose 1 at 18 months
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const mmr2 = out.find((d) => d.code === "MMR" && d.doseNumber === 2);
    expect(mmr2).toBeDefined();
    // Around 7.5 years old → due ~2025-11; should be overdue or soon
    expect(["overdue", "soon", "upcoming"]).toContain(mmr2!.status);
  });

  test("future-born child: all upcoming, none overdue", () => {
    const today = new Date("2025-11-01");
    const p = profile({ birthdate: "2026-06-01" });
    const out = deriveExpectedDoses(p, [], today);
    expect(out.every((d) => d.status === "upcoming")).toBe(true);
  });

  test("isolation: doses for another profile do not count", () => {
    const today = new Date("2025-11-01");
    const p = profile({ id: "p1", birthdate: "2025-05-01" });
    const recorded = [vac("ROTAVIRUS", 1, "2025-06-15", "p2-other")];
    const out = deriveExpectedDoses(p, recorded, today);
    const rota1 = out.find((d) => d.code === "ROTAVIRUS" && d.doseNumber === 1);
    expect(rota1).toBeDefined(); // still expected for p1
  });

  test("50-åring (född 1976) ser inte pneumokock som försenad", () => {
    const today = new Date("2026-05-11");
    const p = profile({ birthdate: "1976-01-01" });
    const out = deriveExpectedDoses(p, [], today);
    // Pneumokock added 2009; for a 1976-baby due date is 1976 → skipped
    expect(out.find((d) => d.code === "PNEUMOCOCCAL")).toBeUndefined();
    // Same for rotavirus (added 2019) and HPV (added 2012)
    expect(out.find((d) => d.code === "ROTAVIRUS")).toBeUndefined();
    expect(out.find((d) => d.code === "HPV")).toBeUndefined();
    // But DTP-combo (proxy for D/T/P/IPV they did get) should still appear
    expect(
      out.find((d) => d.code === "DTP_IPV_HIB_HEPB"),
    ).toBeDefined();
  });

  test("16-åring (född 2010) ser pneumokock som taken-or-due", () => {
    const today = new Date("2026-05-11");
    const p = profile({ birthdate: "2010-01-01" });
    const out = deriveExpectedDoses(p, [], today);
    // Pneumokock available since 2009 → 2010-baby due at 3mo (2010-04) > 2009 → included
    expect(out.find((d) => d.code === "PNEUMOCOCCAL")).toBeDefined();
  });

  test("remindersEnabled=false → returns empty", () => {
    const today = new Date("2025-11-01");
    const p = profile({
      birthdate: "2025-05-01",
      remindersEnabled: false,
    });
    const out = deriveExpectedDoses(p, [], today);
    expect(out).toEqual([]);
  });

  test("HPV doses 1 and 2 both appear at school age", () => {
    const today = new Date("2025-11-01");
    const p = profile({ birthdate: "2014-11-01" }); // 11 years old
    const out = deriveExpectedDoses(p, [], today);
    expect(
      out.find((d) => d.code === "HPV" && d.doseNumber === 1),
    ).toBeDefined();
    expect(
      out.find((d) => d.code === "HPV" && d.doseNumber === 2),
    ).toBeDefined();
  });
});

describe("deriveExpectedDoses — adult boosters", () => {
  test("TBE: dose 3 in series → dose 4 due 3 years later", () => {
    const today = new Date("2026-05-01");
    const p = profile({ birthdate: "1985-01-01" });
    const recorded = [
      vac("TBE", 1, "2020-05-01"),
      vac("TBE", 2, "2020-06-15"),
      vac("TBE", 3, "2020-12-01"), // series complete
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const tbeNext = out.find((d) => d.code === "TBE");
    expect(tbeNext).toBeDefined();
    // expected: 2020-12-01 + 3 years = 2023-12-01 (overdue from May 2026)
    expect(tbeNext!.status).toBe("overdue");
    expect(tbeNext!.dueDate.getFullYear()).toBe(2023);
  });

  test("dT: 3-dose series complete → booster every 20 years", () => {
    const today = new Date("2026-05-01");
    const p = profile({ birthdate: "1985-01-01" });
    const recorded = [
      vac("TETANUS_DIPHTHERIA", 1, "2010-01-01"),
      vac("TETANUS_DIPHTHERIA", 2, "2010-02-01"),
      vac("TETANUS_DIPHTHERIA", 3, "2010-08-01"),
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const dt = out.find((d) => d.code === "TETANUS_DIPHTHERIA");
    expect(dt).toBeDefined();
    // 2010-08-01 + 20 yr = 2030-08-01 → upcoming
    expect(dt!.status).toBe("upcoming");
    expect(dt!.dueDate.getFullYear()).toBe(2030);
  });

  test("Hep A: 2-dose series complete → next due 25 years later", () => {
    const today = new Date("2026-05-01");
    const p = profile({ birthdate: "1985-01-01" });
    const recorded = [
      vac("HEP_A", 1, "2002-01-01"),
      vac("HEP_A", 2, "2002-07-01"),
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const hep = out.find((d) => d.code === "HEP_A");
    expect(hep).toBeDefined();
    // 2002-07-01 + 25 yr = 2027-07-01 → upcoming or soon
    expect(["soon", "upcoming"]).toContain(hep!.status);
  });

  test("Influenza: age 65+ → due this season", () => {
    const today = new Date("2026-11-15"); // mitt i säsong
    const p = profile({ birthdate: "1955-01-01" });
    const out = deriveExpectedDoses(p, [], today);
    const flu = out.find((d) => d.code === "INFLUENZA");
    expect(flu).toBeDefined();
    expect(flu!.reason).toBe("flu-season");
  });

  test("Influenza: not in risk group + under 65 → not in list", () => {
    const today = new Date("2026-11-15");
    const p = profile({ birthdate: "1990-01-01" });
    const out = deriveExpectedDoses(p, [], today);
    expect(out.find((d) => d.code === "INFLUENZA")).toBeUndefined();
  });

  test("Influenza: took it this season → next dose proposed for next season", () => {
    const today = new Date("2026-11-15");
    const p = profile({ birthdate: "1955-01-01" });
    const recorded = [
      { ...vac("INFLUENZA", 1, "2026-10-20"), doseNumber: null } as Vaccination,
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const flu = out.find((d) => d.code === "INFLUENZA");
    expect(flu).toBeDefined();
    expect(flu!.dueDate.getFullYear()).toBe(2027);
  });

  test("4-year-old with MMR dose 1 → MMR dose 2 NOT flagged as overdue (age-triggered)", () => {
    // Regression: deriveAdultBoosters used to fall back to "+1 month from
    // last dose" for incomplete series. For MMR (dose 2 @ 7.5 år by age
    // trigger), this misfired as ~1000 days overdue for a 4-year-old.
    const today = new Date("2026-05-16");
    const p = profile({ birthdate: "2022-02-14" });
    const recorded = [vac("MMR", 1, "2023-08-14")];
    const out = deriveExpectedDoses(p, recorded, today);
    const mmr2 = out.find((d) => d.code === "MMR" && d.doseNumber === 2);
    expect(mmr2).toBeDefined();
    expect(mmr2!.status).not.toBe("overdue");
    expect(mmr2!.dueDate.getFullYear()).toBe(2029); // 2022-02 + 90 mån
  });

  test("TBE: 1 dose med null doseNumber → R2 räknar posten, föreslår dos 2 med spacing", () => {
    const today = new Date("2024-09-01");
    const p = profile({ birthdate: "1985-01-01" });
    // Användaren registrerar dos 22 juni 2024 utan att fylla i dosnummer
    const recorded = [
      { ...vac("TBE", 1, "2024-06-22"), doseNumber: null } as Vaccination,
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const tbe = out.find((d) => d.code === "TBE");
    expect(tbe).toBeDefined();
    expect(tbe!.doseNumber).toBe(2);
    // Spacing dos 1→2 = 30–90 dagar
    // availableFrom = 2024-06-22 + 30d = 2024-07-22
    expect(tbe!.availableFrom).toBeDefined();
    expect(ymd(tbe!.availableFrom!)).toBe("2024-07-22");
    // dueDate (MAX) = 2024-06-22 + 90d = 2024-09-20
    expect(ymd(tbe!.dueDate)).toBe("2024-09-20");
    // Idag 2024-09-01: mellan MIN och MAX → soon
    expect(tbe!.status).toBe("soon");
  });

  test("TBE: 1 dose med doseNumber=2 → R2 litar på siffran, föreslår dos 3 med spacing dos 2→3", () => {
    const today = new Date("2024-09-01");
    const p = profile({ birthdate: "1985-01-01" });
    const recorded = [vac("TBE", 2, "2024-06-22")];
    const out = deriveExpectedDoses(p, recorded, today);
    const tbe = out.find((d) => d.code === "TBE");
    expect(tbe).toBeDefined();
    expect(tbe!.doseNumber).toBe(3);
    // Spacing dos 2→3 = 150–365 dagar
    expect(ymd(tbe!.availableFrom!)).toBe("2024-11-19");
    expect(ymd(tbe!.dueDate)).toBe("2025-06-22");
    // Idag 2024-09-01: före MIN → upcoming
    expect(tbe!.status).toBe("upcoming");
  });

  test("TBE: [null, null, 3] → anyFilled=true, progress=3, serien klar, dos 4 om 3 år", () => {
    const today = new Date("2025-01-01");
    const p = profile({ birthdate: "1985-01-01" });
    const recorded = [
      { ...vac("TBE", 1, "2024-01-01"), doseNumber: null } as Vaccination,
      { ...vac("TBE", 1, "2024-02-15"), doseNumber: null } as Vaccination,
      vac("TBE", 3, "2024-08-01"),
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const tbe = out.find((d) => d.code === "TBE");
    expect(tbe).toBeDefined();
    expect(tbe!.doseNumber).toBe(4);
    // 2024-08-01 + 36 mån = 2027-08-01
    expect(tbe!.dueDate.getFullYear()).toBe(2027);
  });

  test("TBE: enda post med doseNumber=4 (via import) → ingen krasch, lastDose används som ankare", () => {
    const today = new Date("2026-05-01");
    const p = profile({ birthdate: "1985-01-01" });
    const recorded = [vac("TBE", 4, "2024-01-01")];
    expect(() => deriveExpectedDoses(p, recorded, today)).not.toThrow();
    const out = deriveExpectedDoses(p, recorded, today);
    const tbe = out.find((d) => d.code === "TBE");
    expect(tbe).toBeDefined();
    expect(tbe!.dueDate.getTime()).not.toBeNaN();
    // Ankare = lastDose 2024-01-01; dosesAfterSeries = max(0, 4-3) = 1
    // → offset = customBoosterMonths[1] = 96 mån. 2024-01-01 + 96 mån = 2032-01-01.
    expect(tbe!.dueDate.getFullYear()).toBe(2032);
  });

  test("born 1995, all childhood vaccinations imported → no overdue tetanus booster", () => {
    // Regression: bulk-import only records DTP_IPV under doseNumber=4 (doses
    // 1–3 are under combo DTP_IPV_HIB_HEPB), and DTAP under doseNumber=5.
    // Old code treated each as "1 of N — propose next dose in 1 month" → decades overdue.
    const today = new Date("2026-05-16");
    const p = profile({ birthdate: "1995-04-15" });
    const recorded = [
      vac("DTP_IPV_HIB_HEPB", 1, "1995-07-15"),
      vac("DTP_IPV_HIB_HEPB", 2, "1995-09-15"),
      vac("DTP_IPV_HIB_HEPB", 3, "1996-04-15"),
      vac("MMR", 1, "1996-10-15"),
      vac("DTP_IPV", 4, "2000-04-15"),
      vac("MMR", 2, "2002-10-15"),
      vac("DTAP", 5, "2009-10-15"),
    ];
    const out = deriveExpectedDoses(p, recorded, today);
    const overdue = out.filter((d) => d.status === "overdue");
    expect(overdue).toHaveLength(0);
    // Only the tetanus booster from the most recent DTAP should remain;
    // the earlier DTP_IPV proposal should be deduped away.
    const tetanusProposals = out.filter((d) =>
      ["DTP_IPV", "DTAP", "TETANUS_DIPHTHERIA", "DTP_IPV_HIB_HEPB"].includes(
        d.code,
      ),
    );
    expect(tetanusProposals).toHaveLength(1);
    expect(tetanusProposals[0]!.code).toBe("DTAP");
    expect(tetanusProposals[0]!.dueDate.getFullYear()).toBe(2029);
  });
});
