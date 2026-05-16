import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Plane, Plus, Settings as SettingsIcon } from "lucide-react-native";
import { Pressable } from "react-native";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { EmptyState } from "@/src/components/EmptyState";
import { FamilyMemberCard } from "@/src/components/FamilyMemberCard";
import { Header } from "@/src/components/Header";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { COUNTRIES } from "@/src/schedules/travel";
import { t } from "@/src/i18n/sv";
import { useProfiles } from "@/src/stores/profilesStore";
import { useTrips } from "@/src/stores/tripsStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";
import { dayjs, formatDateLong } from "@/src/utils/dates";

export default function Home() {
  const { colors } = useTheme();
  const router = useRouter();
  const profiles = useProfiles((s) => s.profiles);
  const allVaccinations = useVaccinations((s) => s.vaccinations);
  const trips = useTrips((s) => s.trips);
  const upcomingTrips = useMemo(
    () =>
      trips.filter((tr) => !dayjs(tr.departDate).isBefore(dayjs(), "day")),
    [trips],
  );

  if (profiles.length === 0) {
    return (
      <Screen>
        <Header title={t("app.name")} subtitle={t("app.tagline")} />
        <EmptyState
          title={t("home.welcomeTitle")}
          body={t("home.welcomeBody")}
          action={
            <View style={styles.welcomeActions}>
              <Button
                onPress={() => router.push("/profile/new")}
                fullWidth
                testID="welcome-create-profile"
              >
                {t("home.welcomeAction")}
              </Button>
              <Button
                onPress={() => router.push("/import")}
                variant="ghost"
                fullWidth
                testID="welcome-import"
              >
                {t("share.importCta")}
              </Button>
            </View>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header
        title={t("app.name")}
        subtitle={t("home.subtitle")}
        trailing={
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push("/settings" as any)}
            hitSlop={12}
            style={{ padding: spacing.xs }}
          >
            <SettingsIcon size={22} color={colors.textSecondary} />
          </Pressable>
        }
      />

      <View style={styles.section}>
        <Text variant="captionBold" tone="muted" style={styles.sectionLabel}>
          {t("home.sectionFamily")}
        </Text>
        <View style={styles.list}>
          {profiles.map((p) => (
            <FamilyMemberCard
              key={p.id}
              profile={p}
              vaccinations={allVaccinations}
              onPress={() => router.push(`/profile/${p.id}`)}
            />
          ))}
        </View>
        <Button
          onPress={() => router.push("/profile/new")}
          variant="secondary"
          fullWidth
          style={styles.addBtn}
        >
          <View style={styles.btnInner}>
            <Plus size={18} color={colors.textPrimary} />
            <Text variant="bodyBold">{t("home.addProfile")}</Text>
          </View>
        </Button>
      </View>

      {upcomingTrips.length > 0 && (
        <View style={styles.section}>
          <Text variant="captionBold" tone="muted" style={styles.sectionLabel}>
            {t("trip.yourTrips")}
          </Text>
          <View style={styles.list}>
            {upcomingTrips.map((tr) => (
              <Card
                key={tr.id}
                onPress={() => router.push(`/trip/${tr.id}`)}
                style={styles.tripCard}
              >
                <Plane size={20} color={colors.primaryDeep} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold">
                    {tr.destinations
                      .map((iso) =>
                        COUNTRIES.find((c) => c.iso === iso)?.name ?? iso,
                      )
                      .join(" + ")}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    {formatDateLong(tr.departDate)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      <Button
        onPress={() => router.push("/trip/new")}
        variant="secondary"
        fullWidth
        style={styles.bottomBtn}
        testID="home-add-trip"
      >
        <View style={styles.btnInner}>
          <Plane size={18} color={colors.textPrimary} />
          <Text variant="bodyBold">{t("trip.addCta")}</Text>
        </View>
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  list: { gap: spacing.sm },
  addBtn: { marginTop: spacing.sm },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  tripCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  bottomBtn: { marginTop: spacing.xl },
  welcomeActions: { gap: spacing.sm, width: 280 },
});
