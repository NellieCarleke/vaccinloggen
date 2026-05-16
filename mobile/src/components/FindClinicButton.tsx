import { Pressable, StyleSheet, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { Text } from "./Text";
import { openFindClinic } from "../utils/findClinic";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";

interface Props {
  url: string;
  /** compact = icon only; default = chip with label */
  compact?: boolean;
}

export function FindClinicButton({ url, compact }: Props) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <Pressable
        onPress={() => openFindClinic(url)}
        hitSlop={6}
        style={styles.compactBtn}
      >
        <MapPin size={16} color={colors.primary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => openFindClinic(url)}
      style={[
        styles.chip,
        { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
      ]}
    >
      <MapPin size={14} color={colors.primaryDeep} />
      <Text
        variant="caption"
        style={{ color: colors.primaryDeep, fontWeight: "600" }}
      >
        Hitta klinik
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
