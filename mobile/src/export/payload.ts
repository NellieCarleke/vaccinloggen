// Format för exporterade .vaccin-filer.
//
// version-fält styr framtida bakåtkompatibilitet. Bilagor inbäddas som base64
// upp till en gräns (~25 MB total) — annars skippar vi dem och varnar.

import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import { type Attachment } from "../db/attachments";

export const PAYLOAD_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: string; // ISO timestamp
  exportedBy?: string; // optional friendly name (the sender's profile name)
  profiles: Profile[];
  vaccinations: Vaccination[];
  attachments: AttachmentDump[];
}

export interface AttachmentDump {
  id: string;
  vaccinationId: string;
  kind: Attachment["kind"];
  filename: string;
  /** base64 of the attachment file contents, or null if too large to embed */
  contentBase64: string | null;
  createdAt: string;
}

export function buildPayload(args: {
  profiles: Profile[];
  vaccinations: Vaccination[];
  attachments: AttachmentDump[];
  exportedBy?: string;
}): ExportPayload {
  return {
    version: PAYLOAD_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: args.exportedBy,
    profiles: args.profiles,
    vaccinations: args.vaccinations,
    attachments: args.attachments,
  };
}

export function isValidPayload(obj: unknown): obj is ExportPayload {
  if (!obj || typeof obj !== "object") return false;
  const p = obj as Partial<ExportPayload>;
  if (typeof p.version !== "number") return false;
  if (p.version > PAYLOAD_VERSION) return false; // newer than us — refuse
  if (!Array.isArray(p.profiles)) return false;
  if (!Array.isArray(p.vaccinations)) return false;
  if (!Array.isArray(p.attachments)) return false;
  return true;
}
