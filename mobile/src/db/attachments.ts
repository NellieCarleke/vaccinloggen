import { getDb } from "./database";
import { uuid } from "../utils/ids";

export type AttachmentKind = "photo" | "pdf" | "receipt";

export interface Attachment {
  id: string;
  vaccinationId: string;
  kind: AttachmentKind;
  /** Relative path inside FileSystem.documentDirectory, e.g. "attachments/abc.jpg" */
  path: string;
  createdAt: string;
}

interface Row {
  id: string;
  vaccination_id: string;
  kind: AttachmentKind;
  path: string;
  created_at: string;
}

function rowToAttachment(r: Row): Attachment {
  return {
    id: r.id,
    vaccinationId: r.vaccination_id,
    kind: r.kind,
    path: r.path,
    createdAt: r.created_at,
  };
}

export async function listAttachments(
  vaccinationId: string,
): Promise<Attachment[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT * FROM attachments WHERE vaccination_id = ? ORDER BY created_at ASC",
    vaccinationId,
  );
  return rows.map(rowToAttachment);
}

export async function createAttachment(input: {
  vaccinationId: string;
  kind: AttachmentKind;
  path: string;
}): Promise<Attachment> {
  const db = await getDb();
  const a: Attachment = {
    id: uuid(),
    vaccinationId: input.vaccinationId,
    kind: input.kind,
    path: input.path,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO attachments (id, vaccination_id, kind, path, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    a.id,
    a.vaccinationId,
    a.kind,
    a.path,
    a.createdAt,
  );
  return a;
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM attachments WHERE id = ?", id);
}

export async function getAttachment(id: string): Promise<Attachment | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(
    "SELECT * FROM attachments WHERE id = ?",
    id,
  );
  return row ? rowToAttachment(row) : null;
}
