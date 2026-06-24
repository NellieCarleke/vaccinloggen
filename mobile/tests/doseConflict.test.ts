import {
  checkDoseConflict,
  formatConflictMessage,
} from "../src/schedules/doseConflict";
import { type Vaccination } from "../src/db/vaccinations";

function vac(overrides: Partial<Vaccination>): Vaccination {
  return {
    id: "v1",
    profileId: "p1",
    vaccineCode: "TBE",
    vaccineLabel: null,
    brand: null,
    doseNumber: null,
    date: "2024-01-01",
    provider: null,
    batch: null,
    notes: null,
    source: "manual",
    savedWithConflict: false,
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("checkDoseConflict", () => {
  test("null doseNumber → alltid ok (oavsett vad som finns)", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: null },
      [vac({ doseNumber: 1 })],
    );
    expect(res.kind).toBe("ok");
  });

  test("första dosen utan föregående: dos 1 → ok", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 1 },
      [],
    );
    expect(res.kind).toBe("ok");
  });

  test("första dosen utan föregående: dos 2 → gap, förväntat 1", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 2 },
      [],
    );
    expect(res).toEqual({ kind: "gap", expected: 1 });
  });

  test("med 1 befintlig post: dos 2 → ok", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 2 },
      [vac({ id: "a", doseNumber: 1 })],
    );
    expect(res.kind).toBe("ok");
  });

  test("med 1 befintlig post: dos 3 → gap, förväntat 2", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 3 },
      [vac({ id: "a", doseNumber: 1 })],
    );
    expect(res).toEqual({ kind: "gap", expected: 2 });
  });

  test("med 2 null-poster: dos 3 → ok ('börjar numrera nu')", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 3 },
      [vac({ id: "a", doseNumber: null }), vac({ id: "b", doseNumber: null })],
    );
    expect(res.kind).toBe("ok");
  });

  test("dos 1 finns: ny post med dos 1 → duplicate", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 1 },
      [vac({ id: "a", doseNumber: 1 })],
    );
    expect(res).toEqual({ kind: "duplicate", existingId: "a" });
  });

  test("edit-path: ändrar samma post till samma nummer → ok", () => {
    const res = checkDoseConflict(
      {
        profileId: "p1",
        vaccineCode: "TBE",
        doseNumber: 1,
        excludeId: "a",
      },
      [vac({ id: "a", doseNumber: 1 })],
    );
    expect(res.kind).toBe("ok");
  });

  test("annan profil: kollision över profil-gräns räknas inte", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 1 },
      [vac({ id: "a", profileId: "p2", doseNumber: 1 })],
    );
    expect(res.kind).toBe("ok");
  });

  test("annat vaccin: kollision över vaccin-gräns räknas inte", () => {
    const res = checkDoseConflict(
      { profileId: "p1", vaccineCode: "TBE", doseNumber: 1 },
      [vac({ id: "a", vaccineCode: "HEP_A", doseNumber: 1 })],
    );
    expect(res.kind).toBe("ok");
  });
});

describe("formatConflictMessage", () => {
  test("gap: title + body innehåller angivet dosnummer och förväntat nummer", () => {
    const msg = formatConflictMessage({ kind: "gap", expected: 1 }, 2);
    expect(msg.title).toBe("Saknar tidigare doser?");
    expect(msg.body).toMatch(/dos 2/);
    expect(msg.body).toMatch(/förväntat nästa dosnummer är 1/);
    expect(msg.body).toMatch(/Vill du spara ändå/);
  });

  test("gap: större hopp visar rätt expected", () => {
    const msg = formatConflictMessage({ kind: "gap", expected: 3 }, 5);
    expect(msg.body).toMatch(/dos 5/);
    expect(msg.body).toMatch(/är 3/);
  });

  test("duplicate: title + body indikerar duplicering", () => {
    const msg = formatConflictMessage(
      { kind: "duplicate", existingId: "v-abc" },
      2,
    );
    expect(msg.title).toBe("Dosnumret finns redan");
    expect(msg.body).toMatch(/redan en post med dos 2/);
    expect(msg.body).toMatch(/Vill du spara ändå/);
  });
});
