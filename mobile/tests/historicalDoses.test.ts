import { bulkSpecsToCreate } from "../src/onboarding/historicalDoses";
import { type Profile } from "../src/db/profiles";
import { type Vaccination } from "../src/db/vaccinations";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    name: "Test",
    birthdate: "1991-01-01",
    sex: null,
    riskGroups: [],
    avatarPath: null,
    reminderLeadDays: [30, 7, 0],
    remindersEnabled: true,
    createdAt: "2026-05-11T00:00:00Z",
    ...overrides,
  };
}

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

describe("bulkSpecsToCreate", () => {
  test("35-åring född 1991 → får DTP/Pneumo/MPR men inte rotavirus", () => {
    const today = new Date("2026-05-11");
    const specs = bulkSpecsToCreate(profile({ birthdate: "1991-01-01" }), [], today);
    // Rotavirus added to program 2019; 1991-baby was 28 at intro → no rotavirus
    expect(specs.find((s) => s.spec.code === "ROTAVIRUS")).toBeUndefined();
    // DTP-IPV-Hib-HepB was always part of the program
    expect(
      specs.filter((s) => s.spec.code === "DTP_IPV_HIB_HEPB").length,
    ).toBe(3);
    // MPR both doses
    expect(specs.filter((s) => s.spec.code === "MMR").length).toBe(2);
  });

  test("baby född 2020 → får rotavirus eftersom barnet är ≤6 år", () => {
    const today = new Date("2026-05-11");
    const specs = bulkSpecsToCreate(profile({ birthdate: "2020-01-01" }), [], today);
    expect(specs.filter((s) => s.spec.code === "ROTAVIRUS").length).toBe(3);
  });

  test("nyfödd (1 vecka) → tom lista (inget i förflutet)", () => {
    const today = new Date("2026-05-11");
    const specs = bulkSpecsToCreate(profile({ birthdate: "2026-05-04" }), [], today);
    expect(specs).toEqual([]);
  });

  test("redan registrerad dos silencas (skapas inte igen)", () => {
    const today = new Date("2026-05-11");
    const recorded = [vac("MMR", 1, "1992-08-01")];
    const specs = bulkSpecsToCreate(
      profile({ birthdate: "1991-01-01" }),
      recorded,
      today,
    );
    // Should not propose MMR dose 1 since it's recorded
    expect(
      specs.find((s) => s.spec.code === "MMR" && s.spec.dose === 1),
    ).toBeUndefined();
    // But MMR dose 2 (skola) should still appear
    expect(
      specs.find((s) => s.spec.code === "MMR" && s.spec.dose === 2),
    ).toBeDefined();
  });

  test("framtida doser (5-åring's booster) skapas inte i förväg", () => {
    const today = new Date("2026-05-11");
    // 3-year-old: 5-year DTP-IPV booster is still future
    const specs = bulkSpecsToCreate(profile({ birthdate: "2023-05-01" }), [], today);
    expect(specs.find((s) => s.spec.code === "DTP_IPV")).toBeUndefined();
  });

  test("HPV pre-2012 hoppas över för äldre profiler", () => {
    const today = new Date("2026-05-11");
    // Person born 1991 was 21 in 2012 → past school-HPV age before program
    const specs = bulkSpecsToCreate(profile({ birthdate: "1991-01-01" }), [], today);
    expect(specs.find((s) => s.spec.code === "HPV")).toBeUndefined();
  });

  test("HPV efter 2012 inkluderas för rätt åldersgrupp", () => {
    const today = new Date("2026-05-11");
    // Person born 2010 turns 11 in 2021 → HPV available
    const specs = bulkSpecsToCreate(profile({ birthdate: "2010-01-01" }), [], today);
    expect(specs.filter((s) => s.spec.code === "HPV").length).toBe(2);
  });
});
