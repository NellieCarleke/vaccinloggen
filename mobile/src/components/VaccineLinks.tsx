import { Pressable, StyleSheet, View } from "react-native";
import { ExternalLink } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";

import { Text } from "./Text";
import { vaccineInfoLinks } from "../schedules/vaccines";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";

interface Props {
  vaccineCode: string;
  /** Compact: just an icon button. Default: chip-row with source labels. */
  compact?: boolean;
}

export function VaccineLinks({ vaccineCode, compact }: Props) {
  const { colors } = useTheme();
  const links = vaccineInfoLinks(vaccineCode);
  if (links.length === 0) return null;

  if (compact) {
    // Open the first available link directly
    const primary = links[0];
    return (
      <Pressable
        onPress={() => WebBrowser.openBrowserAsync(primary.url)}
        hitSlop={6}
        style={styles.compactBtn}
      >
        <ExternalLink size={16} color={colors.primary} />
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <Text variant="captionBold" tone="muted" style={styles.label}>
        LÄS MER
      </Text>
      <View style={styles.chips}>
        {links.map((l) => (
          <Pressable
            key={l.url}
            onPress={() => WebBrowser.openBrowserAsync(l.url)}
            style={[
              styles.chip,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primary,
              },
            ]}
          >
            <ExternalLink size={12} color={colors.primaryDeep} />
            <Text
              variant="caption"
              style={{ color: colors.primaryDeep, fontWeight: "600" }}
            >
              {l.source}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  compactBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
