import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2, X } from "lucide-react-native";

import { type Attachment } from "../db/attachments";
import { fullUri } from "../utils/files";
import { spacing } from "../theme/tokens";

interface Props {
  attachment: Attachment | null;
  onClose: () => void;
  onDelete: (att: Attachment) => void;
}

export function AttachmentViewer({ attachment, onClose, onDelete }: Props) {
  if (!attachment) return null;

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.toolbar}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.btn}>
              <X size={22} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => onDelete(attachment)}
              hitSlop={12}
              style={styles.btn}
            >
              <Trash2 size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: fullUri(attachment.path) }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)" },
  safe: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: { flex: 1 },
  image: { flex: 1, width: "100%" },
});
