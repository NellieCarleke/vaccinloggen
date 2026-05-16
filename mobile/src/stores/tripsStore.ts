import { create } from "zustand";
import {
  type Trip,
  type TripInput,
  createTrip as dbCreate,
  deleteTrip as dbDelete,
  listTrips as dbList,
} from "../db/trips";

interface TripsState {
  trips: Trip[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (input: TripInput) => Promise<Trip>;
  remove: (id: string) => Promise<void>;
}

export const useTrips = create<TripsState>((set) => ({
  trips: [],
  loaded: false,
  load: async () => {
    const trips = await dbList();
    set({ trips, loaded: true });
  },
  add: async (input) => {
    const trip = await dbCreate(input);
    set((s) => ({
      trips: [trip, ...s.trips].sort((a, b) =>
        b.departDate.localeCompare(a.departDate),
      ),
    }));
    return trip;
  },
  remove: async (id) => {
    await dbDelete(id);
    set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
  },
}));
