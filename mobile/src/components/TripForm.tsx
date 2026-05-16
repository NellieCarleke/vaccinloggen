import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Card } from "./Card";
import { CountrySelect } from "./CountrySelect";
import { DateField } from "./DateField";
import { Input } from "./Input";
import { Text } from "./Text";
import { type Profile } from "../db/profiles";
import { type TripInput } from "../db/trips";
import { useProfiles } from "../stores/profilesStore";
import { t } from "../i18n/sv";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { dayjs } from "../utils/dates";

interface Props {
  onSubmit: (input: TripInput) => Promise<void>;
  onCancel?: () => void;
}

export function TripForm({ onSubmit, onCancel }: Props) {
  const { colors } = useTheme();
  const profiles = useProfiles((s) => s.profiles);

  const [destinations, setDestinations] = useState<string[]>([]);
  const [departDate, setDepartDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [profileIds, setProfileIds] = useState<string[]>(
    profiles.length > 0 ? [profiles[0].id] : [],
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    destinations?: string;
    departDate?: string;
    profiles?: string;
  }>({});

  const today = useMemo(() => new Date(), []);

  function toggleProfile(id: string) {
    setProfileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (destinations.length === 0)
      next.destinations = t("validation.required");
    if (!departDate) next.departDate = t("validation.required");
    if (profileIds.length === 0) next.profiles = t("validation.required");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        destinations,
        departDate: dayjs(departDate!).format("YYYY-MM-DD"),
        returnDate: returnDate ? dayjs(returnDate).format("YYYY-MM-DD") : null,
        profileIds,
        notes: notes.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <CountrySelect
        value={destinations}
        onChange={setDestinations}
        error={errors.destinations}
      />

      <DateField
        label={t("trip.fieldDepartDate")}
        value={departDate}
        onChange={setDepartDate}
        minimumDate={today}
        error={errors.departDate}
      />

      <DateField
        label={t("trip.fieldReturnDate")}
        value={returnDate}
        onChange={setReturnDate}
        minimumDate={departDate ?? today}
      />

      <View style={styles.field}>
        <Text variant="captionBold" tone="secondary" style={styles.label}>
          {t("trip.fieldProfiles")}
        </Text>
        <Card padded={false}>
          {profiles.map((p, idx) => {
            const active = profileIds.includes(p.id);
            return (
              <ProfileRow
                key={p.id}
                profile={p}
                active={active}
                onToggle={() => toggleProfile(p.id)}
                showDivider={idx > 0}
              />
            );
          })}
        </Card>
        {errors.profiles && (
          <Text variant="caption" tone="error">
            {errors.profiles}
          </Text>
        )}
      </View>

      <Input
        label={t("trip.fieldNotes")}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80 }}
      />

      <View style={styles.actions}>
        <Button onPress={handleSubmit} loading={submitting} fullWidth>
          {t("trip.save")}
        </Button>
        {onCancel && (
          <Button onPress={onCancel} variant="ghost" fullWidth>
            {t("profile.cancel")}
          </Button>
        )}
      </View>
    </View>
  );
}

function ProfileRow({
  profile,
  active,
  onToggle,
  showDivider,
}: {
  profile: Profile;
  active: boolean;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.profileRow,
        showDivider && {
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
      ]}
    >
      <Avatar name={profile.name} imageUri={profile.avatarPath} size={36} />
      <Text style={{ flex: 1 }}>{profile.name}</Text>
      <View
        style={[
          styles.checkBox,
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
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
