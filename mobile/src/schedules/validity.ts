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
  TETANUS_DIPHTHERIA: { fullSeriesDoses: 3, boosterEveryYears: 20 },
  DTAP: { fullSeriesDoses: 5, boosterEveryYears: 20 },
  DTP_IPV: { fullSeriesDoses: 4, boosterEveryYears: 20 },
  INFLUENZA: { fullSeriesDoses: 1, boosterEveryYears: 1 },
  COVID_19: { fullSeriesDoses: 1, boosterEveryYears: 1 },
  // TBE: doses 1, 2, 3 → primary series. Dose 4 efter 3 år. Sen var 5:e.
  TBE: { fullSeriesDoses: 3, customBoosterMonths: [36, 36 + 60, 36 + 120, 36 + 180] },
  RSV: { fullSeriesDoses: 1, boosterEveryYears: 1 },

  // Resa
  HEP_A: { fullSeriesDoses: 2, validityYearsAfterFullSeries: 25 },
  HEP_B: { fullSeriesDoses: 3, validityYearsAfterFullSeries: null },
  HEP_AB: { fullSeriesDoses: 3, validityYearsAfterFullSeries: 25 },
  TYPHOID: { fullSeriesDoses: 1, validityYearsAfterFullSeries: 3 },
  YELLOW_FEVER: { fullSeriesDoses: 1, validityYearsAfterFullSeries: null },
  JAPANESE_ENCEPHALITIS: { fullSeriesDoses: 2, validityYearsAfterFullSeries: 1, boosterEveryYears: 10 },
  RABIES: { fullSeriesDoses: 3, validityYearsAfterFullSeries: 2 },
  CHOLERA: { fullSeriesDoses: 2, validityYearsAfterFullSeries: 2 },
  MENINGOCOCCAL_ACWY: { fullSeriesDoses: 1, validityYearsAfterFullSeries: 5 },
  MENINGOCOCCAL_B: { fullSeriesDoses: 2, validityYearsAfterFullSeries: null },
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
