import { create } from "zustand";
import {
  type Profile,
  type ProfileInput,
  createProfile as dbCreate,
  deleteProfile as dbDelete,
  listProfiles as dbList,
  updateProfile as dbUpdate,
} from "../db/profiles";

interface ProfilesState {
  profiles: Profile[];
  loaded: boolean;
  selectedId: string | null;
  load: () => Promise<void>;
  add: (input: ProfileInput) => Promise<Profile>;
  update: (id: string, input: Partial<ProfileInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (id: string | null) => void;
}

export const useProfiles = create<ProfilesState>((set, get) => ({
  profiles: [],
  loaded: false,
  selectedId: null,

  load: async () => {
    const profiles = await dbList();
    set({
      profiles,
      loaded: true,
      selectedId: get().selectedId ?? profiles[0]?.id ?? null,
    });
  },

  add: async (input) => {
    const profile = await dbCreate(input);
    set((s) => ({
      profiles: [...s.profiles, profile],
      selectedId: s.selectedId ?? profile.id,
    }));
    return profile;
  },

  update: async (id, input) => {
    await dbUpdate(id, input);
    const profiles = await dbList();
    set({ profiles });
  },

  remove: async (id) => {
    await dbDelete(id);
    set((s) => {
      const remaining = s.profiles.filter((p) => p.id !== id);
      return {
        profiles: remaining,
        selectedId: s.selectedId === id ? (remaining[0]?.id ?? null) : s.selectedId,
      };
    });
  },

  select: (id) => set({ selectedId: id }),
}));
