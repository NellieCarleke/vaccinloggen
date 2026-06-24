// End-to-end-test för exportflödet: bygg payload → kryptera → dekryptera →
// validera → jämför mot originalet. Täcker det som faktiskt går fel om en
// förändring i payload-formatet eller envelope-strukturen råkar bryta
// partner-delningsfunktionen.
//
// Notera: testet hoppar över DB-skrivningarna i import.ts:commit() eftersom
// expo-sqlite inte är tillgängligt i Node. Den biten täcks bättre av manuell
// enhetstest enligt PLAN.md.

import {
  encryptToString,
  decryptFromString,
} from "../src/export/encrypt";
import {
  buildPayload,
  isValidPayload,
  PAYLOAD_VERSION,
  type AttachmentDump,
  type ExportPayload,
} from "../src/export/payload";
import { type Profile } from "../src/db/profiles";
import { type Vaccination } from "../src/db/vaccinations";

jest.setTimeout(30_000);

function profile(): Profile {
  return {
    id: "p1",
    name: "Lisa Karlsson",
    birthdate: "2018-04-12",
    sex: "F",
    riskGroups: ["asthma"],
    avatarPath: "attachments/avatar-p1.jpg",
    reminderLeadDays: [30, 7, 0],
    remindersEnabled: true,
    createdAt: "2026-01-01T08:00:00Z",
  };
}

function vaccination(overrides: Partial<Vaccination> = {}): Vaccination {
  return {
    id: "v1",
    profileId: "p1",
    vaccineCode: "TBE",
    vaccineLabel: null,
    brand: "FSME-Immun",
    doseNumber: 2,
    date: "2024-06-22",
    provider: "Svea Vaccin Söder",
    batch: "ABX1234",
    notes: "Något ömt i armen efteråt.",
    source: "manual",
    savedWithConflict: false,
    createdAt: "2024-06-22T15:30:00Z",
    ...overrides,
  };
}

function attachment(): AttachmentDump {
  return {
    id: "a1",
    vaccinationId: "v1",
    kind: "photo",
    filename: "vaccinkort.jpg",
    contentBase64: "SGVqIHbDpHJsZGVu", // "Hej världen" base64
    createdAt: "2024-06-22T15:31:00Z",
  };
}

describe("export round-trip — payload + encrypt", () => {
  test("payload med profil + vaccinationer + bilagor överlever krypt/dekrypt", async () => {
    const original = buildPayload({
      profiles: [profile()],
      vaccinations: [vaccination(), vaccination({ id: "v2", doseNumber: 3, date: "2024-12-01" })],
      attachments: [attachment()],
      exportedBy: "Lisa",
    });

    const cipher = await encryptToString(JSON.stringify(original), "korrekt-häst-batteri-staple");
    const decrypted = await decryptFromString(cipher, "korrekt-häst-batteri-staple");
    const parsed: unknown = JSON.parse(decrypted);

    expect(isValidPayload(parsed)).toBe(true);
    expect(parsed).toEqual(original);
  });

  test("payload utan bilagor överlever också", async () => {
    const original = buildPayload({
      profiles: [profile()],
      vaccinations: [vaccination()],
      attachments: [],
    });

    const cipher = await encryptToString(JSON.stringify(original), "test-pass");
    const decrypted = await decryptFromString(cipher, "test-pass");
    expect(JSON.parse(decrypted)).toEqual(original);
  });

  test("fel lösenord ger fel — exakt felmeddelande", async () => {
    const original = buildPayload({
      profiles: [profile()],
      vaccinations: [vaccination()],
      attachments: [],
    });
    const cipher = await encryptToString(JSON.stringify(original), "rätt-lösen");
    await expect(
      decryptFromString(cipher, "fel-lösen"),
    ).rejects.toThrow(/lösenord/i);
  });

  test("isValidPayload avvisar payload med nyare format-version", () => {
    const fromFuture: ExportPayload = {
      version: PAYLOAD_VERSION + 1,
      exportedAt: "2027-01-01T00:00:00Z",
      profiles: [],
      vaccinations: [],
      attachments: [],
    };
    expect(isValidPayload(fromFuture)).toBe(false);
  });

  test("isValidPayload accepterar exakt nuvarande version", () => {
    const ok: ExportPayload = {
      version: PAYLOAD_VERSION,
      exportedAt: "2026-01-01T00:00:00Z",
      profiles: [],
      vaccinations: [],
      attachments: [],
    };
    expect(isValidPayload(ok)).toBe(true);
  });

  test("isValidPayload avvisar saknade array-fält", () => {
    expect(isValidPayload({ version: 1, exportedAt: "2026-01-01" })).toBe(false);
    expect(
      isValidPayload({
        version: 1,
        exportedAt: "2026-01-01",
        profiles: [],
        vaccinations: [],
      }),
    ).toBe(false);
  });

  test("bilaga med contentBase64 = null bevaras genom round-trip (skickas vidare som skippas i import)", async () => {
    const tooBigAttachment: AttachmentDump = {
      id: "a-big",
      vaccinationId: "v1",
      kind: "pdf",
      filename: "stor-pdf-som-skippas.pdf",
      contentBase64: null,
      createdAt: "2024-01-01T00:00:00Z",
    };
    const original = buildPayload({
      profiles: [profile()],
      vaccinations: [vaccination()],
      attachments: [tooBigAttachment],
    });

    const cipher = await encryptToString(JSON.stringify(original), "p");
    const decrypted = await decryptFromString(cipher, "p");
    const parsed = JSON.parse(decrypted) as ExportPayload;
    expect(parsed.attachments[0]!.contentBase64).toBeNull();
    expect(parsed.attachments[0]!.filename).toBe("stor-pdf-som-skippas.pdf");
  });
});
