// "Vad behöver jag vaccinera mig mot inför resan?"
//
// Tar destinationer, avresedatum, profil, och profilens befintliga vaccinationer.
// Returnerar en lista med rekommendationer + status + ev. "starta senast"-datum.

import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import {
  type RecommendationOutcome,
  type TravelVaccineRec,
  mergeRecommendations,
} from "../schedules/travel";
import { isStillValid } from "./validity";
import { dayjs } from "../utils/dates";

export interface TripRecommendationsInput {
  profile: Profile;
  destinations: string[];
  departDate: Date;
  vaccinations: Vaccination[];
  today?: Date;
}

export interface TripRecommendations {
  outcomes: RecommendationOutcome[];
  /** Number of doses that are missing or expired across all vaccines */
  actionItemCount: number;
  /** True if any time-critical vaccine has its startBy date in the past */
  anyOverdue: boolean;
}

export function recommendForTrip({
  profile,
  destinations,
  departDate,
  vaccinations,
  today = new Date(),
}: TripRecommendationsInput): TripRecommendations {
  const merged = mergeRecommendations(destinations);
  const profileVacs = vaccinations.filter((v) => v.profileId === profile.id);

  const outcomes: RecommendationOutcome[] = merged.map((rec) =>
    evaluate(rec, profileVacs, departDate, today),
  );

  // Order: required first, then status urgency, then alphabetic
  outcomes.sort(byUrgency);

  const actionItemCount = outcomes.filter(
    (o) => o.status === "missing" || o.status === "expired" || o.status === "incomplete",
  ).length;

  const anyOverdue = outcomes.some(
    (o) => o.startBy && dayjs(o.startBy).isBefore(dayjs(today), "day"),
  );

  return { outcomes, actionItemCount, anyOverdue };
}

function evaluate(
  rec: TravelVaccineRec,
  profileVacs: Vaccination[],
  departDate: Date,
  today: Date,
): RecommendationOutcome {
  const startBy = rec.minDaysBeforeDeparture
    ? dayjs(departDate).subtract(rec.minDaysBeforeDeparture, "day").toDate()
    : undefined;

  const validity = isStillValid(profileVacs, rec.code, today);

  if (validity.state === "valid") {
    // Already protected — but check if it expires before departure
    if (validity.expiresOn && dayjs(validity.expiresOn).isBefore(dayjs(departDate))) {
      return { rec, status: "expired", expiresOn: validity.expiresOn, startBy };
    }
    return { rec, status: "covered", expiresOn: validity.expiresOn ?? null, startBy };
  }

  if (validity.state === "expired") {
    return { rec, status: "expired", expiresOn: validity.expiredOn, startBy };
  }

  if (validity.state === "incomplete") {
    return { rec, status: "incomplete", startBy };
  }

  // unknown rule (e.g. DTP_IPV — we map to TETANUS_DIPHTHERIA validity instead)
  // Fallback: treat as missing
  return { rec, status: "missing", startBy };
}

function byUrgency(a: RecommendationOutcome, b: RecommendationOutcome): number {
  const levelRank = { required: 0, core: 1, risk: 2 } as const;
  if (levelRank[a.rec.level] !== levelRank[b.rec.level]) {
    return levelRank[a.rec.level] - levelRank[b.rec.level];
  }
  const statusRank = {
    expired: 0,
    missing: 1,
    incomplete: 2,
    covered: 3,
  } as const;
  if (statusRank[a.status] !== statusRank[b.status]) {
    return statusRank[a.status] - statusRank[b.status];
  }
  return a.rec.code.localeCompare(b.rec.code);
}
