// Canonical vaccine catalogue. Used by VaccineSelect, the timeline group labels,
// and (later) the schedule/validity engine. Codes are stable identifiers — UI
// labels can change without DB migration.

export type VaccineCategory = "child" | "adult" | "travel" | "other";

export interface VaccineDef {
  code: string;
  /** Swedish display label */
  label: string;
  /** Short description shown in select */
  hint?: string;
  /** Common brand names to suggest in the brand field */
  brands: string[];
  category: VaccineCategory;
  /** Diseases the vaccine protects against — searchable */
  protects: string[];
  /** Direct links to official Swedish information pages.
   *  Falls back to a 1177 search if not specified. */
  infoUrls?: {
    s1177?: string;
    fhm?: string;
  };
}

export const VACCINES: readonly VaccineDef[] = [
  {
    code: "DTP_IPV_HIB_HEPB",
    label: "DTP-IPV-Hib-HepB (5-i-1)",
    hint: "Difteri, stelkramp, kikhosta, polio, Hib, hepatit B",
    brands: ["Hexyon", "Infanrix Hexa", "Vaxelis"],
    category: "child",
    protects: ["difteri", "stelkramp", "kikhosta", "polio", "hib", "hepatit b"],
    infoUrls: {
      s1177:
        "https://www.1177.se/undersokning-behandling/vaccinationer/vaccinationsprogrammet-for-barn/",
      fhm: "https://www.folkhalsomyndigheten.se/vara-amnesomraden/vaccinationer/nationella-vaccinationsprogram/barnvaccinationsprogram/",
    },
  },
  {
    code: "DTP_IPV",
    label: "DTP-IPV (4-i-1 booster)",
    hint: "Difteri, stelkramp, kikhosta, polio (5-årsbooster)",
    brands: ["Tetravac", "Boostrix-Polio"],
    category: "child",
    protects: ["difteri", "stelkramp", "kikhosta", "polio"],
    infoUrls: {
      s1177:
        "https://www.1177.se/undersokning-behandling/vaccinationer/vaccinationsprogrammet-for-barn/",
    },
  },
  {
    code: "DTAP",
    label: "dTp / dTaP (skolbooster)",
    hint: "Difteri, stelkramp, kikhosta — reducerad antigen",
    brands: ["Boostrix", "Triaxis"],
    category: "child",
    protects: ["difteri", "stelkramp", "kikhosta"],
    infoUrls: {
      s1177:
        "https://www.1177.se/undersokning-behandling/vaccinationer/vaccinationsprogrammet-for-barn/",
    },
  },
  {
    code: "TETANUS_DIPHTHERIA",
    label: "Stelkramp + difteri (dT)",
    hint: "Vuxenbooster var 20:e år",
    brands: ["diTeBooster", "Tedivax pro Adulto"],
    category: "adult",
    protects: ["difteri", "stelkramp"],
    infoUrls: {
      s1177:
        "https://www.1177.se/undersokning-behandling/vaccinationer/vilka-vaccinationer-rekommenderas-jag/",
    },
  },
  {
    code: "ROTAVIRUS",
    label: "Rotavirus",
    hint: "Mag-tarminfektion (oral)",
    brands: ["Rotarix", "RotaTeq"],
    category: "child",
    protects: ["rotavirus"],
    infoUrls: {
      fhm: "https://www.folkhalsomyndigheten.se/vara-amnesomraden/vaccinationer/nationella-vaccinationsprogram/barnvaccinationsprogram/",
    },
  },
  {
    code: "PNEUMOCOCCAL",
    label: "Pneumokock",
    brands: ["Prevenar 13", "Vaxneuvance", "Pneumovax", "Apexxnar"],
    category: "child",
    protects: ["pneumokocker"],
    infoUrls: {
      fhm: "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/vaccinationer/vacciner-a-o/pneumokocker/",
    },
  },
  {
    code: "MMR",
    label: "MPR (mässling, påssjuka, röda hund)",
    brands: ["MMRVaxPro", "Priorix"],
    category: "child",
    protects: ["mässling", "påssjuka", "röda hund"],
    infoUrls: {
      fhm: "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/vaccinationer/vacciner-a-o/massling-passjuka-och-roda-hund-mpr/",
    },
  },
  {
    code: "HPV",
    label: "HPV (humant papillomvirus)",
    hint: "Skydd mot livmoderhalscancer m.fl.",
    brands: ["Gardasil 9", "Cervarix"],
    category: "child",
    protects: ["hpv", "livmoderhalscancer"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/vaccinationer/vaccinationer-mot-hpv/",
      fhm: "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/vaccinationer/vacciner-a-o/humant-papillomvirus-hpv/",
    },
  },
  {
    code: "BCG",
    label: "BCG (tuberkulos)",
    hint: "Riktad mot riskgrupper",
    brands: ["BCG Vaccine SSI"],
    category: "child",
    protects: ["tuberkulos"],
  },
  {
    code: "VARICELLA",
    label: "Vattkoppor",
    brands: ["Varivax", "Varilrix"],
    category: "child",
    protects: ["vattkoppor"],
  },
  {
    code: "INFLUENZA",
    label: "Influensa",
    hint: "Säsong: oktober–januari",
    brands: ["Vaxigrip Tetra", "Influvac Tetra", "Fluenz Tetra (nasal)"],
    category: "adult",
    protects: ["influensa"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/lungor-och-luftvagar/inflammation-och-infektion-ilungor-och-luftror/influensa/",
      fhm: "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/vaccinationer/vacciner-a-o/influensa/",
    },
  },
  {
    code: "COVID_19",
    label: "Covid-19",
    brands: ["Comirnaty", "Spikevax", "Nuvaxovid"],
    category: "adult",
    protects: ["sars-cov-2", "covid"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/lungor-och-luftvagar/inflammation-och-infektion-ilungor-och-luftror/om-covid-19--coronavirus/om-vaccin-mot-covid-19/",
    },
  },
  {
    code: "TBE",
    label: "TBE (fästingburen hjärninflammation)",
    hint: "Schema: 0, 1–3 mån, 5–12 mån, 3 år, sen var 5:e år",
    brands: ["FSME-Immun", "Encepur"],
    category: "adult",
    protects: ["tbe", "fästing"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/infektioner/tbe-fastingburen-hjarninflammation/",
      fhm: "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/smittsamma-sjukdomar/tick-borne-encephalitis-tbe/",
    },
  },
  {
    code: "HEP_A",
    label: "Hepatit A",
    brands: ["Havrix", "Vaqta", "Avaxim"],
    category: "travel",
    protects: ["hepatit a"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/infektioner/hepatit-a/",
    },
  },
  {
    code: "HEP_B",
    label: "Hepatit B",
    brands: ["Engerix-B", "HBVaxPro", "Fendrix"],
    category: "adult",
    protects: ["hepatit b"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/infektioner/hepatit-b/",
    },
  },
  {
    code: "HEP_AB",
    label: "Hepatit A+B (kombination)",
    brands: ["Twinrix Vuxen", "Twinrix Paediatric", "AmBirix"],
    category: "travel",
    protects: ["hepatit a", "hepatit b"],
  },
  {
    code: "TYPHOID",
    label: "Tyfoid",
    hint: "Inaktiverat: ~3 års skydd. Oralt (Vivotif): ~3 år",
    brands: ["Typhim Vi", "Vivotif", "Typherix"],
    category: "travel",
    protects: ["tyfoid"],
  },
  {
    code: "YELLOW_FEVER",
    label: "Gula febern",
    hint: "≥10 dagar före resa. WHO: livslång giltighet sedan 2016.",
    brands: ["Stamaril"],
    category: "travel",
    protects: ["gula febern"],
    infoUrls: {
      s1177:
        "https://www.1177.se/sjukdomar--besvar/infektioner/gula-febern/",
    },
  },
  {
    code: "JAPANESE_ENCEPHALITIS",
    label: "Japansk encefalit",
    hint: "≥14 dagar före resa, 2-doseserie",
    brands: ["Ixiaro"],
    category: "travel",
    protects: ["japansk encefalit"],
  },
  {
    code: "RABIES",
    label: "Rabies",
    hint: "Pre-expositionsserie 0/7/21 dagar",
    brands: ["Rabipur", "VeroRab"],
    category: "travel",
    protects: ["rabies"],
  },
  {
    code: "CHOLERA",
    label: "Kolera (oral)",
    brands: ["Dukoral"],
    category: "travel",
    protects: ["kolera", "turistdiarré"],
  },
  {
    code: "MENINGOCOCCAL_ACWY",
    label: "Meningokock ACWY",
    brands: ["Nimenrix", "Menveo"],
    category: "travel",
    protects: ["meningokock"],
  },
  {
    code: "MENINGOCOCCAL_B",
    label: "Meningokock B",
    brands: ["Bexsero", "Trumenba"],
    category: "adult",
    protects: ["meningokock b"],
  },
  {
    code: "RSV",
    label: "RSV",
    brands: ["Arexvy", "Abrysvo"],
    category: "adult",
    protects: ["rsv"],
  },
  {
    code: "OTHER",
    label: "Annat vaccin",
    hint: "Skriv in vaccin manuellt nedan",
    brands: [],
    category: "other",
    protects: [],
  },
];

const BY_CODE = new Map(VACCINES.map((v) => [v.code, v]));

export function getVaccine(code: string): VaccineDef | undefined {
  return BY_CODE.get(code);
}

export function vaccineLabel(code: string, fallback?: string | null): string {
  return BY_CODE.get(code)?.label ?? fallback ?? code;
}

export interface InfoLink {
  source: "1177" | "Folkhälsomyndigheten";
  url: string;
}

/**
 * Returns canonical info links for a vaccine. Falls back to a 1177 search
 * URL based on the label so users always have *something* to read.
 */
export function vaccineInfoLinks(code: string): InfoLink[] {
  const def = BY_CODE.get(code);
  const links: InfoLink[] = [];
  if (def?.infoUrls?.s1177) {
    links.push({ source: "1177", url: def.infoUrls.s1177 });
  } else if (def) {
    // Fallback: 1177 search for the label
    const q = encodeURIComponent(def.label.split(" (")[0]);
    links.push({
      source: "1177",
      url: `https://www.1177.se/sok/?q=${q}`,
    });
  }
  if (def?.infoUrls?.fhm) {
    links.push({ source: "Folkhälsomyndigheten", url: def.infoUrls.fhm });
  }
  return links;
}

export function searchVaccines(query: string): VaccineDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return VACCINES.slice();
  return VACCINES.filter((v) => {
    if (v.label.toLowerCase().includes(q)) return true;
    if (v.code.toLowerCase().includes(q)) return true;
    if (v.hint?.toLowerCase().includes(q)) return true;
    if (v.protects.some((p) => p.includes(q))) return true;
    if (v.brands.some((b) => b.toLowerCase().includes(q))) return true;
    return false;
  });
}
