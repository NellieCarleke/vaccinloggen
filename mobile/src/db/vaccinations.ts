import { getDb } from "./database";
import { uuid } from "../utils/ids";

export type VaccinationSource = "manual" | "imported" | "self-reported";

export interface Vaccination {
  id: string;
  profileId: string;
  vaccineCode: string;
  vaccineLabel: string | null;
  brand: string | null;
  doseNumber: number | null;
  date: string;
  provider: string | null;
  batch: string | null;
  notes: string | null;
  source: VaccinationSource;
  createdAt: string;
}

interface Row {
  id: string;
  profile_id: string;
  vaccine_code: string;
  vaccine_label: string | null;
  brand: string | null;
  dose_number: number | null;
  date: string;
  provider: string | null;
  batch: string | null;
  notes: string | null;
  source: VaccinationSource;
  created_at: string;
}

function rowToVaccination(r: Row): Vaccination {
  return {
    id: r.id,
    profileId: r.profile_id,
    vaccineCode: r.vaccine_code,
    vaccineLabel: r.vaccine_label,
    brand: r.brand,
    doseNumber: r.dose_number,
    date: r.date,
    provider: r.provider,
    batch: r.batch,
    notes: r.notes,
    source: r.source,
    createdAt: r.created_at,
  };
}

export interface VaccinationInput {
  profileId: string;
  vaccineCode: string;
  vaccineLabel?: string | null;
  brand?: string | null;
  doseNumber?: number | null;
  date: string;
  provider?: string | null;
  batch?: string | null;
  notes?: string | null;
  source?: VaccinationSource;
}

export async function listVaccinations(profileId?: string): Promise<Vaccination[]> {
  const db = await getDb();
  const rows = profileId
    ? await db.getAllAsync<Row>(
        "SELECT * FROM vaccinations WHERE profile_id = ? ORDER BY date DESC, created_at DESC",
        profileId,
      )
    : await db.getAllAsync<Row>(
        "SELECT * FROM vaccinations ORDER BY date DESC, created_at DESC",
      );
  return rows.map(rowToVaccination);
}

export async function getVaccination(id: string): Promise<Vaccination | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(
    "SELECT * FROM vaccinations WHERE id = ?",
    id,
  );
  return row ? rowToVaccination(row) : null;
}

export async function createVaccination(input: VaccinationInput): Promise<Vaccination> {
  const db = await getDb();
  const v: Vaccination = {
    id: uuid(),
    profileId: input.profileId,
    vaccineCode: input.vaccineCode,
    vaccineLabel: input.vaccineLabel ?? null,
    brand: input.brand ?? null,
    doseNumber: input.doseNumber ?? null,
    date: input.date,
    provider: input.provider ?? null,
    batch: input.batch ?? null,
    notes: input.notes ?? null,
    source: input.source ?? "manual",
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO vaccinations (id, profile_id, vaccine_code, vaccine_label, brand, dose_number, date, provider, batch, notes, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    v.id,
    v.profileId,
    v.vaccineCode,
    v.vaccineLabel,
    v.brand,
    v.doseNumber,
    v.date,
    v.provider,
    v.batch,
    v.notes,
    v.source,
    v.createdAt,
  );
  return v;
}

export async function updateVaccination(
  id: string,
  updates: Partial<VaccinationInput>,
): Promise<void> {
  const existing = await getVaccination(id);
  if (!existing) throw new Error(`Vaccination ${id} not found`);
  const merged = { ...existing, ...updates } as Vaccination;
  const db = await getDb();
  await db.runAsync(
    `UPDATE vaccinations
     SET vaccine_code = ?, vaccine_label = ?, brand = ?, dose_number = ?, date = ?, provider = ?, batch = ?, notes = ?
     WHERE id = ?`,
    merged.vaccineCode,
    merged.vaccineLabel,
    merged.brand,
    merged.doseNumber,
    merged.date,
    merged.provider,
    merged.batch,
    merged.notes,
    id,
  );
}

export async function deleteVaccination(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM vaccinations WHERE id = ?", id);
}
