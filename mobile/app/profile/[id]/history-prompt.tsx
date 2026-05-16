import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ListChecks, HelpCircle } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { bulkCreateHistoricalDoses } from "@/src/onboarding/historicalDoses";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { t } from "@/src/i18n/sv";
import { radii, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

type Choice = "full" | "partial" | "unknown" | null;

export default function HistoryPrompt() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfiles((s) => s.profiles.find((p) => p.id === id));
  const reloadVaccinations = useVaccinations((s) => s.load);
  const [busy, setBusy] = useState<Choice>(null);

  if (!profile) {
    return (
      <Screen>
        <Text tone="muted">Profilen hittades inte.</Text>
      </Screen>
    );
  }

  async function handleFull() {
    setBusy("full");
    try {
      const count = await bulkCreateHistoricalDoses(profile!);
      await reloadVaccinations();
      Alert.alert(
        t("history.title"),
        count > 0
          ? t("history.bulkResult").replace("{n}", String(count))
          : t("history.bulkResultZero"),
        [{ text: "OK", onPress: () => router.dismissAll() }],
      );
    } finally {
      setBusy(null);
    }
  }

  function handlePartial() {
    router.dismissAll();
    router.push(`/vaccination/new?profileId=${profile!.id}`);
  }

  function handleUnknown() {
    router.dismissAll();
  }

  return (
    <Screen scroll>
      <Text variant="display">{t("history.title")}</Text>
      <Text variant="body" tone="secondary" style={styles.subtitle}>
        {t("history.subtitle").replace("{name}", profile.name)}
      </Text>
      <Text variant="caption" tone="muted" style={styles.body}>
        {t("history.body")}
      </Text>

      <OptionCard
        icon={<Check size={22} color={colors.primaryDeep} />}
        iconBackground={colors.primaryMuted}
        title={t("history.optionFullTitle")}
        body={t("history.optionFullBody")}
        onPress={handleFull}
        busy={busy === "full"}
      />
      <OptionCard
        icon={<ListChecks size={22} color={colors.warning} />}
        iconBackground={colors.warningMuted}
        title={t("history.optionPartialTitle")}
        body={t("history.optionPartialBody")}
        onPress={handlePartial}
      />
      <OptionCard
        icon={<HelpCircle size={22} color={colors.textSecondary} />}
        iconBackground={colors.surfaceMuted}
        title={t("history.optionUnknownTitle")}
        body={t("history.optionUnknownBody")}
        onPress={handleUnknown}
      />

      <Button
        onPress={() => router.dismissAll()}
        variant="ghost"
        fullWidth
        style={styles.skip}
      >
        {t("history.skipButton")}
      </Button>
    </Screen>
  );
}

function OptionCard({
  icon,
  iconBackground,
  title,
  body,
  onPress,
  busy,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  body: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable onPress={busy ? undefined : onPress} style={{ opacity: busy ? 0.6 : 1 }}>
      <Card padded style={styles.option}>
        <View style={[styles.optionIcon, { backgroundColor: iconBackground }]}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">{title}</Text>
          <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
            {body}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: spacing.xs },
  body: { marginTop: spacing.sm, marginBottom: spacing.lg },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  skip: { marginTop: spacing.lg },
});
