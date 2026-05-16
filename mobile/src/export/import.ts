// Tar en .vaccin-fil, dekrypterar med användarens lösenord, validerar payloaden
// och slår ihop med befintlig data.
//
// Konfliktstrategi: profiler matchas på id; om id krockar görs ett "behåll
// båda" — nya profiler får ny UUID och vaccinationerna länkas om till det.

import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import { decryptFromString } from "./encrypt";
import { isValidPayload, type ExportPayload } from "./payload";
import { getDb } from "../db/database";
import { uuid } from "../utils/ids";
import { persistPickedFile } from "../utils/files";

export interface ImportResult {
  profilesImported: number;
  vaccinationsImported: number;
  attachmentsImported: number;
  attachmentsSkipped: number;
}

/**
 * Step 1: open document-picker, return raw envelope text + filename.
 * Step 2: caller asks user for password, then calls importDecrypted().
 * This split lets the share screen show a password prompt between the two steps.
 */
export async function pickEncryptedFile(): Promise<{
  envelope: string;
  filename: string;
} | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/octet-stream", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  const envelope = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { envelope, filename: asset.name };
}

export async function importDecrypted(
  envelope: string,
  password: string,
): Promise<ImportResult> {
  const json = await decryptFromString(envelope, password);
  const payload: unknown = JSON.parse(json);
  if (!isValidPayload(payload)) throw new Error("Ogiltigt filformat.");

  return await commit(payload);
}

async function commit(payload: ExportPayload): Promise<ImportResult> {
  const db = await getDb();

  // Profile id remap: if a profile with same id already exists, give the
  // imported one a new id (so we don't overwrite) and remap vaccinations.
  const idRemap = new Map<string, string>();
  const existingProfileIds = new Set<string>();
  const rows = await db.getAllAsync<{ id: string }>("SELECT id FROM profiles");
  for (const r of rows) existingProfileIds.add(r.id);

  for (const p of payload.profiles) {
    if (existingProfileIds.has(p.id)) idRemap.set(p.id, uuid());
  }

  let profilesImported = 0;
  for (const p of payload.profiles) {
    const id = idRemap.get(p.id) ?? p.id;
    await db.runAsync(
      `INSERT OR REPLACE INTO profiles
        (id, name, birthdate, sex, risk_groups, avatar_path, reminder_lead_days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      p.name,
      p.birthdate,
      p.sex,
      JSON.stringify(p.riskGroups ?? []),
      p.avatarPath ?? null,
      JSON.stringify(p.reminderLeadDays ?? [30, 7, 0]),
      p.createdAt ?? new Date().toISOString(),
    );
    profilesImported++;
  }

  // Vaccinations — remap profileId via idRemap; keep vaccination ids stable
  // (collisions vanishingly unlikely with UUIDs).
  let vaccinationsImported = 0;
  const vaccinationIdRemap = new Map<string, string>();
  const existingVaccinationIds = new Set<string>();
  const vrows = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM vaccinations",
  );
  for (const r of vrows) existingVaccinationIds.add(r.id);

  for (const v of payload.vaccinations) {
    let id = v.id;
    if (existingVaccinationIds.has(id)) {
      id = uuid();
      vaccinationIdRemap.set(v.id, id);
    }
    const profileId = idRemap.get(v.profileId) ?? v.profileId;
    await db.runAsync(
      `INSERT OR REPLACE INTO vaccinations
        (id, profile_id, vaccine_code, vaccine_label, brand, dose_number, date, provider, batch, notes, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      profileId,
      v.vaccineCode,
      v.vaccineLabel,
      v.brand,
      v.doseNumber,
      v.date,
      v.provider,
      v.batch,
      v.notes,
      "imported",
      v.createdAt ?? new Date().toISOString(),
    );
    vaccinationsImported++;
  }

  // Attachments — write embedded base64 back to disk, link via remapped vaccination id
  let attachmentsImported = 0;
  let attachmentsSkipped = 0;
  for (const a of payload.attachments) {
    if (!a.contentBase64) {
      attachmentsSkipped++;
      continue;
    }
    try {
      const ext = a.filename.split(".").pop() ?? "bin";
      // Materialise the base64 into a temp file, then run it through
      // persistPickedFile to land in attachments/ with a fresh UUID.
      const cache = FileSystem.cacheDirectory!;
      const tempPath = cache + `import-${uuid()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempPath, a.contentBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const relPath = await persistPickedFile(tempPath, ext);
      const vaccinationId = vaccinationIdRemap.get(a.vaccinationId) ?? a.vaccinationId;
      await db.runAsync(
        `INSERT INTO attachments (id, vaccination_id, kind, path, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        uuid(),
        vaccinationId,
        a.kind,
        relPath,
        a.createdAt ?? new Date().toISOString(),
      );
      attachmentsImported++;
    } catch {
      attachmentsSkipped++;
    }
  }

  return {
    profilesImported,
    vaccinationsImported,
    attachmentsImported,
    attachmentsSkipped,
  };
}
