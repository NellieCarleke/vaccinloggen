// Rensa all användardata från appen. Används av "Rensa alla data" i
// inställningar (GDPR-rätten att bli glömd / installera om utan att avinstallera).
//
// Effekt:
//   - Alla rader i SQLite raderas (FK-ordning: attachments → vaccinations → trips → profiles).
//   - Attachment-filerna i documents/attachments/ raderas.
//   - Cachen för fjärrhämtat vaccinationsschema raderas.
//
// Anroparen måste själv ladda om sina zustand-stores efteråt (call .load()).

import * as FileSystem from "expo-file-system/legacy";
import { getDb } from "./database";

export async function wipeAllUserData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    `BEGIN;
     DELETE FROM attachments;
     DELETE FROM reminders;
     DELETE FROM vaccinations;
     DELETE FROM trips;
     DELETE FROM profiles;
     COMMIT;`,
  );

  const root = FileSystem.documentDirectory;
  if (!root) return;

  await safeDelete(`${root}attachments`);
  await safeDelete(`${root}schedules-cache.json`);
}

async function safeDelete(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // best effort — rensning ska aldrig kasta upp till anropare
  }
}
