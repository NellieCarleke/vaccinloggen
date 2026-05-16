import { useState } from "react";
import { ActionSheetIOS, Alert, Platform, View } from "react-native";
import { Paperclip } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { Button } from "./Button";
import { Text } from "./Text";
import { createAttachment } from "../db/attachments";
import { type AttachmentKind } from "../db/attachments";
import { persistPickedFile } from "../utils/files";
import { t } from "../i18n/sv";
import { useTheme } from "../theme/useTheme";

export interface PickedAttachment {
  kind: AttachmentKind;
  path: string;
}

type Mode =
  | { mode: "save"; vaccinationId: string; onAdded: () => void }
  | { mode: "pending"; onPicked: (att: PickedAttachment) => void };

type Props =
  | { vaccinationId: string; onAdded: () => void; mode?: "save" }
  | { mode: "pending"; onPicked: (att: PickedAttachment) => void };

export function AttachmentPicker(props: Props) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  async function pickFromCamera() {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("attachment.permissionDeniedCamera"));
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        mediaTypes: "images",
      });
      if (res.canceled || !res.assets?.[0]) return;
      await save(res.assets[0].uri, "photo", "jpg");
    } finally {
      setBusy(false);
    }
  }

  async function pickFromLibrary() {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("attachment.permissionDeniedLibrary"));
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: false,
        mediaTypes: "images",
        selectionLimit: 1,
      });
      if (res.canceled || !res.assets?.[0]) return;
      await save(res.assets[0].uri, "photo", "jpg");
    } finally {
      setBusy(false);
    }
  }

  async function pickDocument() {
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const isPdf =
        asset.mimeType === "application/pdf" ||
        asset.name.toLowerCase().endsWith(".pdf");
      const ext = isPdf ? "pdf" : (extractExt(asset.name) ?? "jpg");
      await save(asset.uri, isPdf ? "pdf" : "photo", ext);
    } finally {
      setBusy(false);
    }
  }

  async function save(
    uri: string,
    kind: AttachmentKind,
    ext: string,
  ): Promise<void> {
    try {
      const path = await persistPickedFile(uri, ext);
      if ("vaccinationId" in props && props.vaccinationId) {
        await createAttachment({ vaccinationId: props.vaccinationId, kind, path });
        props.onAdded();
      } else if ("onPicked" in props) {
        props.onPicked({ kind, path });
      }
    } catch (e) {
      Alert.alert(t("attachment.saveFailed"), String(e));
    }
  }

  function showSheet() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("attachment.cancelPicker"),
            t("attachment.pickCamera"),
            t("attachment.pickLibrary"),
            t("attachment.pickDocument"),
          ],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) void pickFromCamera();
          else if (idx === 2) void pickFromLibrary();
          else if (idx === 3) void pickDocument();
        },
      );
    } else {
      Alert.alert(t("attachment.addCta"), undefined, [
        { text: t("attachment.pickCamera"), onPress: pickFromCamera },
        { text: t("attachment.pickLibrary"), onPress: pickFromLibrary },
        { text: t("attachment.pickDocument"), onPress: pickDocument },
        { text: t("attachment.cancelPicker"), style: "cancel" },
      ]);
    }
  }

  return (
    <Button
      onPress={showSheet}
      variant="secondary"
      loading={busy}
      fullWidth
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Paperclip size={16} color={colors.textPrimary} />
        <Text variant="bodyBold">{t("attachment.addCta")}</Text>
      </View>
    </Button>
  );
}

function extractExt(name: string): string | null {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1] : null;
}
