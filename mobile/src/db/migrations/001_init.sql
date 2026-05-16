-- Initial schema. See PLAN.md §5.

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
