import { getDb } from "./database";

// All migrations are inlined as strings (Metro bundler can't import .sql files
// natively). Add a new entry to MIGRATIONS for each schema change. Migrations
// run once per id, in order.

const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_init",
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birthdate TEXT NOT NULL,
        sex TEXT,
        risk_groups TEXT NOT NULL DEFAULT '[]',
        avatar_path TEXT,
        reminder_lead_days TEXT NOT NULL DEFAULT '[30,7,0]',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vaccinations (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        vaccine_code TEXT NOT NULL,
        vaccine_label TEXT,
        brand TEXT,
        dose_number INTEGER,
        date TEXT NOT NULL,
        provider TEXT,
        batch TEXT,
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'manual',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_vaccinations_profile ON vaccinations(profile_id);
      CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON vaccinations(date);

      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        vaccination_id TEXT NOT NULL REFERENCES vaccinations(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_attachments_vaccination ON attachments(vaccination_id);

      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        destinations TEXT NOT NULL,
        depart_date TEXT NOT NULL,
        return_date TEXT,
        profile_ids TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        vaccine_code TEXT NOT NULL,
        due_date TEXT NOT NULL,
        reason TEXT,
        notification_id TEXT,
        dismissed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_reminders_profile ON reminders(profile_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date);
    `,
  },
  {
    id: "002_reminders_enabled",
    sql: `
      ALTER TABLE profiles ADD COLUMN reminders_enabled INTEGER NOT NULL DEFAULT 1;
    `,
  },
  {
    // Diagnostisk flagga: sätts när användaren explicit klickar "Spara ändå"
    // i konflikt-blockern. Hjälper oss spåra "fel påminnelser"-rapporter
    // tillbaka till entries som skapades trots gap/duplicering.
    id: "003_vaccinations_saved_with_conflict",
    sql: `
      ALTER TABLE vaccinations ADD COLUMN saved_with_conflict INTEGER NOT NULL DEFAULT 0;
    `,
  },
];

// Migrations run in array order. Newer migrations should be appended.
// Sort defensively in case authors add them out of order:
MIGRATIONS.sort((a, b) => a.id.localeCompare(b.id));

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const m of MIGRATIONS) {
    const row = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM _migrations WHERE id = ?",
      m.id,
    );
    if (row) continue;
    await db.execAsync(m.sql);
    await db.runAsync("INSERT INTO _migrations (id) VALUES (?)", m.id);
  }
}
