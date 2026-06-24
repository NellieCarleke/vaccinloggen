// Lokala påminnelser via expo-notifications. Inga push-server, ingen molntjänst.
//
// Varje förväntad dos genererar 0..N notifieringar — en per lead-day
// (default [30, 7, 0]) som inte ligger i det förflutna. Vid varje data-ändring:
//   1. Avboka alla nu-schemalagda Vaccinloggen-notiser
//   2. Boka om dem från det aktuella ExpectedDose-resultatet
//
// Idempotent: anropa rescheduleAll() närhelst en profil eller vaccination
// skapas/ändras/tas bort.

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import { deriveExpectedDoses, type ExpectedDose } from "./derive";
import { vaccineLabel } from "../schedules/vaccines";
import { dayjs } from "../utils/dates";

const NOTIFICATION_KIND = "vaccinloggen-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let configured = false;

async function configureChannel(): Promise<void> {
  if (Platform.OS === "android" && !configured) {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Påminnelser",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
    });
    configured = true;
  }
}

/**
 * Returnerar nuvarande tillstånd UTAN att trigga systemprompten. Säker att
 * anropa i bakgrunden (t.ex. vid app-start).
 */
export async function hasNotificationPermission(): Promise<boolean> {
  await configureChannel();
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

/**
 * Triggar systemprompten om vi får (canAskAgain). iOS visar prompten EN gång
 * per installation — anropa bara från explicit användarhandling efter att
 * användaren sett en primer som förklarar varför vi vill skicka påminnelser.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  await configureChannel();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (settings.canAskAgain === false) return false;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return req.granted;
}

interface ScheduleData {
  profileId: string;
  doseKey: string;
}

export async function rescheduleAll(
  profiles: Profile[],
  vaccinations: Vaccination[],
  today = new Date(),
): Promise<void> {
  // Trigga ALDRIG systemprompten från bakgrunds-reschedulering. Om
  // användaren ännu inte sagt ja schemaläggs inga notiser; så snart de
  // beviljat behörighet via primer-flödet kommer nästa rescheduleAll
  // (vid första data-ändring efteråt) att fylla på.
  const granted = await hasNotificationPermission();
  if (!granted) return;

  // Cancel all our previously scheduled notifications. Filter by content data
  // tag so we don't trample notifications scheduled by other parts of the app.
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => {
        const data = n.content?.data as { doseKey?: unknown } | undefined;
        return typeof data?.doseKey === "string";
      })
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  for (const profile of profiles) {
    if (profile.remindersEnabled === false) continue;
    const expected = deriveExpectedDoses(profile, vaccinations, today);
    const upcoming = expected.filter((d) => d.status !== "overdue");
    for (const dose of upcoming) {
      await scheduleForDose(profile, dose, today);
    }
  }
}

async function scheduleForDose(
  profile: Profile,
  dose: ExpectedDose,
  today: Date,
): Promise<void> {
  const lead = profile.reminderLeadDays.length
    ? profile.reminderLeadDays
    : [30, 7, 0];
  const dueAtNoon = dayjs(dose.dueDate).startOf("day").add(9, "hour"); // 09:00 lokal tid

  for (const days of lead) {
    const fireAt = dueAtNoon.subtract(days, "day").toDate();
    if (fireAt.getTime() <= today.getTime()) continue; // ingen tidsmaskin

    const title = formatTitle(profile, dose);
    const body = formatBody(dose, days);
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { profileId: profile.id, doseKey: dose.key } satisfies ScheduleData,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
  }
}

function formatTitle(profile: Profile, dose: ExpectedDose): string {
  return `${profile.name} — ${vaccineLabel(dose.code)}`;
}

function formatBody(dose: ExpectedDose, leadDays: number): string {
  const doseLabel = dose.doseNumber != null ? `dos ${dose.doseNumber}` : "dos";
  const dueIn =
    leadDays === 0
      ? "idag"
      : leadDays === 1
        ? "imorgon"
        : `om ${leadDays} dagar`;
  return `Dags att boka ${doseLabel} ${dueIn}.`;
}
