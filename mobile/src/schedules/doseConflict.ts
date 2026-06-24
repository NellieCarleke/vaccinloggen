// Validering vid in-/utmatning: upptäck när ett doseNumber skapar ett gap
// (hoppar förbi en föregående dos) eller en duplicering (samma nummer finns
// redan på en annan post). Ren funktion — anropad både av VaccinationForm
// och av tester.

import { type Vaccination } from "../db/vaccinations";

export interface DoseConflictInput {
  profileId: string;
  vaccineCode: string;
  doseNumber: number | null;
  /** Vid redigering: id på posten som ändras, så vi inte jämför mot sig själv. */
  excludeId?: string;
}

export type DoseConflict =
  | { kind: "ok" }
  | { kind: "gap"; expected: number }
  | { kind: "duplicate"; existingId: string };

export function checkDoseConflict(
  input: DoseConflictInput,
  existing: readonly Vaccination[],
): DoseConflict {
  if (input.doseNumber == null) return { kind: "ok" };
  const others = existing.filter(
    (v) =>
      v.profileId === input.profileId &&
      v.vaccineCode === input.vaccineCode &&
      v.id !== input.excludeId,
  );
  const duplicate = others.find((v) => v.doseNumber === input.doseNumber);
  if (duplicate) return { kind: "duplicate", existingId: duplicate.id };
  const expected = others.length + 1;
  if (input.doseNumber > expected) return { kind: "gap", expected };
  return { kind: "ok" };
}

export interface ConflictMessage {
  title: string;
  body: string;
}

/**
 * Bygger title + body som visas i Alert.alert vid en konflikt. Pure funktion
 * så vi kan testa exakt formulering utan att rendera UI.
 */
export function formatConflictMessage(
  conflict: Exclude<DoseConflict, { kind: "ok" }>,
  doseNumber: number,
): ConflictMessage {
  if (conflict.kind === "gap") {
    return {
      title: "Saknar tidigare doser?",
      body: `Du har angett dos ${doseNumber} men förväntat nästa dosnummer är ${conflict.expected}. Vill du spara ändå?`,
    };
  }
  return {
    title: "Dosnumret finns redan",
    body: `Det finns redan en post med dos ${doseNumber} för det här vaccinet. Vill du spara ändå?`,
  };
}
