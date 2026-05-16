import { Image, Pressable, StyleSheet, View } from "react-native";
import { FileText, Trash2 } from "lucide-react-native";

import { type PendingAttachment } from "./VaccinationForm";
import { fullUri } from "../utils/files";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { Text } from "./Text";

interface Props {
  attachments: PendingAttachment[];
  onRemove: (path: string) => void;
}

export function PendingAttachmentList({ attachments, onRemove }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      {attachments.map((att) => (
        <View key={att.path} style={styles.itemWrap}>
          <View
            style={[
              styles.item,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            {att.kind === "photo" ? (
              <Image source={{ uri: fullUri(att.path) }} style={styles.thumb} />
            ) : (
              <View style={styles.pdf}>
                <FileText size={32} color={colors.textSecondary} />
                <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
                  PDF
                </Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => onRemove(att.path)}
            hitSlop={8}
            style={[
              styles.deleteBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Trash2 size={14} color={colors.error} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  itemWrap: { width: 100, height: 100, position: "relative" },
  item: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: "100%", height: "100%", resizeMode: "cover" },
  pdf: { alignItems: "center", justifyContent: "center" },
  deleteBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
