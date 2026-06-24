// Vuxenrekommendationer som inte är ålders-utlösta utan beroende av
// (a) tidigare doser och (b) profilens riskgrupper.
//
// Funktionsformen: derive(profile, vaccinations, today) → ExpectedDose[].
// Varje rekommendation är en "policy" som kan generera 0 eller 1 förväntade
// doser för en given profil + dataset.

import { type Vaccination } from "../db/vaccinations";
import { type Profile } from "../db/profiles";
import { dayjs } from "../utils/dates";
import { getValidityRule } from "./validity";
import { getChildProgram, type ReasonKey } from "./child-program";

// Codes whose dose-to-dose spacing is age-triggered (e.g. MMR dose 2 at 7,5 år)
// rather than interval-based. Resolved lazily so remote schedule refresh is
// reflected. CHILD_PROGRAM in derive.ts already produces the correct dueDate
// for the next dose; the adult-booster fallback of "+1 month" would otherwise
// flag a 4-year-old's MMR dose 2 as 1000 days overdue.
function childProgramCodes(): Set<string> {
  return new Set(getChildProgram().map((s) => s.code));
}

export interface AdultExpectedDose {
  code: string;
  doseNumber: number | null;
  /** Tidigast tillåtet att ta dosen. Saknas när vi inte har spacing-data. */
  availableFrom?: Date;
  /** Deadline: senaste rekommenderade datumet. */
  dueDate: Date;
  reason: ReasonKey;
}

/**
 * For each adult vaccine the profile has *started*, compute when the next
 * booster is due — whether that's a TBE booster, dT 20-year, flu next season,
 * etc.
 *
 * Does NOT propose first doses for vaccines the profile hasn't started; that's
 * a different concern (resevaccin module, riskgrupp prompts).
 */
export function deriveAdultBoosters(
  profile: Profile,
  vaccinations: Vaccination[],
  today: Date,
): AdultExpectedDose[] {
  const out: AdultExpectedDose[] = [];

  // Group vaccinations by code, sorted ascending by date
  const byCode = new Map<string, Vaccination[]>();
  for (const v of vaccinations.filter((v) => v.profileId === profile.id)) {
    if (!byCode.has(v.vaccineCode)) byCode.set(v.vaccineCode, []);
    byCode.get(v.vaccineCode)!.push(v);
  }
  for (const list of byCode.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }

  for (const [code, doses] of byCode) {
    const rule = getValidityRule(code);
    if (!rule) continue;
    const next = nextDoseFor(code, rule, doses, today);
    if (next) out.push(next);
  }

  // Riskgrupp-baserade årliga vacciner som triggas av åldern + riskgrupp
  // även om profilen inte tagit dem tidigare.
  const fluDue = nextFluSeason(profile, byCode.get("INFLUENZA") ?? [], today);
  if (fluDue) out.push(fluDue);

  // Tetanus-skydd är gemensamt för DTP_IPV_HIB_HEPB / DTP_IPV / DTAP /
  // TETANUS_DIPHTHERIA — en DTAP vid 14,5 år gör att 20-årsboostern räknas
  // därifrån, inte från en tidigare DTP_IPV vid 5 år. Behåll bara den
  // senaste föreslagna boostern i familjen.
  return dedupeTetanusFamily(out);
}

const TETANUS_FAMILY = new Set([
  "DTP_IPV_HIB_HEPB",
  "DTP_IPV",
  "DTAP",
  "TETANUS_DIPHTHERIA",
]);

function dedupeTetanusFamily(
  doses: AdultExpectedDose[],
): AdultExpectedDose[] {
  const family = doses.filter((d) => TETANUS_FAMILY.has(d.code));
  if (family.length <= 1) return doses;
  const latest = family.reduce((acc, cur) =>
    cur.dueDate.getTime() > acc.dueDate.getTime() ? cur : acc,
  );
  return doses.filter((d) => !TETANUS_FAMILY.has(d.code) || d === latest);
}

interface NextLogic {
  code: string;
  doseNumber: number;
  dueDate: Date;
  reason: ReasonKey;
}

function nextDoseFor(
  code: string,
  rule: ReturnType<typeof getValidityRule> & object,
  doses: Vaccination[],
  today: Date,
): AdultExpectedDose | null {
  if (!rule) return null;
  const lastDose = doses[doses.length - 1];
  const lastDate = dayjs(lastDose.date);
  // Räkningsregel R2: om något doseNumber är ifyllt litar vi på det högsta;
  // om inga är ifyllda räknar vi posterna. Skälet är att låta användaren
  // korrigera serien genom att skriva ett dosnummer (t.ex. "den senaste var
  // dos 1") utan att räkningen automatiskt höjs av att det finns äldre
  // null-poster.
  const maxDoseNumber = Math.max(0, ...doses.map((d) => d.doseNumber ?? 0));
  const anyFilled = doses.some((d) => d.doseNumber != null);
  const progress = anyFilled ? maxDoseNumber : doses.length;
  const seriesComplete = progress >= rule.fullSeriesDoses;
  const nextDoseNumber = progress + 1;

  // Series not yet complete — propose the next dose at a reasonable cadence.
  if (!seriesComplete) {
    // Defer to CHILD_PROGRAM for age-triggered child vaccines. Their next
    // dose date is determined by age, not by a "+1 month" placeholder.
    if (childProgramCodes().has(code)) return null;
    const spacing = rule.primarySeriesSpacing?.[progress - 1];
    if (spacing) {
      return {
        code,
        doseNumber: nextDoseNumber,
        availableFrom: lastDate.add(spacing.minDays, "day").toDate(),
        dueDate: lastDate.add(spacing.maxDays, "day").toDate(),
        reason: reasonFor(code),
      };
    }
    // Fallback when no per-dose spacing is configured: "1 month from last".
    return {
      code,
      doseNumber: nextDoseNumber,
      dueDate: lastDate.add(1, "month").toDate(),
      reason: reasonFor(code),
    };
  }

  // TBE has a custom cadence after the primary series.
  if (rule.customBoosterMonths && rule.customBoosterMonths.length > 0) {
    // Ankare = sista posten i primärserien om den finns. Om progress säger
    // att serien är klar men antalet poster är färre (t.ex. enda post med
    // doseNumber=4 via import) faller vi tillbaka på senaste posten så vi
    // inte indexerar utanför arrayen.
    const seriesAnchor = doses[rule.fullSeriesDoses - 1] ?? lastDose;
    const seriesCompletionDate = dayjs(seriesAnchor.date);
    const dosesAfterSeries = Math.max(0, progress - rule.fullSeriesDoses);
    const offsetMonths =
      rule.customBoosterMonths[
        Math.min(dosesAfterSeries, rule.customBoosterMonths.length - 1)
      ];
    const dueDate = seriesCompletionDate.add(offsetMonths, "month").toDate();
    return {
      code,
      doseNumber: nextDoseNumber,
      dueDate,
      reason: "tbe-booster",
    };
  }

  // Booster every N years from the latest dose.
  if (rule.boosterEveryYears) {
    const dueDate = lastDate.add(rule.boosterEveryYears * 12, "month").toDate();
    return {
      code,
      doseNumber: nextDoseNumber,
      dueDate,
      reason: reasonFor(code),
    };
  }

  // validityYearsAfterFullSeries — series valid for N years, then re-up.
  if (rule.validityYearsAfterFullSeries != null) {
    const dueDate = lastDate
      .add(rule.validityYearsAfterFullSeries * 12, "month")
      .toDate();
    return {
      code,
      doseNumber: nextDoseNumber,
      dueDate,
      reason: reasonFor(code),
    };
  }

  // Lifelong protection — no further dose expected.
  return null;
}

function reasonFor(code: string): ReasonKey {
  if (code === "TBE") return "tbe-booster";
  if (code === "INFLUENZA") return "flu-season";
  if (code === "COVID_19") return "covid-season";
  if (code === "TETANUS_DIPHTHERIA" || code === "DTAP" || code === "DTP_IPV")
    return "tetanus-booster";
  return "adult-other";
}

/**
 * Influensa: en gång per säsong (oktober–december). Triggas om profilen är 65+
 * eller i riskgrupp.
 */
function nextFluSeason(
  profile: Profile,
  flus: Vaccination[],
  today: Date,
): AdultExpectedDose | null {
  const eligible =
    profile.riskGroups.includes("age65") ||
    profile.riskGroups.includes("pregnant") ||
    profile.riskGroups.includes("immuno") ||
    profile.riskGroups.includes("lung") ||
    profile.riskGroups.includes("heart") ||
    profile.riskGroups.includes("diabetes") ||
    profile.riskGroups.includes("healthcare") ||
    isAge65Plus(profile.birthdate, today);
  if (!eligible) return null;

  const todayD = dayjs(today);
  // "Current season" — Oct 1 of current year through Mar 31 of next year.
  let seasonStart = dayjs(`${todayD.year()}-10-01`);
  if (todayD.isBefore(seasonStart)) {
    // before this autumn — current season is last autumn through this spring
    seasonStart = seasonStart.subtract(1, "year");
  }
  const seasonEnd = seasonStart.add(6, "month");

  const tookThisSeason = flus.some((v) => {
    const d = dayjs(v.date);
    return d.isAfter(seasonStart.subtract(1, "day")) && d.isBefore(seasonEnd);
  });
  if (tookThisSeason) {
    // Next year's season
    return {
      code: "INFLUENZA",
      doseNumber: null,
      dueDate: seasonStart.add(1, "year").toDate(),
      reason: "flu-season",
    };
  }

  // Not yet this season — due at season start (or now, if season has started)
  return {
    code: "INFLUENZA",
    doseNumber: null,
    dueDate: seasonStart.toDate(),
    reason: "flu-season",
  };
}

function isAge65Plus(birthdate: string, today: Date): boolean {
  return dayjs(today).diff(dayjs(birthdate), "year") >= 65;
}
