import { getDb } from "./database";
import { uuid } from "../utils/ids";

export type Sex = "F" | "M" | "X";

export interface Profile {
  id: string;
  name: string;
  birthdate: string;
  sex: Sex | null;
  riskGroups: string[];
  avatarPath: string | null;
  reminderLeadDays: number[];
  remindersEnabled: boolean;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  name: string;
  birthdate: string;
  sex: Sex | null;
  risk_groups: string;
  avatar_path: string | null;
  reminder_lead_days: string;
  reminders_enabled: number;
  created_at: string;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    birthdate: row.birthdate,
    sex: row.sex,
    riskGroups: JSON.parse(row.risk_groups),
    avatarPath: row.avatar_path,
    reminderLeadDays: JSON.parse(row.reminder_lead_days),
    remindersEnabled: row.reminders_enabled !== 0,
    createdAt: row.created_at,
  };
}

export interface ProfileInput {
  name: string;
  birthdate: string;
  sex?: Sex | null;
  riskGroups?: string[];
  avatarPath?: string | null;
  reminderLeadDays?: number[];
  remindersEnabled?: boolean;
}

export async function listProfiles(): Promise<Profile[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ProfileRow>(
    "SELECT * FROM profiles ORDER BY created_at ASC",
  );
  return rows.map(rowToProfile);
}

export async function getProfile(id: string): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>(
    "SELECT * FROM profiles WHERE id = ?",
    id,
  );
  return row ? rowToProfile(row) : null;
}

export async function createProfile(input: ProfileInput): Promise<Profile> {
  const db = await getDb();
  const id = uuid();
  const profile: Profile = {
    id,
    name: input.name,
    birthdate: input.birthdate,
    sex: input.sex ?? null,
    riskGroups: input.riskGroups ?? [],
    avatarPath: input.avatarPath ?? null,
    reminderLeadDays: input.reminderLeadDays ?? [30, 7, 0],
    remindersEnabled: input.remindersEnabled ?? true,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO profiles (id, name, birthdate, sex, risk_groups, avatar_path, reminder_lead_days, reminders_enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    profile.id,
    profile.name,
    profile.birthdate,
    profile.sex,
    JSON.stringify(profile.riskGroups),
    profile.avatarPath,
    JSON.stringify(profile.reminderLeadDays),
    profile.remindersEnabled ? 1 : 0,
    profile.createdAt,
  );
  return profile;
}

export async function updateProfile(
  id: string,
  updates: Partial<ProfileInput>,
): Promise<void> {
  const existing = await getProfile(id);
  if (!existing) throw new Error(`Profile ${id} not found`);
  const merged = { ...existing, ...updates };
  const db = await getDb();
  await db.runAsync(
    `UPDATE profiles
     SET name = ?, birthdate = ?, sex = ?, risk_groups = ?, avatar_path = ?, reminder_lead_days = ?, reminders_enabled = ?
     WHERE id = ?`,
    merged.name,
    merged.birthdate,
    merged.sex ?? null,
    JSON.stringify(merged.riskGroups ?? []),
    merged.avatarPath ?? null,
    JSON.stringify(merged.reminderLeadDays ?? [30, 7, 0]),
    (merged.remindersEnabled ?? true) ? 1 : 0,
    id,
  );
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM profiles WHERE id = ?", id);
}
