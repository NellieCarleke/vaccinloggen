import * as SQLite from "expo-sqlite";

const DB_NAME = "vaccinloggen.db";

let dbHandle: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbHandle) {
    dbHandle = await SQLite.openDatabaseAsync(DB_NAME);
    await dbHandle.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  }
  return dbHandle;
}

export async function closeDb(): Promise<void> {
  if (dbHandle) {
    await dbHandle.closeAsync();
    dbHandle = null;
  }
}
