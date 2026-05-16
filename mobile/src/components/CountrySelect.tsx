import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ChevronDown, Search, X, Check } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "./Text";
import {
  type CountryRec,
  COUNTRIES,
  regionLabel,
  searchCountries,
} from "../schedules/travel";
import { t } from "../i18n/sv";
import { radii, spacing, typography } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string | null;
}

export function CountrySelect({ value, onChange, error }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedCountries = COUNTRIES.filter((c) => value.includes(c.iso));

  return (
    <View style={styles.wrapper}>
      <Text variant="captionBold" tone="secondary" style={styles.label}>
        {t("trip.fieldDestinations")}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.button,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            minHeight: selectedCountries.length === 0 ? 44 : undefined,
          },
        ]}
      >
        {selectedCountries.length === 0 ? (
          <Text tone="muted" style={styles.placeholder}>
            {t("trip.fieldDestinationsHint")}
          </Text>
        ) : (
          <View style={styles.chips}>
            {selectedCountries.map((c) => (
              <View
                key={c.iso}
                style={[
                  styles.chip,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Text variant="caption" tone="accent">
                  {c.name}
                </Text>
              </View>
            ))}
          </View>
        )}
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
        <Picker value={value} onChange={onChange} onClose={() => setOpen(false)} />
      </Modal>
    </View>
  );
}

interface PickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}

function Picker({ value, onChange, onClose }: PickerProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCountries(query), [query]);
  const grouped = useMemo(() => groupByRegion(results), [results]);

  function toggle(iso: string) {
    onChange(value.includes(iso) ? value.filter((x) => x !== iso) : [...value, iso]);
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={styles.pickerHeader}>
        <Text variant="h2">{t("trip.fieldDestinations")}</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text variant="bodyBold" tone="accent">
            {t("profile.save")}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.surfaceMuted }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("trip.countriesSearchPlaceholder")}
          placeholderTextColor={colors.textMuted}
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
        {grouped.map((group) => (
          <View key={group.region} style={styles.group}>
            <Text variant="captionBold" tone="muted" style={styles.groupTitle}>
              {regionLabel(group.region)}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {group.items.map((c, idx) => {
                const checked = value.includes(c.iso);
                return (
                  <Pressable
                    key={c.iso}
                    onPress={() => toggle(c.iso)}
                    style={[
                      styles.row,
                      idx > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ flex: 1 }}>{c.name}</Text>
                    <View
                      style={[
                        styles.checkBox,
                        {
                          backgroundColor: checked ? colors.primary : "transparent",
                          borderColor: checked
                            ? colors.primary
                            : colors.borderStrong,
                        },
                      ]}
                    >
                      {checked && <Check size={14} color={colors.textInverse} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function groupByRegion(
  list: CountryRec[],
): { region: CountryRec["region"]; items: CountryRec[] }[] {
  const order: CountryRec["region"][] = [
    "europa",
    "norden",
    "asien",
    "afrika",
    "syd-mellanamerika",
    "nordamerika",
    "mellanostern",
    "oceanien",
  ];
  const map = new Map<CountryRec["region"], CountryRec[]>();
  for (const c of list) {
    if (!map.has(c.region)) map.set(c.region, []);
    map.get(c.region)!.push(c);
  }
  return order
    .filter((r) => map.has(r))
    .map((region) => ({
      region,
      items: map.get(region)!.slice().sort((a, b) => a.name.localeCompare(b.name)),
    }));
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
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 44,
  },
  placeholder: { flex: 1 },
  chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 56,
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
});
