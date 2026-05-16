import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { Text } from "./Text";
import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import {
  deriveExpectedDoses,
  partitionByStatus,
} from "../reminders/derive";
import { t } from "../i18n/sv";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { describeAge } from "../utils/dates";

interface Props {
  profile: Profile;
  vaccinations: Vaccination[];
  onPress: () => void;
}

export function FamilyMemberCard({ profile, vaccinations, onPress }: Props) {
  const { colors } = useTheme();

  const summary = useMemo(() => {
    const expected = deriveExpectedDoses(profile, vaccinations, new Date());
    const { overdue, soon } = partitionByStatus(expected);
    const own = vaccinations.filter((v) => v.profileId === profile.id);
    return {
      overdue: overdue.length,
      soon: soon.length,
      recorded: own.length,
      remindersOn: profile.remindersEnabled !== false,
    };
  }, [profile, vaccinations]);

  const { statusText, statusTone, dotColor } = computeStatus(summary, colors);

  return (
    <Card onPress={onPress} padded style={styles.card}>
      <Avatar name={profile.name} imageUri={profile.avatarPath} size={52} />
      <View style={styles.text}>
        <Text variant="bodyBold" numberOfLines={1}>
          {profile.name}
        </Text>
        <Text variant="caption" tone="secondary">
          {describeAge(profile.birthdate)}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text variant="caption" tone={statusTone}>
            {statusText}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Card>
  );
}

interface Summary {
  overdue: number;
  soon: number;
  recorded: number;
  remindersOn: boolean;
}

function computeStatus(
  s: Summary,
  colors: ReturnType<typeof useTheme>["colors"],
): {
  statusText: string;
  statusTone: "secondary" | "error" | "accent" | "muted";
  dotColor: string;
} {
  if (!s.remindersOn) {
    return {
      statusText: t("profile.fieldRemindersOff"),
      statusTone: "muted",
      dotColor: colors.borderStrong,
    };
  }
  if (s.overdue > 0) {
    return {
      statusText:
        s.overdue === 1
          ? t("home.statusOverdue").replace("{n}", "1")
          : t("home.statusOverduePlural").replace("{n}", String(s.overdue)),
      statusTone: "error",
      dotColor: colors.error,
    };
  }
  if (s.soon > 0) {
    return {
      statusText: t("home.statusSoon").replace("{n}", String(s.soon)),
      statusTone: "accent",
      dotColor: colors.warning,
    };
  }
  if (s.recorded === 0) {
    return {
      statusText: t("home.statusFew"),
      statusTone: "secondary",
      dotColor: colors.borderStrong,
    };
  }
  return {
    statusText: t("home.statusUpToDate"),
    statusTone: "secondary",
    dotColor: colors.success,
  };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  text: { flex: 1, gap: 2 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  dot: { width: 8, height: 8, borderRadius: radii.pill },
});
