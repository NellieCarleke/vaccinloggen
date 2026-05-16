// Resevaccin-rekommendationer per destination. Statisk data — kuraterad från
// Folkhälsomyndighetens reseråd och WHO IHR-krav. Datum för senaste uppdatering
// visas i UI så att användaren förstår att det inte är en levande databas.
//
// Riktlinjer för datan:
// - "core": vacciner som rekommenderas för i princip alla resenärer.
// - "risk": kontextberoende (längre vistelse, landsbygd, djungel, etc.).
// - "required": juridiskt obligatoriskt (gulafeber-IHR i vissa länder).
// - timing.minDaysBeforeDeparture: hur tidigt serien måste startas.

import { type Vaccination } from "../db/vaccinations";

export const TRAVEL_DATA_VERSION = "2026-05-10";

export interface CountryRec {
  /** ISO 3166-1 alpha-2 */
  iso: string;
  /** Swedish display name */
  name: string;
  /** Region for grouping in picker */
  region:
    | "europa"
    | "norden"
    | "nordamerika"
    | "syd-mellanamerika"
    | "asien"
    | "afrika"
    | "mellanostern"
    | "oceanien";
  vaccines: TravelVaccineRec[];
  notes?: string;
}

export interface TravelVaccineRec {
  /** Canonical vaccine code from schedules/vaccines.ts */
  code: string;
  /** core / risk / required */
  level: "core" | "risk" | "required";
  /** When does this become time-critical before departure? */
  minDaysBeforeDeparture?: number;
  /** Optional rationale shown in UI */
  reason?: string;
}

const DTPI_BASIC: TravelVaccineRec = {
  code: "DTP_IPV",
  level: "core",
  reason: "Grundskydd: stelkramp, difteri, polio, kikhosta",
};
const HEP_A_CORE: TravelVaccineRec = {
  code: "HEP_A",
  level: "core",
  reason: "Mat- och vattenburen smitta",
};
const HEP_B_RISK: TravelVaccineRec = {
  code: "HEP_B",
  level: "risk",
  reason: "Längre vistelse, vårdkontakt eller sex med ny partner",
};
const TYPHOID_RISK: TravelVaccineRec = {
  code: "TYPHOID",
  level: "risk",
  reason: "Resa till områden med bristande vatten- och avlopp",
};
const RABIES_RISK: TravelVaccineRec = {
  code: "RABIES",
  level: "risk",
  minDaysBeforeDeparture: 21,
  reason: "Längre vistelse, lantligt eller djurkontakt",
};
const JE_RISK: TravelVaccineRec = {
  code: "JAPANESE_ENCEPHALITIS",
  level: "risk",
  minDaysBeforeDeparture: 28,
  reason: "Längre vistelse på landsbygd i ris-/grisodlingsområden",
};
const YF_RISK: TravelVaccineRec = {
  code: "YELLOW_FEVER",
  level: "risk",
  minDaysBeforeDeparture: 10,
  reason: "Risk i regnskogsområden",
};
const YF_REQUIRED: TravelVaccineRec = {
  code: "YELLOW_FEVER",
  level: "required",
  minDaysBeforeDeparture: 10,
  reason: "Krav enligt IHR — intyg krävs vid inresa",
};
const CHOLERA_RISK: TravelVaccineRec = {
  code: "CHOLERA",
  level: "risk",
  reason: "Vid utbrott eller hög exponeringsrisk för turistdiarré",
};
const TBE_RISK: TravelVaccineRec = {
  code: "TBE",
  level: "risk",
  reason: "Vid utomhusvistelse i fästingområden i östra och centrala Europa",
};

export const COUNTRIES: readonly CountryRec[] = [
  // Asien
  {
    iso: "TH",
    name: "Thailand",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "VN",
    name: "Vietnam",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "KH",
    name: "Kambodja",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "ID",
    name: "Indonesien",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "IN",
    name: "Indien",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK, CHOLERA_RISK],
  },
  {
    iso: "NP",
    name: "Nepal",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "LK",
    name: "Sri Lanka",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "PH",
    name: "Filippinerna",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, JE_RISK],
  },
  {
    iso: "CN",
    name: "Kina",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, JE_RISK],
  },
  {
    iso: "JP",
    name: "Japan",
    region: "asien",
    vaccines: [DTPI_BASIC, HEP_A_CORE, JE_RISK],
  },

  // Afrika
  {
    iso: "KE",
    name: "Kenya",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_REQUIRED, CHOLERA_RISK],
    notes: "Gulafeber-intyg krävs vid inresa från IHR-länder.",
  },
  {
    iso: "TZ",
    name: "Tanzania",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_RISK, CHOLERA_RISK],
  },
  {
    iso: "UG",
    name: "Uganda",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_REQUIRED],
  },
  {
    iso: "ZA",
    name: "Sydafrika",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK],
  },
  {
    iso: "MA",
    name: "Marocko",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK],
  },
  {
    iso: "EG",
    name: "Egypten",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK],
  },
  {
    iso: "NG",
    name: "Nigeria",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_REQUIRED],
  },
  {
    iso: "GH",
    name: "Ghana",
    region: "afrika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_REQUIRED],
  },

  // Syd-/Mellanamerika
  {
    iso: "BR",
    name: "Brasilien",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_RISK],
  },
  {
    iso: "PE",
    name: "Peru",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK, YF_RISK],
  },
  {
    iso: "EC",
    name: "Ecuador",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, YF_RISK],
  },
  {
    iso: "BO",
    name: "Bolivia",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, YF_RISK],
  },
  {
    iso: "CO",
    name: "Colombia",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, YF_RISK],
  },
  {
    iso: "AR",
    name: "Argentina",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, YF_RISK],
  },
  {
    iso: "CU",
    name: "Kuba",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK],
  },
  {
    iso: "MX",
    name: "Mexiko",
    region: "syd-mellanamerika",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK, RABIES_RISK],
  },

  // Mellanöstern
  {
    iso: "TR",
    name: "Turkiet",
    region: "mellanostern",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TBE_RISK],
  },
  {
    iso: "IL",
    name: "Israel",
    region: "mellanostern",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK],
  },
  {
    iso: "JO",
    name: "Jordanien",
    region: "mellanostern",
    vaccines: [DTPI_BASIC, HEP_A_CORE, HEP_B_RISK, TYPHOID_RISK],
  },

  // Europa (mest TBE)
  {
    iso: "AT",
    name: "Österrike",
    region: "europa",
    vaccines: [DTPI_BASIC, TBE_RISK],
  },
  {
    iso: "DE",
    name: "Tyskland",
    region: "europa",
    vaccines: [DTPI_BASIC, TBE_RISK],
  },
  {
    iso: "CZ",
    name: "Tjeckien",
    region: "europa",
    vaccines: [DTPI_BASIC, TBE_RISK],
  },
  {
    iso: "PL",
    name: "Polen",
    region: "europa",
    vaccines: [DTPI_BASIC, TBE_RISK],
  },
  {
    iso: "EE",
    name: "Estland",
    region: "europa",
    vaccines: [DTPI_BASIC, TBE_RISK],
  },
  {
    iso: "LV",
    name: "Lettland",
    region: "europa",
    vaccines: [DTPI_BASIC, TBE_RISK],
  },

  // Oceanien & nordamerika
  {
    iso: "AU",
    name: "Australien",
    region: "oceanien",
    vaccines: [DTPI_BASIC, HEP_A_CORE],
  },
  {
    iso: "NZ",
    name: "Nya Zeeland",
    region: "oceanien",
    vaccines: [DTPI_BASIC, HEP_A_CORE],
  },
  {
    iso: "US",
    name: "USA",
    region: "nordamerika",
    vaccines: [DTPI_BASIC],
  },
  {
    iso: "CA",
    name: "Kanada",
    region: "nordamerika",
    vaccines: [DTPI_BASIC],
  },
];

const BY_ISO = new Map(COUNTRIES.map((c) => [c.iso, c]));

export function getCountry(iso: string): CountryRec | undefined {
  return BY_ISO.get(iso);
}

export function searchCountries(query: string): CountryRec[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES.slice();
  return COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q),
  );
}

/**
 * Aggregate recommended vaccines for a list of destinations. If the same
 * vaccine appears across multiple countries, take the *strongest* level
 * (required > core > risk) and the longest minDaysBeforeDeparture.
 */
export function mergeRecommendations(
  isos: string[],
): TravelVaccineRec[] {
  const merged = new Map<string, TravelVaccineRec>();
  for (const iso of isos) {
    const country = BY_ISO.get(iso);
    if (!country) continue;
    for (const rec of country.vaccines) {
      const existing = merged.get(rec.code);
      if (!existing) {
        merged.set(rec.code, { ...rec });
        continue;
      }
      // Strongest level wins
      const stronger = strongerLevel(existing.level, rec.level);
      const longerLead = Math.max(
        existing.minDaysBeforeDeparture ?? 0,
        rec.minDaysBeforeDeparture ?? 0,
      );
      merged.set(rec.code, {
        code: rec.code,
        level: stronger,
        minDaysBeforeDeparture: longerLead || undefined,
        reason: existing.reason ?? rec.reason,
      });
    }
  }
  return [...merged.values()];
}

function strongerLevel(
  a: TravelVaccineRec["level"],
  b: TravelVaccineRec["level"],
): TravelVaccineRec["level"] {
  const order = { required: 3, core: 2, risk: 1 } as const;
  return order[a] >= order[b] ? a : b;
}

export function regionLabel(r: CountryRec["region"]): string {
  switch (r) {
    case "europa":
      return "Europa";
    case "norden":
      return "Norden";
    case "nordamerika":
      return "Nordamerika";
    case "syd-mellanamerika":
      return "Syd- & Mellanamerika";
    case "asien":
      return "Asien";
    case "afrika":
      return "Afrika";
    case "mellanostern":
      return "Mellanöstern";
    case "oceanien":
      return "Oceanien";
  }
}

export type RecommendationStatus =
  | "covered"
  | "incomplete"
  | "expired"
  | "missing";

export interface RecommendationOutcome {
  rec: TravelVaccineRec;
  status: RecommendationStatus;
  /** When the existing series will expire (if covered) */
  expiresOn?: Date | null;
  /** "Starta senast YYYY-MM-DD" if time-critical */
  startBy?: Date;
}

export type { Vaccination };
