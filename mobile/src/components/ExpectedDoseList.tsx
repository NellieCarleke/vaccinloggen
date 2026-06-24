import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Calendar, Plus } from "lucide-react-native";

import { Card } from "./Card";
import { FindClinicButton } from "./FindClinicButton";
import { Text } from "./Text";
import { type ExpectedDose, type DoseStatus } from "../reminders/derive";
import { formatTiming } from "../reminders/doseTiming";
import { vaccineLabel } from "../schedules/vaccines";
import { type ReasonKey } from "../schedules/child-program";
import { findClinicUrlFor } from "../utils/findClinic";
import { t } from "../i18n/sv";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";

interface Props {
  doses: ExpectedDose[];
  profileId: string;
  emptyMessage?: string;
}

export function ExpectedDoseList({ doses, profileId, emptyMessage }: Props) {
  if (doses.length === 0) {
    return (
      <Card>
        <Text tone="muted">{emptyMessage ?? t("expected.noUpcoming")}</Text>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {doses.map((d) => (
        <ExpectedRow key={d.key} dose={d} profileId={profileId} />
      ))}
    </View>
  );
}

function ExpectedRow({
  dose,
  profileId,
}: {
  dose: ExpectedDose;
  profileId: string;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const { bg, fg } = statusColors(dose.status, colors);

  function onPress() {
    router.push({
      pathname: "/vaccination/new",
      params: {
        profileId,
        prefillCode: dose.code,
        ...(dose.doseNumber != null
          ? { prefillDose: String(dose.doseNumber) }
          : {}),
      },
    });
  }

  return (
    <Card
      onPress={onPress}
      padded={false}
      accessibilityLabel={`Registrera ${vaccineLabel(dose.code)}${
        dose.doseNumber != null ? `, dos ${dose.doseNumber}` : ""
      }. ${formatTiming(dose)}`}
      style={styles.row}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Calendar size={18} color={fg} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
            {vaccineLabel(dose.code)}
          </Text>
          {dose.doseNumber != null && (
            <Text variant="caption" tone="accent">
              {`Dos ${dose.doseNumber}`}
            </Text>
          )}
        </View>
        <Text variant="caption" tone="secondary">
          {formatTiming(dose)}
        </Text>
        <Text variant="caption" tone="muted">
          {reasonLabel(dose.reason)}
        </Text>
      </View>
      <FindClinicButton url={findClinicUrlFor(dose.reason)} compact />
      <Plus size={18} color={colors.textMuted} />
    </Card>
  );
}

function statusColors(
  status: DoseStatus,
  colors: ReturnType<typeof useTheme>["colors"],
): { bg: string; fg: string } {
  switch (status) {
    case "overdue":
      return { bg: colors.errorMuted, fg: colors.error };
    case "soon":
      return { bg: colors.warningMuted, fg: colors.warning };
    case "upcoming":
      return { bg: colors.primaryMuted, fg: colors.primaryDeep };
  }
}

function reasonLabel(r: ReasonKey): string {
  switch (r) {
    case "barnprogram-bvc":
      return t("expected.reasonBvc");
    case "barnprogram-skola":
      return t("expected.reasonSchool");
    case "tbe-series":
    case "tbe-booster":
      return t("expected.reasonTbe");
    case "tetanus-booster":
      return t("expected.reasonTetanus");
    case "flu-season":
      return t("expected.reasonFlu");
    case "covid-season":
      return t("expected.reasonCovid");
    case "adult-other":
      return t("expected.reasonAdult");
  }
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 2 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
