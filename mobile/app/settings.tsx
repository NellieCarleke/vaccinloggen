import { ReactNode } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ChevronRight, ExternalLink, Trash2, Upload } from "lucide-react-native";

import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { TRAVEL_DATA_VERSION } from "@/src/schedules/travel";
import { getActiveScheduleInfo } from "@/src/schedules/remote-refresh";
import { wipeAllUserData } from "@/src/db/wipe";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { useTrips } from "@/src/stores/tripsStore";
import { t } from "@/src/i18n/sv";
import { radii, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function Settings() {
  const { colors } = useTheme();
  const router = useRouter();
  const reloadProfiles = useProfiles((s) => s.load);
  const reloadVaccinations = useVaccinations((s) => s.load);
  const reloadTrips = useTrips((s) => s.load);
  const version = Constants.expoConfig?.version ?? "0.1.0";

  function confirmWipe() {
    Alert.alert(
      "Rensa alla data?",
      "Det här raderar alla profiler, vaccinationer, resor och bilagor från enheten. Det går inte att ångra.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Fortsätt",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Säker?",
              "Tryck Radera för att bekräfta. Allt försvinner permanent.",
              [
                { text: "Avbryt", style: "cancel" },
                {
                  text: "Radera",
                  style: "destructive",
                  onPress: async () => {
                    await wipeAllUserData();
                    await Promise.all([
                      reloadProfiles(),
                      reloadVaccinations(),
                      reloadTrips(),
                    ]);
                    Alert.alert("Klart", "All data har raderats.");
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }
  const schedule = getActiveScheduleInfo();
  const scheduleLabel = `${schedule.version} (${
    schedule.origin === "bundled"
      ? "inbäddad"
      : schedule.origin === "cached"
      ? "uppdaterad"
      : "live"
  })`;

  return (
    <Screen scroll>
      <Section title={t("settings.sectionAbout")}>
        <Card padded={false}>
          <KeyValueRow label={t("settings.aboutVersion")} value={version} />
          <KeyValueRow
            label={t("settings.aboutScheduleData")}
            value={TRAVEL_DATA_VERSION}
            divider
          />
          <KeyValueRow
            label="Vaccinationsscheman"
            value={scheduleLabel}
            divider
          />
        </Card>
        <Text variant="caption" tone="muted" style={styles.helper}>
          {t("settings.aboutSourcesText")}
        </Text>
      </Section>

      <Section title={t("settings.sectionPrivacy")}>
        <Card>
          <Text>{t("settings.privacyBody")}</Text>
        </Card>
        <Card padded={false} style={{ marginTop: spacing.sm }}>
          <ActionRow
            icon={<ExternalLink size={20} color={colors.primaryDeep} />}
            iconBackground={colors.primaryMuted}
            title="Visa fullständig integritetspolicy"
            subtitle="Öppnas i webbläsare"
            onPress={() =>
              void Linking.openURL(
                "https://nelliecarleke.github.io/vaccinloggen/privacy.html",
              )
            }
          />
        </Card>
      </Section>

      <Section title={t("settings.sectionData")}>
        <Card padded={false}>
          <ActionRow
            icon={<Upload size={20} color={colors.primaryDeep} />}
            iconBackground={colors.primaryMuted}
            title={t("settings.dataImport")}
            subtitle={t("settings.dataImportHint")}
            onPress={() => router.push("/import")}
          />
          <ActionRow
            icon={<Trash2 size={20} color={colors.error} />}
            iconBackground={colors.surfaceMuted}
            title="Rensa alla data"
            subtitle="Radera profiler, vaccinationer, resor och bilagor från enheten."
            onPress={confirmWipe}
            divider
          />
        </Card>
      </Section>

      <Section title={t("settings.sectionLegal")}>
        <Card>
          <Text variant="bodyBold" style={{ marginBottom: spacing.xs }}>
            {t("settings.legalDisclaimer")}
          </Text>
          <Text variant="caption" tone="secondary">
            {t("settings.legalDisclaimerBody")}
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="captionBold" tone="muted" style={styles.sectionLabel}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function KeyValueRow({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.kvRow,
        divider && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}
    >
      <Text style={{ flex: 1 }}>{label}</Text>
      <Text tone="secondary">{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  iconBackground,
  title,
  subtitle,
  onPress,
  divider,
}: {
  icon: ReactNode;
  iconBackground: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.actionRow,
      divider && { borderTopWidth: 1, borderTopColor: colors.border },
      pressed && { opacity: 0.85 },
    ]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold">{title}</Text>
        {subtitle && (
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  helper: { paddingHorizontal: spacing.xs },
  kvRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
