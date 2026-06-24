import { formatTiming } from "../src/reminders/doseTiming";
import { type ExpectedDose } from "../src/reminders/derive";

function dose(overrides: Partial<ExpectedDose>): ExpectedDose {
  return {
    key: "TBE:2",
    code: "TBE",
    doseNumber: 2,
    dueDate: new Date("2024-09-20T00:00:00"),
    reason: "tbe-series",
    status: "soon",
    daysUntilDue: 20,
    ...overrides,
  };
}

describe("formatTiming — med availableFrom (primärserie-spacing)", () => {
  test("soon: 'Kan tas nu — deadline …'", () => {
    const d = dose({
      status: "soon",
      availableFrom: new Date("2024-07-22T00:00:00"),
      dueDate: new Date("2024-09-20T00:00:00"),
    });
    const s = formatTiming(d);
    expect(s).toMatch(/^Kan tas nu — deadline /);
    expect(s).toMatch(/2024/);
  });

  test("upcoming: 'Kan tas från …'", () => {
    const d = dose({
      status: "upcoming",
      availableFrom: new Date("2024-11-19T00:00:00"),
      dueDate: new Date("2025-06-22T00:00:00"),
    });
    const s = formatTiming(d);
    expect(s).toMatch(/^Kan tas från /);
    expect(s).not.toMatch(/deadline/);
  });

  test("overdue: rapporterar antal försenade dagar + datum", () => {
    const d = dose({
      status: "overdue",
      availableFrom: new Date("2024-07-22T00:00:00"),
      dueDate: new Date("2024-09-20T00:00:00"),
      daysUntilDue: -5,
    });
    const s = formatTiming(d);
    expect(s).toMatch(/försenat|dagar/i);
    expect(s).toContain("·");
  });
});

describe("formatTiming — utan availableFrom (booster/fallback)", () => {
  test("soon utan availableFrom: nuvarande 'Om N dagar · datum'", () => {
    const d = dose({
      status: "soon",
      availableFrom: undefined,
      daysUntilDue: 30,
      dueDate: new Date("2026-03-15T00:00:00"),
    });
    const s = formatTiming(d);
    expect(s).toContain("·");
    expect(s).not.toMatch(/Kan tas/);
  });

  test("upcoming utan availableFrom: nuvarande 'Om N dagar · datum'", () => {
    const d = dose({
      status: "upcoming",
      availableFrom: undefined,
      daysUntilDue: 365,
      dueDate: new Date("2030-01-01T00:00:00"),
    });
    const s = formatTiming(d);
    expect(s).toContain("·");
    expect(s).not.toMatch(/Kan tas/);
  });

  test("overdue utan availableFrom: samma som med", () => {
    const d = dose({
      status: "overdue",
      availableFrom: undefined,
      daysUntilDue: -100,
      dueDate: new Date("2024-01-01T00:00:00"),
    });
    const s = formatTiming(d);
    expect(s).toContain("·");
  });
});
