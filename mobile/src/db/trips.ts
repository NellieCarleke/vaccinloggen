import { getDb } from "./database";
import { uuid } from "../utils/ids";

export interface Trip {
  id: string;
  destinations: string[];
  departDate: string;
  returnDate: string | null;
  profileIds: string[];
  notes: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  destinations: string;
  depart_date: string;
  return_date: string | null;
  profile_ids: string;
  notes: string | null;
  created_at: string;
}

function rowToTrip(r: Row): Trip {
  return {
    id: r.id,
    destinations: JSON.parse(r.destinations),
    departDate: r.depart_date,
    returnDate: r.return_date,
    profileIds: JSON.parse(r.profile_ids),
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export interface TripInput {
  destinations: string[];
  departDate: string;
  returnDate?: string | null;
  profileIds: string[];
  notes?: string | null;
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT * FROM trips ORDER BY depart_date DESC",
  );
  return rows.map(rowToTrip);
}

export async function getTrip(id: string): Promise<Trip | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(
    "SELECT * FROM trips WHERE id = ?",
    id,
  );
  return row ? rowToTrip(row) : null;
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const db = await getDb();
  const trip: Trip = {
    id: uuid(),
    destinations: input.destinations,
    departDate: input.departDate,
    returnDate: input.returnDate ?? null,
    profileIds: input.profileIds,
    notes: input.notes ?? null,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO trips (id, destinations, depart_date, return_date, profile_ids, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    trip.id,
    JSON.stringify(trip.destinations),
    trip.departDate,
    trip.returnDate,
    JSON.stringify(trip.profileIds),
    trip.notes,
    trip.createdAt,
  );
  return trip;
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM trips WHERE id = ?", id);
}
