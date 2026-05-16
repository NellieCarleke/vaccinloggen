import { useMemo } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plane, Trash2 } from "lucide-react-native";

import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { FindClinicButton } from "@/src/components/FindClinicButton";
import { VaccineLinks } from "@/src/components/VaccineLinks";
import { findTravelClinicUrl } from "@/src/utils/findClinic";
import {
  type RecommendationOutcome,
  COUNTRIES,
  TRAVEL_DATA_VERSION,
} from "@/src/schedules/travel";
import { vaccineLabel } from "@/src/schedules/vaccines";
import { recommendForTrip } from "@/src/reminders/travel";
import { useProfiles } from "@/src/stores/profilesStore";
import { useTrips } from "@/src/stores/tripsStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { t } from "@/src/i18n/sv";
import { radii, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";
import { dayjs, formatDateLong } from "@/src/utils/dates";

export default function TripDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrips((s) => s.trips.find((tr) => tr.id === id));
  const removeTrip = useTrips((s) => s.remove);
  const profiles = useProfiles((s) => s.profiles);
  const allVaccinations = useVaccinations((s) => s.vaccinations);

  const tripProfiles = useMemo(
    () => (trip ? profiles.filter((p) => trip.profileIds.includes(p.id)) : []),
    [profiles, trip],
  );

  const tripCountries = useMemo(
    () => (trip ? trip.destinations.map((iso) => COUNTRIES.find((c) => c.iso === iso)).filter(Boolean) : []),
    [trip],
  );

  const departDate = trip ? new Date(trip.departDate) : null;
  const daysUntilDepart = departDate
    ? Math.max(0, dayjs(departDate).startOf("day").diff(dayjs().startOf("day"), "day"))
    : 0;

  function confirmDelete() {
    if (!trip) return;
    Alert.alert(
      t("trip.deleteConfirmTitle"),
      t("trip.deleteConfirmBody"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.delete"),
          style: "destructive",
          onPress: async () => {
            await removeTrip(trip.id);
            router.back();
          },
        },
      ],
    );
  }

  if (!trip || !departDate) {
    return (
      <Screen>
        <Text tone="muted">Resan hittades inte.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.heroRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
          <Plane size={28} color={colors.primaryDeep} />
        </View>
        <View style={styles.heroText}>
          <Text variant="display">
            {tripCountries.map((c) => c!.name).join(" + ")}
          </Text>
          <Text variant="body" tone="secondary">
            {formatDateLong(departDate)}
            {trip.returnDate ? ` → ${formatDateLong(trip.returnDate)}` : ""}
            {daysUntilDepart > 0
              ? ` · ${t("trip.daysUntilDepart").replace("{n}", String(daysUntilDepart))}`
              : ""}
          </Text>
        </View>
      </View>

      {tripProfiles.map((profile) => {
        const recs = recommendForTrip({
          profile,
          destinations: trip.destinations,
          departDate,
          vaccinations: allVaccinations,
          today: new Date(),
        });
        return (
          <View key={profile.id} style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <Avatar name={profile.name} imageUri={profile.avatarPath} size={36} />
              <Text variant="h2" style={{ flex: 1 }}>
                {profile.name}
              </Text>
              <Text
                variant="caption"
                tone={recs.actionItemCount > 0 ? "error" : "accent"}
                style={{ fontWeight: "600" }}
              >
                {recs.actionItemCount > 0
                  ? t("trip.actionsItems").replace(
                      "{n}",
                      String(recs.actionItemCount),
                    )
                  : t("trip.actionsClear")}
              </Text>
            </View>
            <View style={styles.recsList}>
              {recs.outcomes.map((o) => (
                <RecRow
                  key={o.rec.code}
                  outcome={o}
                  onPress={() => {
                    router.push({
                      pathname: "/vaccination/new",
                      params: {
                        profileId: profile.id,
                        prefillCode: o.rec.code,
                      },
                    });
                  }}
                />
              ))}
            </View>
          </View>
        );
      })}

      <Card style={styles.disclaimer}>
        <Text variant="caption" tone="muted">
          {t("trip.disclaimer").replace("{date}", TRAVEL_DATA_VERSION)}
        </Text>
      </Card>

      <Button
        variant="ghost"
        onPress={confirmDelete}
        style={styles.deleteBtn}
        fullWidth
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Trash2 size={16} color={colors.error} />
          <Text tone="error" variant="bodyBold">
            Ta bort resa
          </Text>
        </View>
      </Button>
    </Screen>
  );
}

function RecRow({
  outcome,
  onPress,
}: {
  outcome: RecommendationOutcome;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const statusColor = colorFor(outcome, colors);
  const statusText = textFor(outcome.status);
  const levelText = levelFor(outcome.rec.level);

  return (
    <Card onPress={onPress} padded style={styles.recRow}>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.recTop}>
          <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
            {vaccineLabel(outcome.rec.code)}
          </Text>
          <VaccineLinks vaccineCode={outcome.rec.code} compact />
          <FindClinicButton url={findTravelClinicUrl} compact />
          <Text variant="caption" tone="muted">
            {levelText}
          </Text>
        </View>
        <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
          {statusText}
        </Text>
        {outcome.startBy && (outcome.status === "missing" || outcome.status === "incomplete" || outcome.status === "expired") && (
          <Text
            variant="caption"
            tone={dayjs(outcome.startBy).isBefore(dayjs()) ? "error" : "accent"}
            style={{ marginTop: 2 }}
          >
            {t("trip.startBy").replace(
              "{date}",
              formatDateLong(outcome.startBy),
            )}
          </Text>
        )}
        {outcome.rec.reason && (
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {outcome.rec.reason}
          </Text>
        )}
      </View>
    </Card>
  );
}

function colorFor(
  outcome: RecommendationOutcome,
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  switch (outcome.status) {
    case "covered":
      return colors.success;
    case "incomplete":
      return colors.warning;
    case "expired":
    case "missing":
      return outcome.rec.level === "required" ? colors.error : colors.warning;
  }
}

function textFor(status: RecommendationOutcome["status"]): string {
  switch (status) {
    case "covered":
      return t("trip.statusCovered");
    case "incomplete":
      return t("trip.statusIncomplete");
    case "expired":
      return t("trip.statusExpired");
    case "missing":
      return t("trip.statusMissing");
  }
}

function levelFor(level: RecommendationOutcome["rec"]["level"]): string {
  switch (level) {
    case "required":
      return t("trip.levelRequired");
    case "core":
      return t("trip.levelCore");
    case "risk":
      return t("trip.levelRisk");
  }
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  profileSection: { marginTop: spacing.lg, gap: spacing.sm },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  recsList: { gap: spacing.sm },
  recRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  recTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  disclaimer: { marginTop: spacing.lg },
  deleteBtn: { marginTop: spacing.lg },
});
