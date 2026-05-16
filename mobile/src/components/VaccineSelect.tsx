import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "./Text";
import {
  type VaccineCategory,
  type VaccineDef,
  VACCINES,
  searchVaccines,
} from "../schedules/vaccines";
import { t } from "../i18n/sv";
import { radii, spacing, typography } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";

interface Props {
  value: string | null;
  onChange: (code: string) => void;
  error?: string | null;
}

export function VaccineSelect({ value, onChange, error }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value ? VACCINES.find((v) => v.code === value) : null;

  return (
    <View style={styles.wrapper}>
      <Text variant="captionBold" tone="secondary" style={styles.label}>
        {t("vaccination.fieldVaccine")}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.button,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Text tone={selected ? "primary" : "muted"} style={styles.buttonText}>
          {selected ? selected.label : t("vaccination.fieldVaccinePlaceholder")}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>
      {error && (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      )}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <Picker
          query={query}
          setQuery={setQuery}
          onSelect={(code) => {
            onChange(code);
            setQuery("");
            setOpen(false);
          }}
          onClose={() => {
            setQuery("");
            setOpen(false);
          }}
        />
      </Modal>
    </View>
  );
}

interface PickerProps {
  query: string;
  setQuery: (q: string) => void;
  onSelect: (code: string) => void;
  onClose: () => void;
}

function Picker({ query, setQuery, onSelect, onClose }: PickerProps) {
  const { colors } = useTheme();
  const results = useMemo(() => searchVaccines(query), [query]);
  const grouped = useMemo(() => groupByCategory(results), [results]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={styles.pickerHeader}>
        <Text variant="h2">{t("vaccination.fieldVaccine")}</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <X size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.surfaceMuted }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("vaccination.selectSearchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          autoFocus={false}
          style={[
            styles.searchInput,
            typography.body,
            { color: colors.textPrimary },
          ]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {grouped.length === 0 && (
          <Text tone="muted" align="center" style={{ padding: spacing.lg }}>
            Inga träffar.
          </Text>
        )}
        {grouped.map((group) => (
          <View key={group.category} style={styles.group}>
            <Text variant="captionBold" tone="muted" style={styles.groupTitle}>
              {sectionTitle(group.category)}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {group.items.map((v, idx) => (
                <Pressable
                  key={v.code}
                  onPress={() => onSelect(v.code)}
                  style={[
                    styles.row,
                    idx > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyBold">{v.label}</Text>
                    {v.hint && (
                      <Text variant="caption" tone="muted">
                        {v.hint}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function groupByCategory(
  list: VaccineDef[],
): { category: VaccineCategory; items: VaccineDef[] }[] {
  const order: VaccineCategory[] = ["child", "adult", "travel", "other"];
  const map = new Map<VaccineCategory, VaccineDef[]>();
  for (const v of list) {
    if (!map.has(v.category)) map.set(v.category, []);
    map.get(v.category)!.push(v);
  }
  return order
    .filter((c) => map.has(c))
    .map((category) => ({ category, items: map.get(category)! }));
}

function sectionTitle(c: VaccineCategory): string {
  switch (c) {
    case "child":
      return t("vaccination.sectionChild");
    case "adult":
      return t("vaccination.sectionAdult");
    case "travel":
      return t("vaccination.sectionTravel");
    case "other":
      return t("vaccination.sectionOther");
  }
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
    gap: spacing.sm,
  },
  buttonText: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 4 },
  list: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  group: { gap: spacing.xs, paddingHorizontal: spacing.base },
  groupTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: spacing.xs,
  },
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  row: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 56,
    justifyContent: "center",
  },
});
