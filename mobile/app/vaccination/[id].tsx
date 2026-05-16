import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Syringe } from "lucide-react-native";

import { AttachmentList } from "@/src/components/AttachmentList";
import { AttachmentPicker } from "@/src/components/AttachmentPicker";
import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { VaccineLinks } from "@/src/components/VaccineLinks";
import { type Attachment, listAttachments } from "@/src/db/attachments";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { vaccineLabel } from "@/src/schedules/vaccines";
import { t } from "@/src/i18n/sv";
import { radii, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";
import { formatDateLong } from "@/src/utils/dates";

export default function VaccinationDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vaccination = useVaccinations((s) =>
    s.vaccinations.find((v) => v.id === id),
  );
  const remove = useVaccinations((s) => s.remove);
  const profile = useProfiles((s) =>
    vaccination ? s.profiles.find((p) => p.id === vaccination.profileId) : null,
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const reloadAttachments = useCallback(async () => {
    if (!id) return;
    setAttachments(await listAttachments(id));
  }, [id]);

  useEffect(() => {
    void reloadAttachments();
  }, [reloadAttachments]);

  // Refresh when returning to this screen (e.g. after picking a file)
  useFocusEffect(
    useCallback(() => {
      void reloadAttachments();
    }, [reloadAttachments]),
  );

  if (!vaccination) {
    return (
      <Screen>
        <Text tone="muted">Vaccinationen hittades inte.</Text>
      </Screen>
    );
  }

  const label =
    vaccination.vaccineCode === "OTHER" && vaccination.vaccineLabel
      ? vaccination.vaccineLabel
      : vaccineLabel(vaccination.vaccineCode, vaccination.vaccineLabel);

  function confirmDelete() {
    Alert.alert(
      t("vaccination.deleteConfirmTitle"),
      t("vaccination.deleteConfirmBody"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.delete"),
          style: "destructive",
          onPress: async () => {
            await remove(vaccination!.id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Screen scroll>
      <View style={styles.heroRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
          <Syringe size={28} color={colors.primaryDeep} />
        </View>
        <View style={styles.heroText}>
          <Text variant="display">{label}</Text>
          {profile && (
            <Text variant="body" tone="secondary">
              {profile.name}
            </Text>
          )}
        </View>
      </View>

      <Card style={styles.card}>
        <Field label="Datum" value={formatDateLong(vaccination.date)} />
        {vaccination.doseNumber != null && (
          <Field
            label="Dosnummer"
            value={String(vaccination.doseNumber)}
            divider
          />
        )}
        {vaccination.brand && (
          <Field label="Fabrikat" value={vaccination.brand} divider />
        )}
        {vaccination.provider && (
          <Field label="Vårdgivare" value={vaccination.provider} divider />
        )}
        {vaccination.batch && (
          <Field label="Batch" value={vaccination.batch} divider />
        )}
      </Card>

      {vaccination.notes && (
        <Card style={styles.card}>
          <Text variant="captionBold" tone="secondary" style={styles.cardLabel}>
            ANTECKNINGAR
          </Text>
          <Text style={{ marginTop: spacing.xs }}>{vaccination.notes}</Text>
        </Card>
      )}

      <View style={styles.section}>
        <VaccineLinks vaccineCode={vaccination.vaccineCode} />
      </View>

      <View style={styles.section}>
        <Text variant="h3">{t("attachment.sectionTitle")}</Text>
        <AttachmentList
          attachments={attachments}
          onDeleted={() => void reloadAttachments()}
        />
        <AttachmentPicker
          vaccinationId={vaccination.id}
          onAdded={() => void reloadAttachments()}
        />
      </View>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          onPress={() => router.push(`/vaccination/${vaccination.id}/edit`)}
          fullWidth
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pencil size={16} color={colors.textPrimary} />
            <Text variant="bodyBold">{t("vaccination.edit")}</Text>
          </View>
        </Button>
        <Button variant="ghost" onPress={confirmDelete} fullWidth>
          <Text tone="error" variant="bodyBold">
            {t("profile.delete")}
          </Text>
        </Button>
      </View>
    </Screen>
  );
}

function Field({
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
        styles.fieldRow,
        divider && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}
    >
      <Text variant="caption" tone="muted" style={styles.fieldLabel}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ flex: 1 }}>{value}</Text>
    </View>
  );
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
  card: { marginTop: spacing.md, padding: 0 },
  cardLabel: { letterSpacing: 0.6, padding: spacing.base, paddingBottom: 0 },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  fieldLabel: { width: 100, letterSpacing: 0.6 },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
