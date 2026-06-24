// Giltighetsregler per vaccin — när ett färdigvaccinerat skydd "går ut" och
// nästa booster behövs. Konsumeras både av resemodulen och av vuxenrekommendationer.
//
// Exempel:
//   isStillValid(profile, "TBE", today) → { valid: true, expiresOn: 2031-04-15 }

export interface ValidityRule {
  /** Number of doses needed for the primary series to count as "complete". */
  fullSeriesDoses: number;
  /** After series complete, how many years until protection expires.
   *  null = lifelong (no booster needed). */
  validityYearsAfterFullSeries?: number | null;
  /** Booster cadence after series complete. Overrides validityYears for
   *  vaccines where the rule is "every N years" rather than a fixed expiry. */
  boosterEveryYears?: number;
  /** Special: TBE has a unique cadence — first booster after 3 yr, then 5 yr. */
  customBoosterMonths?: number[];
  /** Intervall mellan doser INNAN primärserien är klar. Ett element per
   *  övergång (N-1 element för N doser): index 0 = dos 1→2, index 1 = dos 2→3, …
   *  minDays = tidigast tillåtet att ta nästa dos. maxDays = deadline. */
  primarySeriesSpacing?: Array<{ minDays: number; maxDays: number }>;
}

export const BUNDLED_VALIDITY_RULES: Record<string, ValidityRule> = {
  // Barnvaccin
  ROTAVIRUS: { fullSeriesDoses: 3, validityYearsAfterFullSeries: null },
  DTP_IPV_HIB_HEPB: { fullSeriesDoses: 3, validityYearsAfterFullSeries: null },
  PNEUMOCOCCAL: { fullSeriesDoses: 3, validityYearsAfterFullSeries: null },
  MMR: { fullSeriesDoses: 2, validityYearsAfterFullSeries: null },
  HPV: { fullSeriesDoses: 2, validityYearsAfterFullSeries: null },
  VARICELLA: { fullSeriesDoses: 2, validityYearsAfterFullSeries: null },
  BCG: { fullSeriesDoses: 1, validityYearsAfterFullSeries: null },

  // Vuxen
  // dT grundvaccination: 3 doser, ≥1 mån mellan 1→2, ≥6 mån mellan 2→3.
  // Källa: Folkhälsomyndigheten – Rekommendationer om grundvaccination av vuxna.
  TETANUS_DIPHTHERIA: {
    fullSeriesDoses: 3,
    boosterEveryYears: 20,
    primarySeriesSpacing: [
      { minDays: 30, maxDays: 60 },
      { minDays: 180, maxDays: 365 },
    ],
  },
  DTAP: { fullSeriesDoses: 5, boosterEveryYears: 20 },
  DTP_IPV: { fullSeriesDoses: 4, boosterEveryYears: 20 },
  INFLUENZA: { fullSeriesDoses: 1, boosterEveryYears: 1 },
  COVID_19: { fullSeriesDoses: 1, boosterEveryYears: 1 },
  // TBE: doses 1, 2, 3 → primary series. Dose 4 efter 3 år. Sen var 5:e.
  // Primärserie-intervall enl. FASS / 1177: dos 1→2 = 1–3 mån, dos 2→3 = 5–12 mån.
  TBE: {
    fullSeriesDoses: 3,
    customBoosterMonths: [36, 36 + 60, 36 + 120, 36 + 180],
    primarySeriesSpacing: [
      { minDays: 30, maxDays: 90 },   // dos 1 → 2 (1–3 mån)
      { minDays: 150, maxDays: 365 }, // dos 2 → 3 (5–12 mån)
    ],
  },
  RSV: { fullSeriesDoses: 1, boosterEveryYears: 1 },

  // Resa
  // Hepatit A: 2 doser, 6–12 mån mellan. Källa: 1177 + FHM.
  HEP_A: {
    fullSeriesDoses: 2,
    validityYearsAfterFullSeries: 25,
    primarySeriesSpacing: [{ minDays: 180, maxDays: 365 }],
  },
  // Hepatit B: 3 doser, schema 0,1,6 mån. Källa: internetmedicin / Janusinfo / FASS Engerix-B.
  HEP_B: {
    fullSeriesDoses: 3,
    validityYearsAfterFullSeries: null,
    primarySeriesSpacing: [
      { minDays: 28, maxDays: 60 },
      { minDays: 120, maxDays: 180 },
    ],
  },
  // Twinrix Vuxen: 3 doser, schema 0,1,6 mån. Källa: FASS Twinrix Vuxen.
  HEP_AB: {
    fullSeriesDoses: 3,
    validityYearsAfterFullSeries: 25,
    primarySeriesSpacing: [
      { minDays: 28, maxDays: 60 },
      { minDays: 120, maxDays: 180 },
    ],
  },
  TYPHOID: { fullSeriesDoses: 1, validityYearsAfterFullSeries: 3 },
  YELLOW_FEVER: { fullSeriesDoses: 1, validityYearsAfterFullSeries: null },
  // Ixiaro: 2 doser, ≥28 dagar mellan (upp till 11 mån). Källa: FASS Ixiaro.
  JAPANESE_ENCEPHALITIS: {
    fullSeriesDoses: 2,
    validityYearsAfterFullSeries: 1,
    boosterEveryYears: 10,
    primarySeriesSpacing: [{ minDays: 28, maxDays: 330 }],
  },
  // Rabipur pre-expo: 3 doser, schema 0/7/21–28 dagar. Källa: FASS Rabipur / SmPC.
  RABIES: {
    fullSeriesDoses: 3,
    validityYearsAfterFullSeries: 2,
    primarySeriesSpacing: [
      { minDays: 7, maxDays: 14 },
      { minDays: 14, maxDays: 21 },
    ],
  },
  // Dukoral: 2 doser, 1–6 veckor mellan. Källa: 1177 + FASS Dukoral.
  CHOLERA: {
    fullSeriesDoses: 2,
    validityYearsAfterFullSeries: 2,
    primarySeriesSpacing: [{ minDays: 7, maxDays: 42 }],
  },
  MENINGOCOCCAL_ACWY: { fullSeriesDoses: 1, validityYearsAfterFullSeries: 5 },
  // Bexsero: 2 doser, ≥1 mån mellan. Källa: FASS Bexsero.
  MENINGOCOCCAL_B: {
    fullSeriesDoses: 2,
    validityYearsAfterFullSeries: null,
    primarySeriesSpacing: [{ minDays: 28, maxDays: 60 }],
  },
};

let _activeValidityRules: Record<string, ValidityRule> = BUNDLED_VALIDITY_RULES;

export function getValidityRule(code: string): ValidityRule | null {
  return _activeValidityRules[code] ?? null;
}

export function setValidityRules(rules: Record<string, ValidityRule>): void {
  _activeValidityRules = rules;
}

export function resetValidityRulesToBundled(): void {
  _activeValidityRules = BUNDLED_VALIDITY_RULES;
}
