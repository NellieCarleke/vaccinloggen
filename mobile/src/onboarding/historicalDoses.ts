// Bulk-create "self-reported" vaccination entries for a profile based on
// the standard Swedish child program. Used by the onboarding history prompt
// when the user says "yes, I followed the program".
//
// Skips doses where:
//   - The dose's age trigger lands in the future for this profile (no
//     point creating an entry for something that hasn't happened yet)
//   - The vaccine wasn't part of the program when the profile would have
//     been the right age (e.g. rotavirus for someone born in 1991)
//   - A dose with the same vaccine_code + dose_number is already recorded

import {
  getChildProgram,
  dueDateFor,
  type ExpectedDoseSpec,
} from "../schedules/child-program";
import {
  type Vaccination,
  type VaccinationInput,
  createVaccination,
  listVaccinations,
} from "../db/vaccinations";
import { type Profile } from "../db/profiles";
import { dayjs } from "../utils/dates";

const HISTORICAL_NOTE =
  "Uppgivet vid skapande av profil. Exakt datum okänt — datumet är BVC-rekommenderad ålder.";

export function bulkSpecsToCreate(
  profile: Profile,
  recorded: Vaccination[],
  today: Date = new Date(),
): { spec: ExpectedDoseSpec; date: Date }[] {
  const taken = new Set<string>();
  for (const v of recorded) {
    if (v.profileId === profile.id && v.doseNumber != null) {
      taken.add(`${v.vaccineCode}:${v.doseNumber}`);
    }
  }

  const out: { spec: ExpectedDoseSpec; date: Date }[] = [];
  for (const spec of getChildProgram()) {
    const key = `${spec.code}:${spec.dose}`;
    if (taken.has(key)) continue;

    const dueDate = dueDateFor(profile.birthdate, spec.trigger);
    if (dayjs(dueDate).isAfter(dayjs(today), "day")) continue; // future, not historical

    if (spec.availableFrom && dayjs(dueDate).isBefore(dayjs(spec.availableFrom), "day")) {
      // The vaccine didn't exist in the Swedish program when this profile
      // was the right age. Skip — would be a phantom entry.
      continue;
    }

    out.push({ spec, date: dueDate });
  }
  return out;
}

export async function bulkCreateHistoricalDoses(
  profile: Profile,
): Promise<number> {
  const recorded = await listVaccinations(profile.id);
  const specs = bulkSpecsToCreate(profile, recorded);

  for (const { spec, date } of specs) {
    const input: VaccinationInput = {
      profileId: profile.id,
      vaccineCode: spec.code,
      doseNumber: spec.dose,
      date: dayjs(date).format("YYYY-MM-DD"),
      notes: HISTORICAL_NOTE,
      source: "self-reported",
    };
    await createVaccination(input);
  }
  return specs.length;
}

/**
 * Whether the onboarding history prompt is worth showing for a freshly
 * created profile. We skip newborns (no past doses possible yet).
 */
export function shouldOfferHistoryImport(profile: Profile, today: Date = new Date()): boolean {
  const firstSpec = getChildProgram()[0]; // rotavirus at 6 weeks
  if (!firstSpec) return false;
  const firstDoseDue = dueDateFor(profile.birthdate, firstSpec.trigger);
  return dayjs(firstDoseDue).isBefore(dayjs(today), "day");
}
