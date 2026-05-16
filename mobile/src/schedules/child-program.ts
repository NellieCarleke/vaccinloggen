// Det svenska barnvaccinationsprogrammet — exakta åldrar och doser från
// Folkhälsomyndigheten / Rikshandboken. Källor i sources.json (se PLAN §5b).
//
// All dates are computed from profile.birthdate at runtime — never stored.

import { dayjs } from "../utils/dates";

export interface ExpectedDoseSpec {
  /** Canonical vaccine code from schedules/vaccines.ts */
  code: string;
  /** 1-indexed dose number within this vaccine's series */
  dose: number;
  /** Trigger spec — at what age the dose is offered */
  trigger: AgeTrigger;
  /** Reason key for grouping + reminder copy */
  reason: ReasonKey;
  /** ISO date when this vaccine was added to the Swedish program. Used by
   *  bulk-historical-import to avoid creating phantom entries for vaccines
   *  that didn't exist when the person was the relevant age. */
  availableFrom?: string;
}

export type AgeTrigger =
  | { kind: "weeks"; value: number }
  | { kind: "months"; value: number }
  | { kind: "years"; value: number };

export type ReasonKey =
  | "barnprogram-bvc"
  | "barnprogram-skola"
  | "tbe-series"
  | "tbe-booster"
  | "tetanus-booster"
  | "flu-season"
  | "covid-season"
  | "adult-other";

/**
 * Compute the date a child is offered a given dose, based on their birthdate.
 */
export function dueDateFor(birthdate: string, trigger: AgeTrigger): Date {
  const b = dayjs(birthdate);
  switch (trigger.kind) {
    case "weeks":
      return b.add(trigger.value, "week").toDate();
    case "months":
      return b.add(trigger.value, "month").toDate();
    case "years":
      return b.add(trigger.value * 12, "month").toDate();
  }
}

/**
 * Det allmänna barnvaccinationsprogrammet (BVC + skola).
 * BVC: 6 veckor → 12 mån, plus 5-årsbooster.
 * Skola: åk 1–2, åk 5 (HPV), åk 8–9.
 *
 * Skol-åldrar approximeras: åk 1 startar normalt höstterminen efter att barnet
 * fyllt 6 år, så vi sätter "åk 1–2" till 7,5 år. HPV i åk 5 ≈ 11 år. Åk 8–9 ≈ 14,5 år.
 */
// Datum då varje vaccin lades till i det svenska barnvaccinationsprogrammet.
// Används av bulk-historical-import OCH derive — om en dos beräknat
// förfallodatum ligger före vaccinet fanns i programmet skapas/visas
// ingen post. Kombo-vacciner (DTP_IPV_HIB_HEPB) behandlas som proxy
// för skyddet och saknar availableFrom.
const ROTAVIRUS_ADDED = "2019-09-01"; // Allmänt nationellt program 2019
const HPV_ADDED = "2012-01-01"; // Flickor 2012; pojkar 2020
const PNEUMOCOCCAL_ADDED = "2009-01-01"; // Allmänt program 2009

export const BUNDLED_CHILD_PROGRAM: readonly ExpectedDoseSpec[] = [
  // 6 veckor
  { code: "ROTAVIRUS", dose: 1, trigger: w(6), reason: "barnprogram-bvc", availableFrom: ROTAVIRUS_ADDED },
  // 3 månader
  { code: "ROTAVIRUS", dose: 2, trigger: m(3), reason: "barnprogram-bvc", availableFrom: ROTAVIRUS_ADDED },
  { code: "DTP_IPV_HIB_HEPB", dose: 1, trigger: m(3), reason: "barnprogram-bvc" },
  { code: "PNEUMOCOCCAL", dose: 1, trigger: m(3), reason: "barnprogram-bvc", availableFrom: PNEUMOCOCCAL_ADDED },
  // 5 månader
  { code: "ROTAVIRUS", dose: 3, trigger: m(5), reason: "barnprogram-bvc", availableFrom: ROTAVIRUS_ADDED },
  { code: "DTP_IPV_HIB_HEPB", dose: 2, trigger: m(5), reason: "barnprogram-bvc" },
  { code: "PNEUMOCOCCAL", dose: 2, trigger: m(5), reason: "barnprogram-bvc", availableFrom: PNEUMOCOCCAL_ADDED },
  // 12 månader
  { code: "DTP_IPV_HIB_HEPB", dose: 3, trigger: m(12), reason: "barnprogram-bvc" },
  { code: "PNEUMOCOCCAL", dose: 3, trigger: m(12), reason: "barnprogram-bvc", availableFrom: PNEUMOCOCCAL_ADDED },
  // 18 månader (MPR ges ofta vid 18 mån i Sverige)
  { code: "MMR", dose: 1, trigger: m(18), reason: "barnprogram-bvc" },
  // 5 år
  { code: "DTP_IPV", dose: 4, trigger: y(5), reason: "barnprogram-bvc" },
  // åk 1–2 (≈ 7,5 år)
  { code: "MMR", dose: 2, trigger: m(90), reason: "barnprogram-skola" },
  // åk 5 (≈ 11 år) — HPV 2 doser
  { code: "HPV", dose: 1, trigger: y(11), reason: "barnprogram-skola", availableFrom: HPV_ADDED },
  { code: "HPV", dose: 2, trigger: m(11 * 12 + 6), reason: "barnprogram-skola", availableFrom: HPV_ADDED },
  // åk 8–9 (≈ 14,5 år)
  { code: "DTAP", dose: 5, trigger: m(14 * 12 + 6), reason: "barnprogram-skola" },
];

// Active program — starts as the bundled one, may be replaced by remote refresh
// at app start. Always go through getChildProgram() so consumers see the latest.
let _activeChildProgram: readonly ExpectedDoseSpec[] = BUNDLED_CHILD_PROGRAM;

export function getChildProgram(): readonly ExpectedDoseSpec[] {
  return _activeChildProgram;
}

export function setChildProgram(specs: readonly ExpectedDoseSpec[]): void {
  _activeChildProgram = specs;
}

export function resetChildProgramToBundled(): void {
  _activeChildProgram = BUNDLED_CHILD_PROGRAM;
}

function w(value: number): AgeTrigger {
  return { kind: "weeks", value };
}
function m(value: number): AgeTrigger {
  return { kind: "months", value };
}
function y(value: number): AgeTrigger {
  return { kind: "years", value };
}

export function describeAgeTrigger(t: AgeTrigger): string {
  switch (t.kind) {
    case "weeks":
      return `${t.value} v`;
    case "months":
      return t.value < 24 ? `${t.value} mån` : `${Math.round(t.value / 12)} år`;
    case "years":
      return `${t.value} år`;
  }
}
