// "Är vaccinet fortfarande giltigt för den här profilen?"
//
// Konsumeras av resevaccin-modulen (M5) för att avgöra om en gammal Hep A
// från 2002 räknas som "redan har skydd" eller "behöver ny serie".

import { type Vaccination } from "../db/vaccinations";
import { getValidityRule } from "../schedules/validity";
import { dayjs } from "../utils/dates";

export type ValidityStatus =
  | { state: "incomplete"; dosesTaken: number; dosesNeeded: number }
  | { state: "valid"; expiresOn: Date | null }
  | { state: "expired"; expiredOn: Date }
  | { state: "unknown" };

/**
 * Compute current validity for a vaccine code given a profile's recorded doses.
 *
 *   incomplete — primary series not yet finished
 *   valid      — protected; expiresOn=null means lifelong
 *   expired    — past the booster window
 *   unknown    — no rule defined for this vaccine code
 */
export function isStillValid(
  vaccinations: Vaccination[],
  vaccineCode: string,
  today: Date,
): ValidityStatus {
  const rule = getValidityRule(vaccineCode);
  if (!rule) return { state: "unknown" };

  const doses = vaccinations
    .filter((v) => v.vaccineCode === vaccineCode)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  if (doses.length < rule.fullSeriesDoses) {
    return {
      state: "incomplete",
      dosesTaken: doses.length,
      dosesNeeded: rule.fullSeriesDoses,
    };
  }

  const lastDate = dayjs(doses[doses.length - 1].date);

  // Custom cadence (TBE)
  if (rule.customBoosterMonths && rule.customBoosterMonths.length > 0) {
    const seriesCompletion = dayjs(doses[rule.fullSeriesDoses - 1].date);
    const dosesAfter = doses.length - rule.fullSeriesDoses;
    const offsetMonths =
      rule.customBoosterMonths[
        Math.min(dosesAfter, rule.customBoosterMonths.length - 1)
      ];
    const expiresOn = seriesCompletion.add(offsetMonths, "month").toDate();
    if (dayjs(today).isAfter(dayjs(expiresOn))) {
      return { state: "expired", expiredOn: expiresOn };
    }
    return { state: "valid", expiresOn };
  }

  if (rule.boosterEveryYears) {
    const expiresOn = lastDate
      .add(rule.boosterEveryYears * 12, "month")
      .toDate();
    if (dayjs(today).isAfter(dayjs(expiresOn))) {
      return { state: "expired", expiredOn: expiresOn };
    }
    return { state: "valid", expiresOn };
  }

  if (rule.validityYearsAfterFullSeries == null) {
    // Lifelong
    return { state: "valid", expiresOn: null };
  }

  const expiresOn = lastDate
    .add(rule.validityYearsAfterFullSeries * 12, "month")
    .toDate();
  if (dayjs(today).isAfter(dayjs(expiresOn))) {
    return { state: "expired", expiredOn: expiresOn };
  }
  return { state: "valid", expiresOn };
}
