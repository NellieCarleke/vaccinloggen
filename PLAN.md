# Vaccinloggen — Plan

> Namnet är **Vaccinloggen**. Domän- och varumärkescheck (PRV + .se) görs innan App Store-registrering.

## 1. Context

You want a Swedish app that keeps track of vaccinations for yourself and your kids. Existing options and their gaps (this table is from web research I just did, not from claims you'd made — your "I can't see all my things in 1177" was the prompt to investigate, but the patchy-by-region finding is independently confirmed by Folkhälsomyndighetens / 1177's own materials):

| App / system | What it is | Coverage gap |
|---|---|---|
| **1177 Journalen** | National e-health portal, web + app. Surfaces vaccination entries from each region's EHR. | Folkhälsomyndighetens / 1177's own docs say "how much information is shown varies between care providers, and information may not always be complete for all vaccinations or all ages, which depends on which region you live in and how the systems are integrated." No reminders. No export. |
| **MittVaccin** (Mittvaccin Sverige AB, kör på Cambio's MittVaccin Journal EHR) | Både en vårdgivare-EHR (~4 500 kliniker / 18 regioner / 88 kommuner) och en konsumentapp + `mittvaccin.se`-portal via BankID. iOS App Store (svenska butiken, sök "MittVaccin", utvecklare "Mittvaccin Sverige AB"). Android: `com.mittvaccin.app`. Direkt-länkar via [mittvaccin.se/app/](https://mittvaccin.se/app/). Gratis nedladdning, **39 kr/år** för full access (history + reminders); 30 dagars gratis prova-på. Vårdnadshavare kan se barns historik. Bokning hos anslutna kliniker. | **Visar bara vad som registrerats hos MittVaccin-anslutna kliniker.** Kan inte registrera manuellt — om din BVC ej är ansluten, eller du har ett gammalt pappersvaccinationskort från 90-talet, syns det aldrig. **Reminders endast på fångade entries** — om vaccinet aldrig syns i appen från start, kommer ingen påminnelse heller. **Ingen trip-planning** — appen kan visa redan-tagna resevaccinationer (om registrerade hos MittVaccin-klinik) men föreslår *inte* "för Thailand behöver du Hep A, tyfoid, JE". Kräver BankID. Subscription för de nyttiga funktionerna. |
| **Svea Vaccin app** | Tied to Svea Vaccin's own clinics. | Reviews report kids' vaccines often missing from app despite being in their system; TBE dates parsed wrong. Svea Vaccin AB has had IVO-flagged quality issues at the operator level. |
| **VaccinDirekt app / Vaccin.se** | Tied to a single operator. | Same single-operator problem as Svea. |
| **VaxTrack** (planet72.com) | Generic international family/pet vaccination tracker. | No Swedish schema baked in; English-first; no built-in resevaccin logic. |
| **Pappers­vaccinationskort** | The yellow card from BVC / vaccinationsklinik. | Easy to lose. Not searchable. No reminders. Hard to share. |
| **Folkhälsomyndighetens NVR API** | National Vaccination Register, OAuth2 API. | Closed to individuals — only vårdgivare can authenticate (they report data IN). Not a personal-access API. |

**The hole — what *we* can offer that the others can't:**
- **Source-agnostic**: capture entries from any provider (BVC, vårdcentral, oavsett MittVaccin-anslutning, utlandsresor, gamla pappersvaccinationskort) via manual entry + photo.
- **Free, no subscription, no BankID** — works for everyone including kids and non-Swedish residents who lack BankID.
- **Local-only / privacy-first**: no servers, no cloud, no GDPR controller exposure.
- **Built-in reseplanering** with timing constraints — not a feature any of the above ships meaningfully.
- **Family-first UX** — multiple kids + adults in one view, not bolted on.

**Honest framing**: om du bor i en MittVaccin-stark region OCH alla dina kliniker är MittVaccin-anslutna OCH du betalar 39 kr/år, så täcker MittVaccin det grundläggande för historik + påminnelser. Men *trip-planning* (vilka vacciner behöver familjen för en resa) och *manuella entries från icke-anslutna källor* (gammalt pappersvaccinationskort, BVC i icke-ansluten region, utlandsvaccinering) saknas — där finns vår nisch. Plus: gratis, ingen BankID-låsning, lokal-först, hela familjen i samma vy oavsett ålder och vårdgivare.

## 2. Decisions locked in (from clarifying Q&A)

- **Storage**: Local-only on device. No backend, no GDPR controller burden.
- **Sharing with partner**: "Hacks" — exportable encrypted file + PDF. Partner imports on their own copy of the app.
- **Platform**: iOS + Android via Expo (cross-platform from v1).
- **Language**: Swedish only in UI.
- **MVP includes**: Manual entry, Swedish barnvaccinationsprogrammet schema, reminders, photo/document attachments, travel vaccine module.
- **NOT in MVP**: OCR of paper kort, real-time partner sync, EHR/MittVaccin/1177 integration.
- **Auth**: Biometric (Face ID / Touch ID / Android biometric) lock. No account, no password.

## 3. Vision

A Swedish vaccination passport in your pocket — for you, your partner, and your kids — that:

1. **Knows Swedish schemas** out of the box: barnvaccinationsprogrammet, vuxenrekommendationer (TBE, dT, influensa, covid), HPV-catch-up, riskgrupp.
2. **Captures any vaccine from any source** via simple manual entry + photo of vaccinationskort/kvitto.
3. **Reminds proactively** before doses are due — for the right family member, at the right lead time, with reasonable defaults.
4. **Plans travel vaccinations**: destination + datum → list of recommended vaccines with timing constraints (e.g. gula febern måste tas ≥10 dagar före resa).
5. **Exports** a beautiful PDF "vaccinationskort" you can show on förskolan, vid resor, hos en ny vårdcentral — and a JSON file you can hand to your partner.

## 4. MVP feature set (v1)

### 4.1 Profilhantering
- Skapa profiler för familjemedlemmar: namn, födelsedatum, kön (för HPV-default), riskgruppsmarkörer (astma, gravid, immunosupprimerad, etc.).
- En "primary" profil (du) + obegränsat med ytterligare profiler (barn, partner-stöd-profil).
- Foto/avatar valfritt.

### 4.2 Vaccinationer — registrera
Per entry, fält:
- **Vaccin** (val från lista: DTP-IPV-Hib-HepB, Pneumokock, Rotavirus, MPR, HPV, TBE, Influensa, Covid-19, …) eller fri text.
- **Fabrikat / handelsnamn** (Pentavac, Infanrix, Boostrix, Gardasil 9, …).
- **Datum** för dos.
- **Dosnummer** (1, 2, 3, booster).
- **Plats / vårdgivare** (BVC Solna, Apoteket Hjärtat city, Svea Vaccin Vasastan, …).
- **Batchnummer / LOT** (valfritt).
- **Anteckning** (biverkningar, nästa planerade dos, …).
- **Bilagor**: foto av vaccinationskort, kvitto, intyg som PDF/bild.

### 4.3 Inbyggda Svenska scheman

Hardcoded i appen, versionerade. Minst:

**Barnvaccinationsprogrammet (BVC + skola):**
| Ålder | Vaccin |
|---|---|
| 6 v | Rotavirus dos 1 |
| 3 mån | Rotavirus 2, DTP-IPV-Hib-HepB 1, Pneumokock 1 |
| 5 mån | Rotavirus 3, DTP-IPV-Hib-HepB 2, Pneumokock 2 |
| 12 mån | DTP-IPV-Hib-HepB 3, Pneumokock 3, MPR 1 |
| 5 år | DTP-IPV booster |
| Åk 1–2 | MPR 2 |
| Åk 5 | HPV 1 & 2 |
| Åk 8–9 | dTp |

**Vuxenrekommendationer:**
| Vaccin | Intervall |
|---|---|
| Stelkramp/difteri (dT) | Booster var 20:e år |
| TBE (fästingvaccin) | 0, 1–3 mån, 5–12 mån, 3 år, sen var 5:e år |
| Influensa | Årligen (säsong okt–dec) för riskgrupp och 65+ |
| Covid-19 | Säsong, för riskgrupp och 65+ |
| HPV catch-up | Upp till ~26 år (ibland äldre) |

Schedule data lives in **`mobile/src/schedules/`** as TypeScript constants (versioned), so updating the schema is a code change, not a server call.

### 4.4 Påminnelser / alerts

For each profile, the app derives an **expected schedule** by combining:
- Profile birthdate + barnvaccinationsprogrammet.
- Already-recorded entries (so a registered dose silences the reminder for that dose).
- TBE booster math: latest TBE dose → next due date.
- Stelkramp 20-year math.
- Influensa: yearly during October.

Reminder model:
- One scheduled local notification per upcoming dose.
- Default lead times: **30 dagar före**, **7 dagar före**, **på dagen**.
- Configurable per-profile (a parent of a 5-month-old wants 7d/1d; an adult wants 30d/7d).
- Notification copy in Swedish: *"Lisa fyller snart 12 mån — dags att boka MPR dos 1."*

Implemented with **`expo-notifications`** local notifications. No push server.

Reminders re-evaluate when:
- New profile created.
- Vaccination added/edited/deleted.
- App opened (re-validate against current date for any past-due).

### 4.5 Bilagor / dokument
- **`expo-image-picker`** for camera / library.
- Files saved to app's sandbox documents directory.
- Photos compressed (max 2048 px long edge) before save.
- PDFs supported as-is.
- Each entry can have N attachments.

### 4.6 Resevaccin-modul

Flow:
1. **"Ny resa"** → välj destination(er) (lista över länder, sökbar, multi-select).
2. Välj **avresedatum** och **resans längd**.
3. Välj **vilka familjemedlemmar** som reser.
4. App listar rekommenderade vacciner per person, baserat på:
   - Destinationens rekommendationer (data-driven — see 4.6.1).
   - **Personens befintliga vacciner OCH om de fortfarande är giltiga.** En registrerad Hep A från 2002 räknas som "ej giltig längre, behöver ny serie" om dos 2 saknas. En TBE-dos 4 från 2022 räknas som "giltig till 2027". Logik i 4.6.2.
   - **Time-criticality**: gula febern (≥10 dagar före), japansk encefalit (≥14 dagar före), rabies pre-exposure (3-doseserie över ~21 dagar) — flagged with "starta senast YYYY-MM-DD".
5. App schemalägger reminders för "Boka tid för X före YYYY-MM-DD" om sista-tid-att-starta är inom 90 dagar.

#### 4.6.1 Reseschema-data
- Country → vaccinrek mapping i **`mobile/src/schedules/travel.ts`**.
- Källa: Folkhälsomyndighetens reseråd + WHO IHR. ~40–60 destinationer initialt (vanliga svenska resmål: Thailand, Indonesien, Kenya, Tanzania, Sydafrika, Kuba, Brasilien, Indien, Vietnam, Kambodja, Vietnam, Filippinerna, Mexiko, Peru, Ecuador, Marocko, Egypten, Turkiet, Indien, Sri Lanka, Nepal, etc.).
- Datafält per land: bas-rekommendationer, riskbaserade rekommendationer ("vid djungelresa", "vid längre vistelse än 4 v"), gulafeber-krav (juridiskt obligatoriskt för vissa länder), malariaprofylax-flagga (bara info, inte ett vaccin).
- "Senast uppdaterad"-datum visas tydligt i UI så användaren vet att det är statisk data, inte en levande resemedicinsk databas. Disclaimer-text: *"Kontakta alltid en resemedicinsk klinik för individuell rådgivning."*

#### 4.6.2 Giltighet / "är vaccinet fortfarande aktivt?"

Kritisk modell. Varje vaccin i `mobile/src/schedules/vaccines.ts` har en `validity` deklaration. Exempel:

```ts
'HEP_A': { fullSeriesDoses: 2, validityYearsAfterFullSeries: 25 }
'HEP_B': { fullSeriesDoses: 3, validityYearsAfterFullSeries: Infinity }  // livslångt för immunkompetenta
'YELLOW_FEVER': { fullSeriesDoses: 1, validityYearsAfterFullSeries: Infinity }  // WHO 2016
'TYPHOID_INACTIVATED': { fullSeriesDoses: 1, validityYearsAfterFullSeries: 3 }
'TBE': { fullSeriesDoses: 3, boosterEveryYears: 5 }  // efter dos 3, sen dos 4 efter 3 år, sen var 5:e
'TETANUS_DIPHTHERIA': { fullSeriesDoses: 3, boosterEveryYears: 20 }
'MMR': { fullSeriesDoses: 2, validityYearsAfterFullSeries: Infinity }
'JAPANESE_ENCEPHALITIS': { fullSeriesDoses: 2, validityYearsAfterFullSeries: 1, boosterAfterFirstYearEveryYears: 10 }
'RABIES_PREEXPOSURE': { fullSeriesDoses: 3, validityYearsAfterFullSeries: 2 }  // för kontinuerlig risk
```

Pure function `isStillValid(profile, vaccineCode, today): { valid, expiresOn?, recommendation }` läser personens registrerade doser, hittar senaste, beräknar utgångsdatum. Resemodulen och vuxenrekommendationerna delar denna logik.

Detta täcker även ditt fall i hemmaland: TBE-påminnelse utlöses 3 månader före utgång. Stelkramp/difteri likadant. Hep A/B uppdateras enligt giltighetsperiod.

### 4.7 Översikt / dashboard

**Hemskärm** efter biometrisk lås:
- Familjebar med profiler horisontellt scrollbara.
- Vald profil visar:
  - **Snart**: nästa 3 förväntade vacciner med datum/ålder.
  - **Försenade**: doser som passerats utan att registrerats.
  - **Senaste**: senaste 3 registrerade.
  - **Alla** (klick → fullständig timeline).
- Färgkodning: grönt = registrerat i tid, gult = snart, rött = försenad.

**Profilvy / vaccinationskort**:
- Timeline från födelsedatum till idag + framtid.
- Kategorisering: barnvaccinationsprogrammet, riskgrupp, resevaccin, övrigt.

### 4.8 Export / dela med partner — exakt UX-flöde

Två exportlägen:

#### A) PDF-vaccinationskort
A4-dokument, en sida med profil + tabell av alla vacciner + QR-kod för snabb-import. Användning: visa på förskolan, ny vårdcentral, gränskontroll, bara för läsning. Genereras via `expo-print` (HTML → PDF).

#### B) Krypterad delning till partner — målet är "tre tryck per sida"

**Avsändarens flöde (3 tryck):**
1. Profilvy → tryck **"Dela"** → välj profiler (e.g. "Lisa" + "Erik"). *(tryck 1)*
2. App genererar `.vaccin` fil (krypterad JSON, inkl. inbäddade bilagor som base64). Lösenord auto-genereras som 6 ord (BIP39-sv).
3. Native share sheet öppnas: AirDrop / Messages / Mail / Spara i Filer. Användaren väljer kanal. *(tryck 2)*
4. Lösenordet visas separat med "kopiera" + "skicka via annan kanal"-knapp. Användaren skickar lösenordet i annat medium (säkerhetsregel: aldrig samma kanal som filen). *(tryck 3)*

**Mottagarens flöde (3 tryck):**
1. Får filen via AirDrop / Mail / Messages → tryck på filen → iOS / Android öppnar Vaccinloggen tack vare registered file association. *(tryck 1)*
2. Vaccinloggen visar **"Importera Lisa & Erik från Anna?"** + lösenordsfält. Klistra in lösenord. *(tryck 2)*
3. Tryck **"Importera"**. App skapar profilerna eller frågar "Lisa finns redan, slå ihop / behåll båda / skriv över?" *(tryck 3)*

**Even faster: QR-kodsläge för små överföringar utan bilagor:**
- Avsändare: Dela → "Visa QR" → enheten visar en pulserande QR med krypterad payload (inga foton, max ~2 KB rådata).
- Mottagare: Skanna → klistra in lösenord → importera.
- Användbart när bägge sitter på samma soffa.

**Tekniskt:**
- Krypteringsformat: AES-256-GCM, key derived via Argon2id från lösenord, salt + iv i headern. Standard nog att en bra Python/Node-biblioteksimport kan reproduceras om filformatet behöver dokumenteras.
- File extension: `.vaccin` registreras som UTI `se.vaccinloggen.vaccinfile`.
- iOS Universal Type Identifier + Android intent filter konfigureras i `app.json`.
- Inbäddade bilagor (foton, PDF:er) som base64 i samma fil. Risk: stora filer. Begränsa till total ~25 MB; över det → exportera utan bilagor och säg det.

### 4.9 "Hitta klinik" — var kan jag ta vaccinet?

Du frågade om "Find where I can take this vaccination → nearest clinics, prices, opening hours." Min bedömning: **det är ett v2-projekt**, inte MVP. Skälen:

- **Ingen enhetlig svensk klinik-API**. Privata kedjor (Apoteket Hjärtat, VaccinDirekt, Vaccin.se, Svea Vaccin, Vaccin.nu) har egna bokningssystem utan publika API:er. Vårdcentraler och BVC bokas via 1177 / regionernas egna system.
- **Pris** varierar per klinik, vaccin, ibland lager. Måste hållas uppdaterat manuellt eller skrapas — bägge sköra.
- **Öppettider** kräver per-klinik-data + uppdatering.
- Att göra det dåligt är värre än att inte göra det alls — fel pris eller stängd klinik = förlorat förtroende.

**Min v1-fallback (lågkostnadsversion, gör i M5):**
- På varje vaccin-rekommendation, knapp **"Hitta klinik"** som öppnar:
  - För barnvaccin: 1177:s vårdgivarsök (`https://www.1177.se/hitta-vard/`) med filter "BVC".
  - För vuxenvaccin / resevaccin: en URL-baserad Google Maps-sökning med användarens nuvarande plats + sökterm (`vaccinationsklinik nära mig` eller `TBE vaccin Stockholm`).
  - Vi äger inte klinikdata. Användaren ser riktiga, uppdaterade resultat. Vi får 0 ansvar för felaktig info.
- Knapp till resemedicinska kliniker per region (Karolinska resmedicin, Sahlgrenska resmedicin etc.) — fast lista, ~10 entries, stabilt.

**v2-uppgradering** (separat plan senare):
- Egen kliniklista med pris/öppettider, manuellt curated från ~50 viktigaste i Stockholm/Göteborg/Malmö.
- Booking via deeplink till klinikens egen webb (vi länkar, vi är inte mellanhand).
- Eventuellt partnerskap med en kedja för riktig API-integration. Affärsfråga, inte teknisk.

### 4.10 Säkerhet
- App-lås: **`expo-local-authentication`** (Face ID / Touch ID / Android Biometric Prompt).
- Lokalt krypterad SQLite via **`expo-sqlite`** + **`react-native-mmkv`** för key-value (snabba pref).
- Bilagor i app sandbox documents dir (ej iCloud/Google Drive auto-backup som default; opt-in i settings).
- Backups: användaren ansvarar — vi erbjuder export-knappen.

## 5. Datamodell (SQLite)

```sql
profiles (
  id TEXT PRIMARY KEY,         -- uuid
  name TEXT NOT NULL,
  birthdate DATE NOT NULL,
  sex TEXT,                    -- 'F' / 'M' / 'X' / null (för HPV-default; valfritt)
  risk_groups TEXT,            -- JSON array: ['gravid', 'astma', ...]
  avatar_path TEXT,            -- relative path i sandbox
  created_at TIMESTAMP,
  reminder_lead_days TEXT      -- JSON array: [30, 7, 0]
)

vaccinations (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vaccine_code TEXT NOT NULL,  -- canonical code: 'MPR', 'TBE', 'DTP_IPV_HIB_HEPB', ...
  vaccine_label TEXT,          -- display override / fri text
  brand TEXT,                  -- 'Pentavac', 'Boostrix', ...
  dose_number INTEGER,         -- 1, 2, 3, NULL för booster med okänt nr
  date DATE NOT NULL,
  provider TEXT,               -- 'BVC Solna' eller fri text
  batch TEXT,
  notes TEXT,
  source TEXT,                 -- 'manual' | 'imported'
  created_at TIMESTAMP
)

attachments (
  id TEXT PRIMARY KEY,
  vaccination_id TEXT NOT NULL REFERENCES vaccinations(id) ON DELETE CASCADE,
  kind TEXT,                   -- 'photo' | 'pdf' | 'receipt'
  path TEXT NOT NULL,          -- relative path i sandbox
  created_at TIMESTAMP
)

trips (
  id TEXT PRIMARY KEY,
  destinations TEXT NOT NULL,  -- JSON array: ['TH', 'KH']
  depart_date DATE NOT NULL,
  return_date DATE,
  profile_ids TEXT NOT NULL,   -- JSON array
  notes TEXT,
  created_at TIMESTAMP
)

reminders (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vaccine_code TEXT NOT NULL,
  due_date DATE NOT NULL,
  reason TEXT,                 -- 'barnprogram' | 'tbe-booster' | 'travel:TH' | 'flu-season'
  notification_id TEXT,        -- expo-notifications scheduled id
  dismissed_at TIMESTAMP
)
```

## 5b. Schema-data: hur vi håller dem aktuella

Två problem att lösa:
- **A) Hur upptäcker vi att Folkhälsomyndigheten ändrat något?** — det är 90% av jobbet.
- **B) Hur når den nya datan användarens app utan App Store-release?** — det är de andra 10%.

### Del A: Auto-detection av officiella ändringar

Helt automatisk översättning från Folkhälsomyndighetens text → vår JSON-modell är *inte* tillförlitligt — schemaläggningstext är full av nyanser ("vid förhöjd risk", "kan tidigareläggas"). Människa-i-loopen är obligatoriskt. Men vi kan automatisera **upptäckten** av ändringar:

**GitHub Action som körs dagligen:**

```yaml
# .github/workflows/check-schedule-changes.yml
on:
  schedule:
    - cron: '0 7 * * *'  # 07:00 UTC dagligen
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm tsx scripts/check-source-changes.ts
```

`check-source-changes.ts` gör:

1. Hämtar URL:er från `sources.json`:
   ```
   https://www.folkhalsomyndigheten.se/.../barnvaccinationsprogram/  (HTML)
   https://www.folkhalsomyndigheten.se/.../tidigare-vaccinationsprogram/
   https://www.folkhalsomyndigheten.se/.../tbe/
   https://www.folkhalsomyndigheten.se/.../influensa/
   https://www.rikshandboken-bhv.se/vaccination/vaccinationsprogrammet-for-barn/
   https://www.1177.se/.../vaccinationsprogrammet-for-barn/
   https://www.1177.se/.../resevaccinationer/
   https://www.who.int/teams/immunization-vaccines-and-biologicals/diseases/yellow-fever/  (för IHR-krav)
   ```
2. Hashar varje sidas innehåll (efter att ha strippat boilerplate via cheerio/readability).
3. Jämför mot förra dagens hash sparad i `data/source-hashes.json`.
4. Om en sida ändrats → öppnar GitHub Issue automatiskt: *"Folkhälsomyndighetens TBE-sida har ändrats — granska + uppdatera `schedules/adult-recommendations.ts` om relevant"*.
5. Issue inkluderar `git diff`-stil av textändringen för snabb mänsklig review.
6. Hash-filen committas tillbaka som "no change detected" / "source X changed".

**Fördelar:**
- 0 kostnad (GitHub Actions gratis tier räcker långt).
- 0 GDPR (vi crawlar publika webbplatser).
- Ingen falsk självsäkerhet att en LLM "fixar det åt oss" — människan godkänner alla ändringar.
- Notification-spam minimeras (en issue per ändrad sida, inte per ord).

**Backup för missade saker:** Vi prenumererar på Folkhälsomyndighetens RSS / nyhetsbrev manuellt. Och vi kollar [Janusinfo](https://janusinfo.se/) som ofta har snabbare expertkommentar på ändringar.

### Del B: Push uppdateringen till alla användares appar

**Bundled fallback + remote refresh — bästa av två världar.**

1. **Bundled defaults**: Alla scheman bakade in i appens `mobile/src/schedules/*.ts` vid build-time. Appen funkar offline från dag ett.
2. **Remote refresh**: Vid app-start (max 1×/dag), försök hämta `https://vaccinloggen.se/schedules/v1.json` (statisk fil på Cloudflare Pages eller motsvarande gratis CDN). Filen är versionerad — om appens bundled-version är `2026-01-15` och remote säger `2026-04-12`, ladda ner och cacha lokalt. Använd cachad version före bundled.
3. **Inget GDPR-problem** — filen innehåller bara publik medicinsk schemaläggningsdata. Ingen personlig data lämnar enheten. Cloudflare's access logs är ingen personlig data om vi inte loggar IP:er, vilket vi inte gör.
4. **Källan är ett GitHub-repo** som vi (jag, du) underhåller. Pull request → merge → CI publicerar JSON till CDN. Tar ~10 min att uppdatera när Folkhälsomyndigheten ändrar.
5. **UI signal**: I Settings → "Scheman uppdaterade: 2026-04-12 (Folkhälsomyndigheten)" + listpost för senaste ändringar. Bygg in tillit.
6. **Säkerhet**: Signera filen med en SHA-256 av innehållet + en signaturfil (`v1.json.sig`) genererad med en privat nyckel vi äger. Appen verifierar signaturen mot en hardcoded public key. Då kan ingen mellanman injicera dålig data ens om CDN:en eller DNS är komprometterat.

Det gör underhåll till en pull-request, inte en App Store-release. App Store-releases reserveras för UI/feature-ändringar och buggfixar.

## 6. Designsystem

Du sa "we should make it very nice and unified across the app". Helt med. Min approach:

### 6.1 Designtokens i kod
En enda fil **`mobile/src/theme/tokens.ts`** är källan för:
- **Färger**: Primary, accent, surface, text, success/warning/error, plus 5 semantiska gradationer av varje (50/100/300/500/700).
- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (rytm).
- **Typografi**: skalor (display / h1 / h2 / body / caption) → font-size, line-height, weight.
- **Radii**: 0 / 8 / 12 / 16 / 24 / pill.
- **Shadows**: sm / md / lg.

### 6.2 Färgpalett-förslag (känsla: medicinsk lugn + svenskt vaccinationskort)
- **Primary**: dämpad teal #0E7C7B — lugn, vårdkänsla, sticker ut från 1177:s blå.
- **Accent**: gulkortgul #F4D35E — referens till pappersvaccinationskortets gula färg.
- **Background**: nästan-vit #FAFAF7 (varmare än rent vit).
- **Surface (cards)**: #FFFFFF.
- **Text primary**: #0F1B1A (nästan svart med teal-undertone).
- **Success**: #2D7A4F (registrerade doser).
- **Warning**: #C77700 (snart förfallen).
- **Error**: #B43E3E (försenad).

Två varianter: ljus + mörk. Tokens har samma namn, olika värden i `tokens.dark.ts`.

### 6.3 Typografi
- **System default**: SF Pro (iOS) / Roboto (Android) — gratis, native, snabb. Ingen webbfont att vänta på.
- Alt: Inter via `expo-font` om vi vill ha enhetlig typografi cross-platform. Lite mer bundle, ~80 KB.
- **Rekommendation**: starta med system. Byt om varumärket behöver det.

### 6.4 Komponentbibliotek-val
- **Inte** ett tungt UI-kit (Tamagui är fint men overkill för ~10 skärmar).
- **Eget thin layer**: ~12 base-komponenter (`Button`, `Card`, `Input`, `Select`, `DatePicker`, `Tabs`, `Avatar`, `EmptyState`, `Toast`, `Sheet`, `ListItem`, `Header`) i `mobile/src/components/`. Alla läser från `tokens.ts`.
- **Ikoner**: Lucide React Native (`lucide-react-native`) — ren, modern, gratis, ~1 000 ikoner.
- **Animationer**: `react-native-reanimated` (redan i Expo SDK 54) för subtila transitioner. Ingen extra-app-jänk.

### 6.5 Inspirationsreferenser jag skulle titta på innan vi designar
- **Apple Health** (sektionsnavigation, kalkort, timeline).
- **Babylon Health** (pre-2023, ren medicinsk look).
- **1177 vårdguiden-app** (svenskhet, men gör motsatsen där den är trög).
- **Withings Health Mate** (mätvärden över tid → vacciner över tid är samma form).
- **Notion / Linear** (informationstäthet, men inte medicinsk).

### 6.6 Designkonkretion: var vi börjar
Innan kod på allvar i M2: **Figma-skiss** av 5 nyckelskärmar.
1. Hemskärm med familjebar.
2. Profilvy / vaccinationskort.
3. Lägg till vaccination-formulär.
4. Resa-flöde.
5. Settings + dela.

Det är ~1 dags Figma-arbete och sparar oss veckor av redesign mid-flight. Ny milestone **M0** läggs till nedan.

## 7. UI / E2E-tester och prestanda

Du frågade om automatiserade tester som klickar i appen. Ja, vi ska ha det — men minimalistiskt.

### 7.1 Enhetstester (Jest)
**Obligatoriskt.** Alla schedule- och giltighetslogik:
- `derive.test.ts` — barnvaccin-åldrar för alla födelsedatum-kanter.
- `validity.test.ts` — TBE / Hep A / dT giltighetsberäkningar.
- `travel.test.ts` — top-10 destinationer, gulafeber-krav, dubbel-destinationer.
- `export-import.test.ts` — round-trip av krypterad fil.

Korrekthet i logiken är hela appens värde. Detta tar lite tid men är inte förhandlingsbart.

### 7.2 E2E / UI-tester (Maestro)
**Lågt men icke-noll.** Maestro (`maestro.dev`) är YAML-baserat och funkar ypperligt för Expo. Inga JS-runtime-paket att installera, kör mot iOS-simulator eller Android-emulator.

Initialt suite: **5 kritiska flöden**, ca 100 rader YAML totalt.
1. `01-onboarding.yaml` — första-gångs-bootstrap, biometric setup, första profil.
2. `02-add-vaccination.yaml` — lägg till en vaccination, verifiera att den syns i timeline.
3. `03-reminder-flow.yaml` — sätt klocka, trigga reminder, registrera dosen, reminder försvinner.
4. `04-export-import.yaml` — exportera, simulera mottagare, importera, verifiera identisk data.
5. `05-travel.yaml` — skapa resa till Thailand, verifiera vaccinrekommendationer.

Körs i CI (GitHub Actions) på varje PR. Tar ~3 min per körning.

### 7.3 Prestanda
För MVP räcker manuell smoke-test på en riktig fysisk enhet (iPhone 12 eller äldre + Android mellanklass-enhet). Kontroller:
- App-start under 2 sek från cold launch.
- Lägg-till-vaccination-flöde under 200ms reaktionstid mellan tryck.
- Timeline-render med 100 entries utan jank (60fps mätt manuellt).

Verktyg om vi behöver djupare:
- React DevTools Profiler för render-tid.
- Flashlight (`flashlight.dev`) — automatisk performance scoring för RN-appar.
- Sentry Performance i prod (gratis tier, lokalt-ingen-data-skickas-policy konfigurerad).

I MVP: bara Jest + Maestro + manuell smoke. Ingen Sentry än (vi har ingen användarbas att övervaka).

## 8. Tech stack

Mirroring GripAge where possible to reuse muscle memory:

- **Mobile**: Expo SDK 54 + TypeScript, Expo Router for navigation.
- **DB**: `expo-sqlite` (no Postgres, no Docker).
- **State**: TanStack Query for derived/queryable views; Zustand for app state.
- **UI**: React Native + a Swedish-friendly date picker (`@react-native-community/datetimepicker`), `dayjs` med svensk locale.
- **Notifications**: `expo-notifications` (local only).
- **Auth**: `expo-local-authentication`.
- **Files**: `expo-image-picker`, `expo-file-system`, `expo-document-picker`.
- **PDF export**: `expo-print` (HTML → PDF).
- **Crypto**: `expo-crypto` + `tweetnacl` for export encryption.
- **Testing**: Jest for schedule logic (critical to test thoroughly).

**No backend.** No FastAPI, no Postgres, no Docker. This is a pure local app.

## 9. Project layout

```
vaccinloggen/
├── mobile/
│   ├── app/                       # Expo Router screens
│   │   ├── _layout.tsx
│   │   ├── (auth)/lock.tsx        # biometric gate
│   │   ├── index.tsx              # home / family dashboard
│   │   ├── profile/[id].tsx       # profil-vy / vaccinationskort
│   │   ├── vaccination/new.tsx
│   │   ├── vaccination/[id].tsx
│   │   ├── trip/new.tsx
│   │   ├── trip/[id].tsx
│   │   └── settings.tsx
│   ├── src/
│   │   ├── db/                    # SQLite schema + migrations
│   │   ├── schedules/             # built-in svenska scheman
│   │   │   ├── child-program.ts
│   │   │   ├── adult-recommendations.ts
│   │   │   ├── vaccines.ts        # canonical vaccine codes + validity rules
│   │   │   ├── travel.ts
│   │   │   └── remote-refresh.ts  # CDN check + cache
│   │   ├── reminders/             # derive expected schedule, schedule notifs
│   │   │   ├── derive.ts
│   │   │   ├── validity.ts        # isStillValid()
│   │   │   └── schedule.ts        # expo-notifications wrapper
│   │   ├── export/                # PDF + encrypted JSON + QR
│   │   ├── theme/tokens.ts        # designtokens
│   │   ├── components/            # Button, Card, Input, ...
│   │   └── i18n/sv.ts             # Swedish strings
│   ├── .maestro/                  # E2E flows
│   └── tests/                     # Jest unit tests
│   └── package.json
└── README.md
```

## 10. Implementation milestones

| # | Milestone | What's working at the end | Estimated effort |
|---|---|---|---|
| **M0** | Designtokens + Figma-skiss | `tokens.ts` definierad, 5 nyckelskärmar designade i Figma, base-komponenter (`Button`, `Card`, etc.) byggda | 1–2 dagar |
| **M1** | Skelett + profiler | Expo iOS + Android startar, biometriskt lås, kan skapa/redigera profiler, persistera i SQLite | 1–2 dagar |
| **M2** | Vaccinationer manuell | Kan registrera, redigera, ta bort vaccinationer per profil. Lista visas i timeline | 1–2 dagar |
| **M3** | Bilagor | Kamera + bibliotek + PDF-bilagor på vaccinationer. Bilder komprimeras | 1 dag |
| **M4** | Svenska scheman + giltighetslogik + reminders | Barnvaccin + vuxen + giltighetsberäkningar. Reminders schemaläggs och triggas. Remote schedule-refresh från CDN. | 3 dagar |
| **M5** | Resevaccin + "Hitta klinik"-länkar | Skapa resa, se rekommenderade vacciner per profil med giltighetscheck, time-critical reminders, länk till 1177/Maps | 2 dagar |
| **M6** | Export / partner-delning | PDF-vaccinationskort, krypterad `.vaccin`-fil, file-association, QR-läge | 2 dagar |
| **M7** | E2E-tester + polish | Maestro-suite, svensk copy-pass, ikon, splash, App Store / Play Store-metadata, TestFlight + Internal Testing | 2 dagar |

Total: ~13–16 dagar fokuserat arbete för en testbar TestFlight / Internal Testing-build.

## 11. Critical files to be created

- `mobile/src/schedules/child-program.ts` — barnvaccinationsprogrammet, exact ages and doses (testet är trivialt; korrektheten är allt).
- `mobile/src/schedules/adult-recommendations.ts` — TBE, dT, influensa, covid.
- `mobile/src/schedules/travel.ts` — country → vaccine list (start with top 30 svenska resmål).
- `mobile/src/reminders/derive.ts` — pure function: `(profile, allVaccinations, today) → ExpectedDose[]`. Heavily tested.
- `mobile/src/reminders/schedule.ts` — wraps `expo-notifications`, idempotent.
- `mobile/src/db/migrations/001_init.sql` — initial schema.
- `mobile/src/export/pdf.ts` — HTML template → `expo-print`.
- `mobile/src/export/encrypted.ts` — JSON dump → AES-256-GCM with password-derived key.
- `mobile/src/i18n/sv.ts` — alla strängar.

## 12. Defaults I'm proposing (correct me if any are wrong)

- **App-namn**: `Vaccinloggen` (kort, tydligt, .se-domänen verkar ledig — men kontrollera).
- **App-färg**: lugn medicinsk grön + mjuk gul (gulkortsreferens).
- **Reminder-leads default**: 30 dagar / 7 dagar / på dagen — kan ändras per profil.
- **Influensa-säsong**: notifiera 1 oktober varje år för 65+ och riskgrupp.
- **Adult schema scope**: Inkluderat i MVP. Det är ~5 entries i en TypeScript-fil och låser upp värde för dig själv direkt.
- **OCR**: skjuts till v2. Grattis till färre buggar i v1.
- **Receipts/kvitton**: stöds som bilagor till en vaccination (bra för reseförsäkring och eventuellt avdrag, men vi löser inte bokföring).
- **Disclaimer**: en kort skärm vid första start: *"Vaccinloggen ersätter inte vårdpersonal. Kontakta alltid din vårdcentral eller en resemedicinsk mottagning för medicinsk rådgivning."*

## 13. Öppna produktbeslut

Beslut låsta så här långt: namn = **Vaccinloggen**, intäktsmodell = gratis i v1 + klinik-affiliate i v1.5, plattform = iOS+Android via Expo, lokal-only, biometriskt lås.

Kvar att besluta:

1. **"Föreslå nästa dos när du registrerar dos N"** — när du registrerar TBE dos 2 → app föreslår dos 3 om 5–12 mån och förbereder reminder. Mitt förslag: ja, ha med. Värdet är hela poängen.
2. **Riskgrupp-flaggor på profil** — vilken lista? Mitt förslag: *gravid, immunosupprimerad, kronisk lung-/hjärtsjukdom, hjärtsjukdom, diabetes, 65+, vårdpersonal, regelbunden utomhusvistelse i TBE-zon*. Påverkar influensa-, covid-, TBE-rekommendationer.
3. **Bilagor — sparplats default** — bara sandbox (försvinner vid app-radering) eller iCloud/Drive auto-backup som default? Mitt förslag: **bara sandbox** som default, opt-in toggle i settings för iCloud/Drive backup.
4. **Designsystemet — primärfärg** — teal (#0E7C7B), dämpad blå (#3A6FBF) à la 1177, eller något annat? Vi kan göra Figma-skiss i M0 och provkänna.
5. **Stäng-av-reminder-möjlighet** — ska användaren kunna säga "vi vaccinerar inte enligt programmet, stäng av påminnelser för Lisa"? Mitt förslag: per-profil setting "Visa påminnelser från barnvaccinationsprogrammet" toggle. Ja absolut.
6. **Domän- och varumärkescheck** — boka tid för PRV-koll på "Vaccinloggen" och `.se`-registrering innan App Store-listning. Inte tekniskt arbete, men måste hända före M7.

## 14. Affärsmodell — gratis app, klinik-samarbeten som intäktsväg

Du sa: "gratis, ingen donations-knapp, men kanske annonser eller samarbete med vaccinationsplatser genom att föreslå dem — är det möjligt?" Mitt svar: **klinik-samarbete ja, traditionella annonser nej.** Här är varför + plan.

### Driftskostnader (låga)
- Apple Developer Program: ~99 USD/år.
- Google Play Console: 25 USD engångsavgift.
- Cloudflare Pages för schedule-CDN: gratis under 100 GB/mån.
- Domän `vaccinloggen.se`: ~150 kr/år.
- Ingen backend, ingen DB. **Total: ~1 200 kr/år.**

Du kan absorbera detta som hobbykostnad medan vi söker första intäkt.

### Varför inte traditionella annonser
- **Apple App Store rules** för Medical-kategorin: appar med slumpmässiga banderoll-annonser (AdMob-typ) får ofta avslag, särskilt om annonserna inte är medicinskt-screenade. Risk för läkemedelsannonser, kosttillskott, "naturmedel mot covid", farliga aktörer — du måste manuellt filtrera, vilket är dyrare än intäkten.
- **Användarupplevelse**: en medicinsk app med banderoller känns billig och otrovärdig. Recensioner blir 2-stjärniga.
- **GDPR / e-Privacy**: ad-nätverk vill ha tracking-IDs. Det river vår "lokal-först, ingen tracking"-pitch.
- **Sammanfattning**: ❌ Inte värt det.

### Det som FUNKAR: klinik-samarbeten ("Hitta klinik" som intäktskanal)

Detta är samma sak som "Hitta klinik"-funktionen i §4.9 — men strukturerat som intäktsmodell. Tre upplägg, från lättast till svårast:

#### A) Affiliate / cost-per-acquisition (CPA)
- "Hitta klinik"-knappen visar en lista över kliniker som tar det aktuella vaccinet.
- För kliniker vi har avtal med: knappen "Boka direkt" deeplink:ar till deras bokningssida med en sporträcknings-parameter (`?utm_source=vaccinloggen`).
- Klinik betalar **~50–150 kr per genomförd bokning** (justeras efter vaccintyp — TBE-bokning högre marginal än influensa).
- Övriga kliniker (utan avtal) visas också men utan "Boka direkt" — bara "Hitta hit" till Maps. Vi behåller editorial integritet.

**Tekniskt**:
- En statisk JSON-fil i samma CDN som scheman: `clinics.json`. Innehåller klinik-namn, adress, vacciner-erbjudna, affiliate-länk eller null.
- Filen uppdateras manuellt när nya avtal tecknas.
- Ingen tracking-pixel, inga cookies — bara länken är spårningsbar.

**Disclosure (lagligt krav)**:
- Marknadsföringslagen + ICC-koden kräver att kommersiellt innehåll markeras. Visa **"Samarbetspartner"** som badge bredvid kliniker med avtal.
- App-tutorial: "Vi får ersättning när du bokar via partnerkliniker. Vi rekommenderar bara vacciner som Folkhälsomyndigheten eller WHO rekommenderar — affiliate-fee påverkar inte vilket vaccin som föreslås."

#### B) Sponsrade plats-listningar
- Premium-listplats "Toppen av Hitta klinik-listan" mot fast månadsavgift (säg 1 000 kr/mån per plats per stad).
- Måste fortfarande vara relevanta (rätt vaccin, rätt geografi). Tydligt märkt "Sponsrad".
- Mer förutsägbar intäkt än CPA, men kräver fler aktiva avtal.

#### C) "Powered by Vaccinloggen" white-label för kliniker
- Senare-fas: stora klinikkedjor (Apoteket Hjärtat, Vaccin.nu) får en white-label version av appen för deras kunder.
- B2B-licens, ~50 000–200 000 kr/år.
- Inte relevant förrän vi har bevisat trafik.

### Genomförande och tidsplan

- **MVP (v1)**: Bygg "Hitta klinik" enligt §4.9 (länkar till 1177 + Maps). Inga affiliate-länkar än. **0 monetisering, 0 ads.**
- **v1.5** (~3–6 mån efter launch om traction kommer): Lägg till klinik-database (`clinics.json`), affiliate-länkar, "Samarbetspartner"-badge. Påbörja partneravtals-arbete med 2–3 första kedjor. Lättast att börja med **Vaccin.nu** (de driver MittVaccin Sverige AB:s konsumentapp så de förstår modellen) eller **Apoteket Hjärtat** (mest geografisk täckning).
- **v2**: Sponsrade listplatser, eventuell B2B.

### Det vi ALDRIG gör
- ❌ Banner-annonser via AdMob/Meta/etc.
- ❌ Sponsrade *vaccin-rekommendationer* — "Vi rekommenderar Pfizer-vaccin denna säsong" är otänkbart. Vaccinrekommendationer baseras *bara* på Folkhälsomyndigheten/WHO. Affiliate-relationer är till *kliniker*, aldrig till *läkemedelstillverkare*.
- ❌ Sälja användardata. Vi har ingen — det är feature, inte misstag.
- ❌ Prenumeration på grundfunktioner. Det är hela vår differentiator mot MittVaccin (39 kr/år).

### Sammanfattning
Plan: **gratis app i v1, klinik-affiliate i v1.5 om vi vill skapa intäkt, ingen ads-väg någonsin.** Klinik-samarbete är hederligt och alignerat — användaren behöver hitta en klinik, vi pekar dem rätt, kliniken får kund, vi får fee. Alla vinner. Och det krockar inte med medicinsk integritet så länge vacciinrekommendationerna är oberoende av affiliate-relationerna.

## 15. Verification plan (end-to-end)

När M1–M7 är klara, så här testar vi:

1. **Profil + barnvaccin**: Skapa "Test-Lisa, född 2025-11-01". Verifiera att appen genererar förväntade doser för 6 v, 3 mån, 5 mån, 12 mån, 5 år, åk 1–2, åk 5, åk 8–9. Datum ska matcha barnvaccinationsprogrammet.
2. **Reminder**: Sätt enheten till 2026-04-01 (test-klocka). Verifiera notifiering "Lisa fyller snart 5 mån — dags för dos 2".
3. **Registrera + tysta påminnelse**: Registrera DTP-IPV-Hib-HepB dos 2 på 2026-04-15. Verifiera att 5-mån-påminnelsen försvinner ur "Snart" och dyker upp i "Senaste".
4. **Bilaga**: Lägg till foto + PDF-kvitto. Verifiera att de visas, kan öppnas, kan tas bort.
5. **TBE-logik**: Registrera TBE dos 1 idag, dos 2 om 1 mån, dos 3 om 6 mån. Verifiera att app schemalägger dos 4 till idag + 3 år.
6. **Giltighetslogik**: Registrera Hep A dos 1 år 2002 (utan dos 2). Skapa resa till Indien. App ska visa "Hep A: ej giltig längre, behöver ny serie", inte "Hep A: redan har ✓".
7. **Resa**: Skapa resa till Thailand om 2 mån. Verifiera att app föreslår Hep A, tyfoid, JE (vid längre vistelse). Att gula febern INTE flaggas (krävs ej för Thailand).
8. **Export PDF**: Exportera PDF för Lisa. Verifiera att PDF:en innehåller alla doser, läsbar, A4.
9. **Partner-delning fil**: Exportera `.vaccin`-fil med lösenord, importera på partners enhet — verifiera identisk data inkl. bilagor.
10. **Partner-delning QR**: Visa QR från enhet A, skanna från enhet B (utan bilagor). Verifiera identisk profil + entries.
11. **Schedule remote refresh**: Publicera ny version av `v1.json` på CDN med datumet bumped. Starta om appen. Verifiera att Settings → "Scheman uppdaterade" visar nytt datum.
12. **Hitta klinik**: Tryck "Hitta klinik" på en BVC-rekommendation → 1177 öppnas. Tryck på en TBE-rekommendation → Maps öppnas med rätt sökterm.
13. **Biometriskt lås**: Stäng app, öppna igen → Face ID krävs.
14. **Båda plattformar**: Repetera 1–13 på iOS-simulator OCH Android-emulator.
15. **App-store-readiness**: Kör `eas build` för iOS (TestFlight) och Android (Internal Testing).

Tester (Jest) som är obligatoriska:
- `derive.test.ts` — alla barnvaccin-åldrar, alla TBE-paths, alla edge cases (barn fött i framtiden, barn äldre än 18 år, dos registrerad innan förväntat datum, dos registrerad efter, ingen födelsedata, etc.).
- `validity.test.ts` — Hep A 25 år, TBE 5 år efter dos 4, dT 20 år, MMR livstid, edge case "dos registrerad utan datum" → graceful failure.
- `travel.test.ts` — top-10 destinationer, gula febern-krav, dubbla destinationer.
- `export-import.test.ts` — round-trip krypterad fil + QR-payload.
