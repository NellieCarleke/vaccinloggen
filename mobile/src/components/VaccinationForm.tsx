import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AttachmentPicker, type PickedAttachment } from "./AttachmentPicker";
import { PendingAttachmentList } from "./PendingAttachmentList";
import { Button } from "./Button";
import { Card } from "./Card";
import { DateField } from "./DateField";
import { Input } from "./Input";
import { Text } from "./Text";
import { VaccineSelect } from "./VaccineSelect";
import { type Vaccination, type VaccinationInput } from "../db/vaccinations";
import { type AttachmentKind } from "../db/attachments";
import { getVaccine } from "../schedules/vaccines";
import { t } from "../i18n/sv";
import { spacing } from "../theme/tokens";
import { dayjs } from "../utils/dates";

export interface PendingAttachment {
  kind: AttachmentKind;
  /** Relative path (already persisted to documents/attachments/) */
  path: string;
}

interface Props {
  profileId: string;
  initial?: Vaccination;
  prefillCode?: string;
  prefillDose?: number;
  /** When true, show inline attachment picker that captures pending attachments
   *  to commit on save. Used in the create flow. */
  allowAttachments?: boolean;
  onSubmit: (
    input: VaccinationInput,
    attachments: PendingAttachment[],
  ) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
  submitLabel?: string;
}

export function VaccinationForm({
  profileId,
  initial,
  prefillCode,
  prefillDose,
  allowAttachments,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
}: Props) {
  const [vaccineCode, setVaccineCode] = useState<string | null>(
    initial?.vaccineCode ?? prefillCode ?? null,
  );
  const [vaccineLabel, setVaccineLabel] = useState(initial?.vaccineLabel ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [date, setDate] = useState<Date | null>(
    initial?.date ? new Date(initial.date) : null,
  );
  const [doseStr, setDoseStr] = useState(
    initial?.doseNumber
      ? String(initial.doseNumber)
      : prefillDose != null
        ? String(prefillDose)
        : "",
  );
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [batch, setBatch] = useState(initial?.batch ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    vaccine?: string;
    date?: string;
    dose?: string;
    label?: string;
  }>({});

  const today = useMemo(() => new Date(), []);
  const selected = vaccineCode ? getVaccine(vaccineCode) : null;
  const isFreeText = vaccineCode === "OTHER";

  function validate(): boolean {
    const next: typeof errors = {};
    if (!vaccineCode) next.vaccine = t("validation.required");
    if (isFreeText && !vaccineLabel.trim())
      next.label = t("validation.required");
    if (!date) next.date = t("validation.required");
    else if (dayjs(date).isAfter(dayjs(today), "day"))
      next.date = t("validation.futureDose");
    if (doseStr.trim()) {
      const d = parseInt(doseStr, 10);
      if (Number.isNaN(d) || d < 1) next.dose = t("validation.invalidDose");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const dose = doseStr.trim() ? parseInt(doseStr, 10) : null;
      await onSubmit(
        {
          profileId,
          vaccineCode: vaccineCode!,
          vaccineLabel: isFreeText ? vaccineLabel.trim() : null,
          brand: brand.trim() || null,
          doseNumber: dose,
          date: dayjs(date!).format("YYYY-MM-DD"),
          provider: provider.trim() || null,
          batch: batch.trim() || null,
          notes: notes.trim() || null,
        },
        pending,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handlePicked(picked: PickedAttachment) {
    setPending((prev) => [...prev, { kind: picked.kind, path: picked.path }]);
  }

  function removePending(path: string) {
    setPending((prev) => prev.filter((p) => p.path !== path));
  }

  return (
    <View style={styles.wrapper}>
      <VaccineSelect
        value={vaccineCode}
        onChange={(code) => {
          setVaccineCode(code);
          if (code !== "OTHER") setVaccineLabel("");
        }}
        error={errors.vaccine}
      />

      {isFreeText && (
        <Input
          label={t("vaccination.fieldVaccineFreeText")}
          value={vaccineLabel}
          onChangeText={setVaccineLabel}
          error={errors.label}
        />
      )}

      <DateField
        label={t("vaccination.fieldDate")}
        value={date}
        onChange={setDate}
        maximumDate={today}
        error={errors.date}
      />

      <Input
        label={t("vaccination.fieldDose")}
        value={doseStr}
        onChangeText={setDoseStr}
        placeholder={t("vaccination.fieldDosePlaceholder")}
        keyboardType="number-pad"
        error={errors.dose}
      />

      <Input
        label={t("vaccination.fieldBrandOptional")}
        value={brand}
        onChangeText={setBrand}
        placeholder={
          selected?.brands[0]
            ? `T.ex. ${selected.brands[0]}`
            : t("vaccination.fieldBrandPlaceholder")
        }
        autoCapitalize="words"
      />
      {selected && selected.brands.length > 0 && (
        <Text variant="caption" tone="muted" style={styles.brandsHint}>
          Vanliga: {selected.brands.join(", ")}
        </Text>
      )}

      <Input
        label={t("vaccination.fieldProvider")}
        value={provider}
        onChangeText={setProvider}
        placeholder={t("vaccination.fieldProviderPlaceholder")}
      />

      <Input
        label={t("vaccination.fieldBatch")}
        value={batch}
        onChangeText={setBatch}
        placeholder={t("vaccination.fieldBatchPlaceholder")}
        helper={t("vaccination.fieldBatchHelp")}
        autoCapitalize="characters"
      />

      <Input
        label={t("vaccination.fieldNotes")}
        value={notes}
        onChangeText={setNotes}
        placeholder={t("vaccination.fieldNotesPlaceholder")}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80 }}
      />

      {allowAttachments && (
        <View style={styles.attachmentSection}>
          <Text variant="captionBold" tone="secondary" style={styles.label}>
            {t("vaccination.sectionAttachments")}
          </Text>
          <Text variant="caption" tone="muted">
            {t("vaccination.attachmentsHint")}
          </Text>
          {pending.length > 0 && (
            <PendingAttachmentList
              attachments={pending}
              onRemove={removePending}
            />
          )}
          <AttachmentPicker mode="pending" onPicked={handlePicked} />
        </View>
      )}

      <View style={styles.actions}>
        <Button onPress={handleSubmit} loading={submitting} fullWidth>
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
  brandsHint: { marginTop: -spacing.md },
  attachmentSection: { gap: spacing.sm },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
