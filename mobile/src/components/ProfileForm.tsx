import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Text } from "./Text";
import { type Profile, type ProfileInput, type Sex } from "../db/profiles";
import { t } from "../i18n/sv";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { dayjs, formatDateLong } from "../utils/dates";

const RISK_GROUPS: { key: string; label: string }[] = [
  { key: "pregnant", label: t("profile.riskPregnant") },
  { key: "immuno", label: t("profile.riskImmunoSuppressed") },
  { key: "lung", label: t("profile.riskChronicLung") },
  { key: "heart", label: t("profile.riskHeartDisease") },
  { key: "diabetes", label: t("profile.riskDiabetes") },
  { key: "age65", label: t("profile.riskAge65Plus") },
  { key: "healthcare", label: t("profile.riskHealthcareWorker") },
  { key: "tbe", label: t("profile.riskTbeZone") },
];

const SEX_OPTIONS: { key: Sex; label: string }[] = [
  { key: "F", label: t("profile.fieldSexFemale") },
  { key: "M", label: t("profile.fieldSexMale") },
  { key: "X", label: t("profile.fieldSexOther") },
];

interface Props {
  initial?: Profile;
  onSubmit: (input: ProfileInput) => Promise<void> | void;
  onCancel?: () => void;
  onDelete?: () => void;
  submitLabel?: string;
}

export function ProfileForm({
  initial,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
}: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initial?.name ?? "");
  const [birthdate, setBirthdate] = useState<Date | null>(
    initial?.birthdate ? new Date(initial.birthdate) : null,
  );
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [riskGroups, setRiskGroups] = useState<string[]>(
    initial?.riskGroups ?? [],
  );
  const [remindersEnabled, setRemindersEnabled] = useState(
    initial?.remindersEnabled ?? true,
  );
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === "ios");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; birthdate?: string }>({});

  const today = useMemo(() => new Date(), []);

  function toggleRisk(key: string) {
    setRiskGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t("validation.nameTooShort");
    if (!birthdate) next.birthdate = t("validation.required");
    else if (dayjs(birthdate).isAfter(dayjs(today)))
      next.birthdate = t("validation.futureDate");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        birthdate: dayjs(birthdate!).format("YYYY-MM-DD"),
        sex,
        riskGroups,
        remindersEnabled,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function onDateChange(_e: DateTimePickerEvent, d?: Date) {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (d) setBirthdate(d);
  }

  return (
    <View style={styles.wrapper}>
      <Input
        label={t("profile.fieldName")}
        placeholder={t("profile.fieldNamePlaceholder")}
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
        returnKeyType="next"
        testID="profile-name"
      />

      <View style={styles.field}>
        <Text variant="captionBold" tone="secondary" style={styles.label}>
          {t("profile.fieldBirthdate")}
        </Text>
        {Platform.OS === "android" ? (
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              {
                borderColor: errors.birthdate ? colors.error : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text>
              {birthdate
                ? formatDateLong(birthdate)
                : "Välj datum"}
            </Text>
          </Pressable>
        ) : null}
        {(showDatePicker || Platform.OS === "ios") && (
          <DateTimePicker
            value={birthdate ?? today}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={today}
            onChange={onDateChange}
            locale="sv-SE"
          />
        )}
        {errors.birthdate && (
          <Text variant="caption" tone="error">
            {errors.birthdate}
          </Text>
        )}
      </View>

      <View style={styles.field}>
        <Text variant="captionBold" tone="secondary" style={styles.label}>
          {t("profile.fieldSex")}
        </Text>
        <View style={styles.sexRow}>
          {SEX_OPTIONS.map((opt) => {
            const active = sex === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSex(active ? null : opt.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? colors.primaryMuted
                      : colors.surfaceMuted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  tone={active ? "accent" : "secondary"}
                  style={{ fontWeight: active ? "600" : "400" }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text variant="captionBold" tone="secondary" style={styles.label}>
          {t("profile.fieldRiskGroups")}
        </Text>
        <Text variant="caption" tone="muted" style={styles.helper}>
          {t("profile.fieldRiskGroupsHelp")}
        </Text>
        <Card padded style={styles.riskCard}>
          {RISK_GROUPS.map((rg, idx) => {
            const active = riskGroups.includes(rg.key);
            return (
              <Pressable
                key={rg.key}
                onPress={() => toggleRisk(rg.key)}
                style={[
                  styles.riskRow,
                  idx > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Text style={{ flex: 1 }}>{rg.label}</Text>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: active ? colors.primary : "transparent",
                      borderColor: active ? colors.primary : colors.borderStrong,
                    },
                  ]}
                >
                  {active && <Text tone="inverse">✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </Card>
      </View>

      <View style={styles.field}>
        <Text variant="captionBold" tone="secondary" style={styles.label}>
          {t("profile.fieldReminders")}
        </Text>
        <Card padded={false}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">
                {remindersEnabled
                  ? t("profile.fieldRemindersOn")
                  : t("profile.fieldRemindersOff")}
              </Text>
              <Text
                variant="caption"
                tone="muted"
                style={{ marginTop: spacing.xxs }}
              >
                {t("profile.fieldRemindersHelp")}
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          testID="profile-save"
        >
          {submitLabel ?? t("profile.save")}
        </Button>
        {onCancel && (
          <Button onPress={onCancel} variant="ghost" fullWidth>
            {t("profile.cancel")}
          </Button>
        )}
        {onDelete && (
          <Button onPress={onDelete} variant="ghost" fullWidth>
            <Text tone="error" variant="bodyBold">
              {t("profile.delete")}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  helper: { marginTop: -spacing.xxs },
  dateButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  sexRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  riskCard: { gap: 0, paddingVertical: 0, paddingHorizontal: 0 },
  riskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
