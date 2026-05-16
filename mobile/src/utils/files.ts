import * as FileSystem from "expo-file-system/legacy";
import { uuid } from "./ids";

const ATTACHMENTS_DIR = "attachments";

/**
 * Ensure the attachments directory exists inside the app sandbox documents
 * dir. Idempotent — safe to call before each save.
 */
async function ensureAttachmentsDir(): Promise<string> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error("documentDirectory unavailable on this platform");
  const dir = root + ATTACHMENTS_DIR + "/";
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Copy a picked file (image-picker / document-picker URI) into the app
 * documents dir under attachments/. Returns the *relative* path stored in DB.
 * The full URI is reconstructed via fullUri() at read time.
 */
export async function persistPickedFile(
  sourceUri: string,
  extensionHint?: string,
): Promise<string> {
  const dir = await ensureAttachmentsDir();
  const ext = (extensionHint || extractExtension(sourceUri) || "bin").toLowerCase();
  const filename = `${uuid()}.${ext}`;
  const dest = dir + filename;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return `${ATTACHMENTS_DIR}/${filename}`;
}

export function fullUri(relativePath: string): string {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error("documentDirectory unavailable");
  return root + relativePath;
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const uri = fullUri(relativePath);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // best effort
  }
}

function extractExtension(uri: string): string | null {
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  return m ? m[1] : null;
}
