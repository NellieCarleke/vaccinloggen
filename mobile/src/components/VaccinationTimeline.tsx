import { useMemo, useRef } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { Syringe, Trash2 } from "lucide-react-native";

import { Card } from "./Card";
import { Text } from "./Text";
import { type Vaccination } from "../db/vaccinations";
import { vaccineLabel } from "../schedules/vaccines";
import { useVaccinations } from "../stores/vaccinationsStore";
import { t } from "../i18n/sv";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { dayjs, formatDateLong } from "../utils/dates";

interface Props {
  vaccinations: Vaccination[];
  /** When provided, used to compute "X mån" age annotation per dose */
  birthdate?: string;
}

export function VaccinationTimeline({ vaccinations, birthdate }: Props) {
  const grouped = useMemo(() => groupByYear(vaccinations), [vaccinations]);

  if (vaccinations.length === 0) {
    return (
      <Card>
        <Text tone="muted">{t("vaccination.timelineEmpty")}</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
          {t("vaccination.timelineEmptyHint")}
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.wrapper}>
      {grouped.map((group) => (
        <View key={group.year} style={styles.group}>
          <Text variant="captionBold" tone="muted" style={styles.year}>
            {group.year}
          </Text>
          <View style={styles.items}>
            {group.items.map((v) => (
              <Row key={v.id} vaccination={v} birthdate={birthdate} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Row({
  vaccination,
  birthdate,
}: {
  vaccination: Vaccination;
  birthdate?: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const remove = useVaccinations((s) => s.remove);
  const swipeRef = useRef<Swipeable>(null);
  const label =
    vaccination.vaccineCode === "OTHER" && vaccination.vaccineLabel
      ? vaccination.vaccineLabel
      : vaccineLabel(vaccination.vaccineCode, vaccination.vaccineLabel);

  const ageHint = birthdate ? ageAtDose(birthdate, vaccination.date) : null;

  function confirmDelete() {
    Alert.alert(
      t("vaccination.deleteConfirmTitle"),
      t("vaccination.deleteConfirmBody"),
      [
        {
          text: t("profile.cancel"),
          style: "cancel",
          onPress: () => swipeRef.current?.close(),
        },
        {
          text: t("profile.delete"),
          style: "destructive",
          onPress: async () => {
            await remove(vaccination.id);
          },
        },
      ],
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={() => (
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel={`Radera ${label}`}
          style={[styles.deleteAction, { backgroundColor: colors.error }]}
        >
          <Trash2 size={20} color="#fff" />
        </Pressable>
      )}
      overshootRight={false}
    >
      <Card
        onPress={() => router.push(`/vaccination/${vaccination.id}`)}
        padded={false}
        accessibilityLabel={`${label}${
          vaccination.doseNumber != null ? `, dos ${vaccination.doseNumber}` : ""
        }, ${formatDateLong(vaccination.date)}`}
        style={styles.row}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
          <Syringe size={18} color={colors.primaryDeep} />
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
              {label}
            </Text>
            {vaccination.source === "self-reported" && (
              <View style={[styles.badge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                <Text variant="caption" tone="muted" style={styles.badgeText}>
                  {t("history.selfReportedBadge")}
                </Text>
              </View>
            )}
            {vaccination.doseNumber != null && (
              <Text variant="caption" tone="accent">
                {t("vaccination.doseLabel").replace("{n}", String(vaccination.doseNumber))}
              </Text>
            )}
          </View>
          <Text variant="caption" tone="secondary">
            {formatDateLong(vaccination.date)}
            {ageHint ? ` · ${ageHint}` : ""}
            {vaccination.brand ? ` · ${vaccination.brand}` : ""}
          </Text>
          {vaccination.provider && (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {vaccination.provider}
            </Text>
          )}
        </View>
      </Card>
    </Swipeable>
  );
}

interface YearGroup {
  year: string;
  items: Vaccination[];
}

function groupByYear(list: Vaccination[]): YearGroup[] {
  const groups = new Map<string, Vaccination[]>();
  for (const v of list) {
    const year = v.date.slice(0, 4);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(v);
  }
  // already sorted DESC by date in store; preserve order
  const years: string[] = [];
  for (const v of list) {
    const y = v.date.slice(0, 4);
    if (!years.includes(y)) years.push(y);
  }
  return years.map((year) => ({ year, items: groups.get(year)! }));
}

function ageAtDose(birthdate: string, doseDate: string): string {
  const months = dayjs(doseDate).diff(dayjs(birthdate), "month");
  if (months < 0) return "";
  if (months < 24) return `${months} mån`;
  const years = dayjs(doseDate).diff(dayjs(birthdate), "year");
  return `${years} år`;
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  group: { gap: spacing.sm },
  year: { textTransform: "uppercase", letterSpacing: 0.6 },
  items: { gap: spacing.sm },
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
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase" },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    borderRadius: radii.md,
    marginLeft: spacing.sm,
  },
});
