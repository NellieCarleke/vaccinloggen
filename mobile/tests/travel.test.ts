import { recommendForTrip } from "../src/reminders/travel";
import { type Profile } from "../src/db/profiles";
import { type Vaccination } from "../src/db/vaccinations";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    name: "Test",
    birthdate: "1990-01-01",
    sex: null,
    riskGroups: [],
    avatarPath: null,
    reminderLeadDays: [30, 7, 0],
    remindersEnabled: true,
    createdAt: "2025-01-01T00:00:00Z",
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
    createdAt: `${date}T00:00:00Z`,
  };
}

describe("recommendForTrip — Thailand", () => {
  test("no prior vaccinations → all recs are missing/incomplete", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["TH"],
      departDate: new Date("2026-08-01"),
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    expect(result.actionItemCount).toBeGreaterThan(0);
    // Hep A is core for Thailand
    const hepA = result.outcomes.find((o) => o.rec.code === "HEP_A");
    expect(hepA).toBeDefined();
    expect(hepA!.status).toBe("incomplete"); // 0 of 2 doses
  });

  test("Hep A already covered (2 doses, recent) → covered", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["TH"],
      departDate: new Date("2026-08-01"),
      vaccinations: [
        vac("HEP_A", 1, "2020-01-01"),
        vac("HEP_A", 2, "2020-07-01"),
      ],
      today: new Date("2026-05-01"),
    });
    const hepA = result.outcomes.find((o) => o.rec.code === "HEP_A");
    expect(hepA!.status).toBe("covered");
  });

  test("Hep A from 2002 (no dose 2) → incomplete, not covered", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["IN"],
      departDate: new Date("2026-08-01"),
      vaccinations: [vac("HEP_A", 1, "2002-01-01")],
      today: new Date("2026-05-01"),
    });
    const hepA = result.outcomes.find((o) => o.rec.code === "HEP_A");
    expect(hepA!.status).toBe("incomplete");
  });

  test("Yellow fever NOT recommended for Thailand", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["TH"],
      departDate: new Date("2026-08-01"),
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    expect(
      result.outcomes.find((o) => o.rec.code === "YELLOW_FEVER"),
    ).toBeUndefined();
  });
});

describe("recommendForTrip — Kenya (yellow fever required)", () => {
  test("yellow fever appears as required", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["KE"],
      departDate: new Date("2026-09-01"),
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    const yf = result.outcomes.find((o) => o.rec.code === "YELLOW_FEVER");
    expect(yf).toBeDefined();
    expect(yf!.rec.level).toBe("required");
  });

  test("yellow fever 1 dose 2010 → still covered (lifelong per WHO 2016)", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["KE"],
      departDate: new Date("2026-09-01"),
      vaccinations: [vac("YELLOW_FEVER", 1, "2010-04-01")],
      today: new Date("2026-05-01"),
    });
    const yf = result.outcomes.find((o) => o.rec.code === "YELLOW_FEVER");
    expect(yf!.status).toBe("covered");
  });

  test("startBy is 10 days before departure", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["KE"],
      departDate: new Date("2026-09-15"),
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    const yf = result.outcomes.find((o) => o.rec.code === "YELLOW_FEVER");
    expect(yf!.startBy).toBeDefined();
    // Sept 15 - 10 days = Sept 5
    expect(yf!.startBy!.getDate()).toBe(5);
    expect(yf!.startBy!.getMonth()).toBe(8); // September = 8
  });
});

describe("recommendForTrip — multi-destination merging", () => {
  test("Kenya + Tanzania merges yellow fever; required wins over risk", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["KE", "TZ"], // Kenya: required, Tanzania: risk
      departDate: new Date("2026-09-01"),
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    const yf = result.outcomes.find((o) => o.rec.code === "YELLOW_FEVER");
    expect(yf!.rec.level).toBe("required");
  });
});

describe("recommendForTrip — anyOverdue flag", () => {
  test("departure within minDays before today → anyOverdue=true", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["KE"],
      departDate: new Date("2026-05-08"), // 7 days from today
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    // YF needs 10 days lead — startBy = 2026-04-28 (in the past)
    expect(result.anyOverdue).toBe(true);
  });

  test("plenty of lead time → anyOverdue=false", () => {
    const result = recommendForTrip({
      profile: profile(),
      destinations: ["KE"],
      departDate: new Date("2026-09-01"),
      vaccinations: [],
      today: new Date("2026-05-01"),
    });
    expect(result.anyOverdue).toBe(false);
  });
});
