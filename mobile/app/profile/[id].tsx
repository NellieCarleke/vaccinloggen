import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Plus, Share2 } from "lucide-react-native";

import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { ExpectedDoseList } from "@/src/components/ExpectedDoseList";
import { Header } from "@/src/components/Header";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { VaccinationTimeline } from "@/src/components/VaccinationTimeline";
import { t } from "@/src/i18n/sv";
import {
  deriveExpectedDoses,
  partitionByStatus,
} from "@/src/reminders/derive";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";
import { describeAge, formatDateLong } from "@/src/utils/dates";

export default function ProfileDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfiles((s) => s.profiles.find((p) => p.id === id));
  const allVaccinations = useVaccinations((s) => s.vaccinations);

  const vaccinations = useMemo(
    () => (profile ? allVaccinations.filter((v) => v.profileId === profile.id) : []),
    [allVaccinations, profile],
  );

  const expected = useMemo(() => {
    if (!profile) return null;
    return partitionByStatus(
      deriveExpectedDoses(profile, allVaccinations, new Date()),
    );
  }, [profile, allVaccinations]);

  if (!profile || !expected) {
    return (
      <Screen>
        <Header title="Profil" />
        <Text tone="muted">Profilen hittades inte.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.heroRow}>
        <Avatar name={profile.name} imageUri={profile.avatarPath} size={88} />
        <View style={styles.heroText}>
          <Text variant="display">{profile.name}</Text>
          <Text variant="body" tone="secondary">
            {describeAge(profile.birthdate)} · född {formatDateLong(profile.birthdate)}
          </Text>
        </View>
      </View>

      <Button
        onPress={() => router.push(`/vaccination/new?profileId=${profile.id}`)}
        style={styles.cta}
        fullWidth
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Plus size={18} color={colors.textInverse} />
          <Text variant="bodyBold" tone="inverse">
            {t("vaccination.addCta")}
          </Text>
        </View>
      </Button>

      {expected.overdue.length > 0 && (
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            {t("expected.sectionOverdue")}
          </Text>
          <ExpectedDoseList
            doses={expected.overdue}
            profileId={profile.id}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          {t("expected.sectionUpcoming")}
        </Text>
        <ExpectedDoseList
          doses={expected.soon.slice(0, 8)}
          profileId={profile.id}
        />
      </View>

      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          Vaccinationskort
        </Text>
        <VaccinationTimeline
          vaccinations={vaccinations}
          birthdate={profile.birthdate}
        />
      </View>

      {profile.riskGroups.length > 0 && (
        <Card style={styles.card}>
          <Text variant="captionBold" tone="secondary">
            RISKGRUPPER
          </Text>
          <Text style={styles.cardBody}>{profile.riskGroups.join(", ")}</Text>
        </Card>
      )}

      <View style={styles.actionRow}>
        <Button
          variant="secondary"
          onPress={() => router.push(`/profile/${profile.id}/edit`)}
          fullWidth
          style={styles.actionBtn}
        >
          <View style={styles.actionInner}>
            <Pencil size={16} color={colors.textPrimary} />
            <Text variant="bodyBold">{t("profile.edit")}</Text>
          </View>
        </Button>
        <Button
          variant="secondary"
          onPress={() => router.push(`/profile/${profile.id}/share`)}
          fullWidth
          style={styles.actionBtn}
        >
          <View style={styles.actionInner}>
            <Share2 size={16} color={colors.textPrimary} />
            <Text variant="bodyBold">{t("share.title")}</Text>
          </View>
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    paddingVertical: spacing.md,
  },
  heroText: { flex: 1 },
  cta: { marginTop: spacing.md },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { marginBottom: spacing.xs },
  card: { marginTop: spacing.md, gap: spacing.xs },
  cardBody: { marginTop: spacing.xs },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: { flex: 1 },
  actionInner: { flexDirection: "row", alignItems: "center", gap: 8 },
});
