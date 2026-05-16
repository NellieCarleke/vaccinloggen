// All Swedish UI copy lives here. Components/screens read via t().
// Keep keys hierarchical and stable — they will map to remote-loaded copy later.

export const sv = {
  app: {
    name: "Vaccinloggen",
    tagline: "Håll koll på familjens vaccinationer",
  },
  settings: {
    title: "Inställningar",
    sectionAbout: "Om Vaccinloggen",
    aboutVersion: "Version",
    aboutScheduleData: "Schema-data uppdaterad",
    aboutSource: "Källor",
    aboutSourcesText:
      "Barnvaccinationsprogrammet, vuxenrekommendationer och resevaccin är hämtade från Folkhälsomyndigheten, 1177 och WHO.",
    sectionPrivacy: "Integritet",
    privacyBody:
      "All data sparas lokalt på den här enheten. Vaccinloggen skickar inga uppgifter till någon server. Du kan när som helst exportera eller radera datan.",
    sectionData: "Data",
    dataImport: "Importera från fil",
    dataImportHint: "Läs in en .vaccin-fil från en partners delning.",
    sectionLegal: "Juridik",
    legalDisclaimer: "Medicinsk friskrivning",
    legalDisclaimerBody:
      "Vaccinloggen ersätter inte vårdpersonal eller officiell vaccinationsjournal. Kontakta alltid din vårdcentral, BVC eller en resemedicinsk mottagning för medicinsk rådgivning.",
  },
  lock: {
    title: "Vaccinloggen",
    subtitle: "Lås upp för att se dina vaccinationer",
    unlockButton: "Lås upp",
    unlockReason: "Lås upp Vaccinloggen",
    biometricUnavailable:
      "Biometriskt lås är inte tillgängligt på den här enheten.",
    enterAnyway: "Fortsätt utan lås",
  },
  home: {
    title: "Vaccinloggen",
    subtitle: "Familjeöversikt",
    addProfile: "Lägg till familjemedlem",
    welcomeTitle: "Välkommen!",
    welcomeBody:
      "Skapa en profil för dig själv eller någon i familjen för att börja hålla koll på vaccinationer.",
    welcomeAction: "Skapa första profil",
    sectionFamily: "Familj",
    sectionUpcoming: "Snart",
    sectionOverdue: "Försenade",
    sectionRecent: "Senaste vaccinationer",
    sectionAll: "Alla vaccinationer",
    noUpcoming: "Inga kommande vaccinationer just nu.",
    noVaccinations: "Inga registrerade vaccinationer än.",
    familyEmpty: "Inga profiler än. Tryck nedan för att skapa den första.",
    statusUpToDate: "Allt uppdaterat",
    statusOverdue: "{n} försenad",
    statusOverduePlural: "{n} försenade",
    statusSoon: "{n} snart",
    statusUpcoming: "{n} kommande",
    statusFew: "Inga registrerade än",
  },
  history: {
    title: "Vaccinationshistorik",
    subtitle:
      "Har {name} följt det svenska barnvaccinationsprogrammet hittills?",
    body:
      "Programmet har ändrats över tid. Vi skapar bara poster för doser som ingick i programmet när du/barnet var i rätt ålder. Doser som lagts till senare (t.ex. pneumokock 2009, rotavirus 2019, HPV 2012) skapas inte — om de är aktuella för dig idag dyker de upp som rekommendationer senare.",
    optionFullTitle: "Ja, fullständigt",
    optionFullBody:
      "Skapa poster för alla åldermässiga doser. Datum sätts till BVC-rekommenderad ålder.",
    optionPartialTitle: "Vissa doser — jag fyller i manuellt",
    optionPartialBody:
      "Skapa inga poster automatiskt. Jag lägger till de doser jag minns själv.",
    optionUnknownTitle: "Nej eller vet ej",
    optionUnknownBody:
      "Skapa inga poster. Påminnelser kan kännas oprecisa till dess att jag fyller i.",
    bulkResult: "{n} doser tillagda.",
    bulkResultZero: "Inga åldermässiga doser att lägga till.",
    skipButton: "Hoppa över för nu",
    selfReportedBadge: "Uppgivet",
  },
  profile: {
    create: "Ny profil",
    edit: "Redigera profil",
    save: "Spara",
    cancel: "Avbryt",
    delete: "Ta bort",
    deleteConfirm: "Är du säker? Alla vaccinationer för profilen försvinner.",
    fieldName: "Namn",
    fieldNamePlaceholder: "T.ex. Lisa",
    fieldBirthdate: "Födelsedatum",
    fieldSex: "Kön",
    fieldSexFemale: "Flicka / kvinna",
    fieldSexMale: "Pojke / man",
    fieldSexOther: "Annat / inte ange",
    fieldRiskGroups: "Riskgrupp",
    fieldRiskGroupsHelp:
      "Påverkar rekommendationer för influensa, covid och TBE.",
    riskPregnant: "Gravid",
    riskImmunoSuppressed: "Immunosupprimerad",
    riskChronicLung: "Kronisk lungsjukdom",
    riskHeartDisease: "Hjärtsjukdom",
    riskDiabetes: "Diabetes",
    riskAge65Plus: "65 år eller äldre",
    riskHealthcareWorker: "Vårdpersonal",
    riskTbeZone: "Vistas regelbundet i TBE-område",
    saved: "Sparad.",
    fieldReminders: "Påminnelser",
    fieldRemindersHelp:
      "Visa förväntade doser från barnvaccinationsprogrammet och vuxenrekommendationer. Stäng av om profilen inte följer programmet.",
    fieldRemindersOn: "Påminnelser på",
    fieldRemindersOff: "Påminnelser av",
  },
  validation: {
    required: "Obligatoriskt fält.",
    nameTooShort: "Namnet måste vara minst 1 tecken.",
    invalidDate: "Ogiltigt datum.",
    futureDate: "Födelsedatum kan inte vara i framtiden.",
    futureDose: "Datum för dos kan inte vara i framtiden.",
    invalidDose: "Dosnummer måste vara minst 1.",
  },
  vaccination: {
    create: "Ny vaccination",
    edit: "Redigera vaccination",
    addCta: "Lägg till vaccination",
    fieldVaccine: "Vaccin",
    fieldVaccinePlaceholder: "Välj vaccin",
    fieldBrand: "Fabrikat / handelsnamn",
    fieldBrandPlaceholder: "T.ex. Boostrix",
    fieldDate: "Datum för dos",
    fieldDose: "Dosnummer (valfritt)",
    fieldDosePlaceholder: "Lämna tomt om okänt",
    fieldBrandOptional: "Fabrikat / handelsnamn (valfritt)",
    fieldProvider: "Vårdgivare / plats (valfritt)",
    fieldProviderPlaceholder: "T.ex. BVC Solna",
    fieldBatch: "Batchnummer / LOT (valfritt)",
    fieldBatchPlaceholder: "T.ex. 1A45B6",
    fieldBatchHelp:
      "Står på vaccinets förpackning eller kvitto. Underlättar vid eventuell biverkningsrapport.",
    fieldNotes: "Anteckningar (valfritt)",
    fieldNotesPlaceholder: "Biverkningar, planerad nästa dos, …",
    sectionRequired: "Obligatoriskt",
    sectionOptional: "Valfritt",
    sectionAttachments: "Bilagor (valfritt)",
    attachmentsHint: "Foto av kvitto, vaccinationskort eller intyg.",
    fieldVaccineFreeText: "Skriv in vaccinets namn",
    deleteConfirmTitle: "Ta bort vaccination?",
    deleteConfirmBody: "Den här posten kan inte återställas.",
    selectSearchPlaceholder: "Sök vaccin eller sjukdom",
    sectionChild: "Barnvaccin",
    sectionAdult: "Vuxen / riskgrupp",
    sectionTravel: "Resevaccin",
    sectionOther: "Övrigt",
    timelineEmpty: "Inga registrerade vaccinationer än.",
    timelineEmptyHint:
      "Tryck på \"Lägg till vaccination\" för att börja registrera.",
    doseLabel: "Dos {n}",
  },
  attachment: {
    sectionTitle: "Bilagor",
    addCta: "Lägg till bilaga",
    pickCamera: "Ta foto med kameran",
    pickLibrary: "Välj från bibliotek",
    pickDocument: "Välj PDF / dokument",
    cancelPicker: "Avbryt",
    empty: "Inga bilagor.",
    emptyHint:
      "Lägg till foto av vaccinationskort, kvitto eller intyg.",
    deleteConfirmTitle: "Ta bort bilaga?",
    deleteConfirmBody: "Filen kan inte återställas.",
    delete: "Ta bort",
    open: "Öppna",
    permissionDeniedCamera:
      "Vaccinloggen behöver kamera-tillstånd. Aktivera i Inställningar.",
    permissionDeniedLibrary:
      "Vaccinloggen behöver bibliotek-tillstånd. Aktivera i Inställningar.",
    saveFailed: "Kunde inte spara filen.",
    photo: "Foto",
    pdf: "PDF",
    receipt: "Kvitto",
  },
  share: {
    title: "Dela",
    pdfTitle: "Exportera som PDF",
    pdfBody: "Snyggt format för förskolan, ny vårdcentral eller resa.",
    encryptedTitle: "Dela krypterat med partner",
    encryptedBody:
      "Skickar en .vaccin-fil + lösenord. Mottagaren importerar i sin egen Vaccinloggen.",
    encryptedPasswordLabel: "Lösenord",
    encryptedPasswordHint:
      "Skicka filen och lösenordet via olika kanaler (t.ex. fil via AirDrop, lösenord via SMS).",
    encryptedRegenerate: "Generera nytt lösenord",
    encryptedShareNow: "Skapa fil och dela",
    encryptedSuccess: "Filen är delad. Skicka lösenordet i annat medium.",
    encryptedAttachmentsEmbedded: "{n} bilagor inkluderade",
    encryptedAttachmentsSkipped: "{n} bilagor hoppades över (för stora)",
    importTitle: "Importera från fil",
    importBody:
      "Välj en .vaccin-fil från en partners delning. Du behöver lösenordet de skickade separat.",
    importPickFile: "Välj fil",
    importPasswordLabel: "Lösenord från avsändare",
    importRun: "Importera",
    importSuccessTitle: "Klart",
    importSuccessBody:
      "{profiles} profil(er), {vaccinations} vaccination(er), {attachments} bilaga/bilagor importerade.",
    importErrorWrongPassword: "Fel lösenord eller skadad fil.",
    importErrorInvalidFile: "Filen verkar inte vara en Vaccinloggen-export.",
    importCta: "Importera fil",
  },
  trip: {
    create: "Ny resa",
    detail: "Resa",
    addCta: "Planera resa",
    fieldDestinations: "Resmål",
    fieldDestinationsHint: "Välj ett eller flera länder",
    fieldDepartDate: "Avresedatum",
    fieldReturnDate: "Hemkomst (valfritt)",
    fieldProfiles: "Vem reser?",
    fieldNotes: "Anteckningar (valfritt)",
    save: "Spara resa",
    deleteConfirmTitle: "Ta bort resa?",
    deleteConfirmBody: "Resan tas bort men registrerade vaccinationer påverkas inte.",
    statusCovered: "Skyddad",
    statusIncomplete: "Påbörjad",
    statusExpired: "Utgånget skydd",
    statusMissing: "Saknas",
    levelRequired: "Krav (IHR)",
    levelCore: "Rekommenderas",
    levelRisk: "Vid risk",
    startBy: "Starta senast {date}",
    daysUntilDepart: "{n} dagar till avresa",
    yourTrips: "Dina resor",
    noTrips: "Inga inplanerade resor.",
    disclaimer:
      "Kontakta alltid en resemedicinsk klinik för individuell rådgivning. Datan är senast uppdaterad {date}.",
    pickDestinationCta: "Lägg till resmål",
    selectAllProfiles: "Alla familjemedlemmar",
    countriesSearchPlaceholder: "Sök land",
    actionsItems: "{n} att åtgärda",
    actionsClear: "Allt på plats",
  },
  expected: {
    sectionUpcoming: "Snart",
    sectionOverdue: "Försenade",
    noUpcoming: "Inga kommande doser. Bra jobbat!",
    noOverdue: "Inget försenat.",
    overdueDays: "{n} dagar sen",
    overdueOne: "Igår",
    today: "Idag",
    tomorrow: "Imorgon",
    inDays: "Om {n} dagar",
    inWeeks: "Om {n} v",
    inMonths: "Om {n} mån",
    addThisDose: "Registrera",
    reasonBvc: "Barnvaccinationsprogrammet",
    reasonSchool: "Skolprogrammet",
    reasonTbe: "TBE-booster",
    reasonTetanus: "Stelkramp/difteri-booster",
    reasonFlu: "Influensasäsong",
    reasonCovid: "Covid-säsong",
    reasonAdult: "Vuxenrekommendation",
  },
  common: {
    back: "Tillbaka",
    done: "Klar",
    next: "Nästa",
    yes: "Ja",
    no: "Nej",
    cancel: "Avbryt",
    today: "Idag",
    tomorrow: "Imorgon",
    yesterday: "Igår",
  },
} as const;

export type StringKey = string;

// Simple dot-path lookup, e.g. t("home.title").
// Falls back to the key itself if missing — visible in dev for catching gaps.
export function t(key: string): string {
  const parts = key.split(".");
  let cur: unknown = sv;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}
