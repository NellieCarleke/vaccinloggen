import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { FileText, Trash2 } from "lucide-react-native";

import { type Attachment, deleteAttachment } from "../db/attachments";
import { deleteFile, fullUri } from "../utils/files";
import { t } from "../i18n/sv";
import { radii, spacing } from "../theme/tokens";
import { useTheme } from "../theme/useTheme";
import { Card } from "./Card";
import { Text } from "./Text";
import { AttachmentViewer } from "./AttachmentViewer";

interface Props {
  attachments: Attachment[];
  onDeleted?: (id: string) => void;
}

export function AttachmentList({ attachments, onDeleted }: Props) {
  const { colors } = useTheme();
  const [viewing, setViewing] = useState<Attachment | null>(null);

  if (attachments.length === 0) {
    return (
      <Card>
        <Text tone="muted">{t("attachment.empty")}</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
          {t("attachment.emptyHint")}
        </Text>
      </Card>
    );
  }

  async function open(att: Attachment) {
    if (att.kind === "pdf") {
      try {
        await WebBrowser.openBrowserAsync(fullUri(att.path));
      } catch {
        Alert.alert("Kunde inte öppna PDF.");
      }
    } else {
      setViewing(att);
    }
  }

  function confirmDelete(att: Attachment) {
    Alert.alert(
      t("attachment.deleteConfirmTitle"),
      t("attachment.deleteConfirmBody"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("attachment.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteAttachment(att.id);
            await deleteFile(att.path);
            onDeleted?.(att.id);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {attachments.map((att) => (
          <View key={att.id} style={styles.itemWrap}>
            <Pressable
              onPress={() => open(att)}
              onLongPress={() => confirmDelete(att)}
              style={[
                styles.item,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              {att.kind === "photo" ? (
                <Image
                  source={{ uri: fullUri(att.path) }}
                  style={styles.thumb}
                />
              ) : (
                <View style={styles.pdf}>
                  <FileText size={32} color={colors.textSecondary} />
                  <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
                    PDF
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(att)}
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

      <AttachmentViewer
        attachment={viewing}
        onClose={() => setViewing(null)}
        onDelete={(att) => {
          setViewing(null);
          confirmDelete(att);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
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
