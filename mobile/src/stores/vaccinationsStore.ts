import { create } from "zustand";
import {
  type Vaccination,
  type VaccinationInput,
  createVaccination as dbCreate,
  deleteVaccination as dbDelete,
  listVaccinations as dbList,
  updateVaccination as dbUpdate,
} from "../db/vaccinations";

interface VaccinationsState {
  vaccinations: Vaccination[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (input: VaccinationInput) => Promise<Vaccination>;
  update: (id: string, input: Partial<VaccinationInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byProfile: (profileId: string) => Vaccination[];
  recentAcrossAll: (limit?: number) => Vaccination[];
}

export const useVaccinations = create<VaccinationsState>((set, get) => ({
  vaccinations: [],
  loaded: false,

  load: async () => {
    const vaccinations = await dbList();
    set({ vaccinations, loaded: true });
  },

  add: async (input) => {
    const v = await dbCreate(input);
    set((s) => ({ vaccinations: insertSorted(s.vaccinations, v) }));
    return v;
  },

  update: async (id, input) => {
    await dbUpdate(id, input);
    const vaccinations = await dbList();
    set({ vaccinations });
  },

  remove: async (id) => {
    await dbDelete(id);
    set((s) => ({ vaccinations: s.vaccinations.filter((v) => v.id !== id) }));
  },

  byProfile: (profileId) =>
    get().vaccinations.filter((v) => v.profileId === profileId),

  recentAcrossAll: (limit = 5) => get().vaccinations.slice(0, limit),
}));

function insertSorted(list: Vaccination[], v: Vaccination): Vaccination[] {
  const next = [...list, v];
  next.sort((a, b) => {
    if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
    return b.date.localeCompare(a.date);
  });
  return next;
}
