// Bygger en krypterad .vaccin-fil med vald(a) profil(er) och deras
// vaccinationer + bilagor (base64-inbäddade), och delar den via systemets
// share sheet.

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import { listAttachments, type Attachment } from "../db/attachments";
import { fullUri } from "../utils/files";
import { encryptToString } from "./encrypt";
import {
  type AttachmentDump,
  type ExportPayload,
  buildPayload,
} from "./payload";

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB total embed

export interface ExportShareArgs {
  profiles: Profile[];
  vaccinations: Vaccination[];
  password: string;
  /** Optional friendly name for "exportedBy" field */
  exportedBy?: string;
}

export interface ShareResult {
  filename: string;
  attachmentsEmbedded: number;
  attachmentsSkipped: number;
}

export async function buildAndShareEncryptedExport(
  args: ExportShareArgs,
): Promise<ShareResult> {
  const profileIds = args.profiles.map((p) => p.id);
  const ownVaccinations = args.vaccinations.filter((v) =>
    profileIds.includes(v.profileId),
  );

  // Collect attachments per vaccination
  const allAttachments: Attachment[] = [];
  for (const v of ownVaccinations) {
    const list = await listAttachments(v.id);
    allAttachments.push(...list);
  }

  // Embed up to MAX_ATTACHMENT_BYTES; skip the rest
  const dumps: AttachmentDump[] = [];
  let bytesUsed = 0;
  let skipped = 0;
  for (const att of allAttachments) {
    try {
      const uri = fullUri(att.path);
      const info = await FileSystem.getInfoAsync(uri);
      const size = info.exists && "size" in info ? info.size ?? 0 : 0;
      if (bytesUsed + size > MAX_ATTACHMENT_BYTES) {
        dumps.push({
          id: att.id,
          vaccinationId: att.vaccinationId,
          kind: att.kind,
          filename: att.path.split("/").pop() ?? att.id,
          contentBase64: null,
          createdAt: att.createdAt,
        });
        skipped++;
        continue;
      }
      const contentBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      dumps.push({
        id: att.id,
        vaccinationId: att.vaccinationId,
        kind: att.kind,
        filename: att.path.split("/").pop() ?? att.id,
        contentBase64,
        createdAt: att.createdAt,
      });
      bytesUsed += size;
    } catch {
      skipped++;
    }
  }

  const payload: ExportPayload = buildPayload({
    profiles: args.profiles,
    vaccinations: ownVaccinations,
    attachments: dumps,
    exportedBy: args.exportedBy,
  });

  const json = JSON.stringify(payload);
  const cipher = await encryptToString(json, args.password);

  // Write to a temp file with the .vaccin extension so receivers see the right type
  const safeName = sanitizeFilename(
    args.profiles.map((p) => p.name).join("-"),
  );
  const date = new Date().toISOString().slice(0, 10);
  const filename = `vaccinloggen-${safeName}-${date}.vaccin`;
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("cacheDirectory unavailable");
  const fileUri = cacheDir + filename;
  await FileSystem.writeAsStringAsync(fileUri, cipher, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/octet-stream",
      dialogTitle: "Dela vaccinationsdata",
    });
  }

  return {
    filename,
    attachmentsEmbedded: dumps.filter((d) => d.contentBase64 != null).length,
    attachmentsSkipped: skipped,
  };
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9åäö-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "export";
}
