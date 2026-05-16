// Derive expected doses for a profile given their vaccination history and
// today's date. Pure function — fully testable, no side effects.
//
// Inputs:
//   profile         — birthdate + risk groups
//   vaccinations    — every dose recorded for this profile
//   today           — reference date (injectable for tests)
//
// Output: a flat list of ExpectedDose entries, each with a status indicating
// urgency. The UI groups by status to render "Snart" vs "Försenade" sections.

import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import {
  getChildProgram,
  type ReasonKey,
  dueDateFor,
} from "../schedules/child-program";
import { deriveAdultBoosters } from "../schedules/adult-recommendations";
import { dayjs } from "../utils/dates";

export type DoseStatus = "upcoming" | "soon" | "overdue";

export interface ExpectedDose {
  /** Stable identity for memoisation + dedup. e.g. "MPR:1" */
  key: string;
  code: string;
  doseNumber: number | null;
  dueDate: Date;
  reason: ReasonKey;
  status: DoseStatus;
  /** Days until due (negative if overdue) */
  daysUntilDue: number;
}

const SOON_DAYS = 60; // <60 dagar till = "soon"
const OVERDUE_GRACE_DAYS = 14; // tolerera 2 v efter due-date innan rött

/**
 * Compute all expected doses (child program + adult boosters) for a profile.
 * Skips doses that have already been recorded.
 */
export function deriveExpectedDoses(
  profile: Profile,
  vaccinations: Vaccination[],
  today: Date,
): ExpectedDose[] {
  // Honour per-profile reminders toggle. When off, hide all derived doses.
  if (profile.remindersEnabled === false) return [];

  const ownVaccinations = vaccinations.filter(
    (v) => v.profileId === profile.id,
  );

  const taken = new Set<string>();
  for (const v of ownVaccinations) {
    if (v.doseNumber != null) taken.add(`${v.vaccineCode}:${v.doseNumber}`);
  }

  const out: ExpectedDose[] = [];

  // Child program — age-triggered, only relevant up to ~age 18
  for (const spec of getChildProgram()) {
    const key = `${spec.code}:${spec.dose}`;
    if (taken.has(key)) continue;
    const dueDate = dueDateFor(profile.birthdate, spec.trigger);
    // Skip doses where the vaccine didn't exist in the Swedish program at the
    // profile's expected age. Example: pneumokock (added 2009) is irrelevant
    // for a 50-year-old who was 33 when it was introduced — flagging it as
    // "50 years overdue" would be both wrong and alarming.
    if (
      spec.availableFrom &&
      dayjs(dueDate).isBefore(dayjs(spec.availableFrom), "day")
    ) {
      continue;
    }
    out.push({
      key,
      code: spec.code,
      doseNumber: spec.dose,
      dueDate,
      reason: spec.reason,
      ...statusOf(dueDate, today),
    });
  }

  // Adult boosters — booster after the most recent recorded dose
  for (const adult of deriveAdultBoosters(profile, ownVaccinations, today)) {
    const keyId = adult.doseNumber != null ? String(adult.doseNumber) : "next";
    const key = `${adult.code}:${keyId}`;
    out.push({
      key,
      code: adult.code,
      doseNumber: adult.doseNumber,
      dueDate: adult.dueDate,
      reason: adult.reason,
      ...statusOf(adult.dueDate, today),
    });
  }

  // Sort by due date ascending (earliest first), with overdue at the top
  out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return out;
}

function statusOf(
  dueDate: Date,
  today: Date,
): { status: DoseStatus; daysUntilDue: number } {
  const days = dayjs(dueDate).startOf("day").diff(dayjs(today).startOf("day"), "day");
  if (days < -OVERDUE_GRACE_DAYS) return { status: "overdue", daysUntilDue: days };
  if (days < 0) return { status: "overdue", daysUntilDue: days };
  if (days <= SOON_DAYS) return { status: "soon", daysUntilDue: days };
  return { status: "upcoming", daysUntilDue: days };
}

export function partitionByStatus(doses: ExpectedDose[]): {
  overdue: ExpectedDose[];
  soon: ExpectedDose[];
  upcoming: ExpectedDose[];
} {
  return {
    overdue: doses.filter((d) => d.status === "overdue"),
    soon: doses.filter((d) => d.status === "soon"),
    upcoming: doses.filter((d) => d.status === "upcoming"),
  };
}
