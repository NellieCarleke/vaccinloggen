import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { importDecrypted, pickEncryptedFile } from "@/src/export/import";
import { t } from "@/src/i18n/sv";
import { radii, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function ImportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const reloadProfiles = useProfiles((s) => s.load);
  const reloadVaccinations = useVaccinations((s) => s.load);

  const [envelope, setEnvelope] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pickBusy, setPickBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  async function handlePick() {
    setPickBusy(true);
    try {
      const result = await pickEncryptedFile();
      if (!result) return;
      setEnvelope(result.envelope);
      setFilename(result.filename);
    } catch (e) {
      Alert.alert("Fel", String(e));
    } finally {
      setPickBusy(false);
    }
  }

  async function handleImport() {
    if (!envelope) return;
    if (!password.trim()) return;
    setImportBusy(true);
    try {
      const r = await importDecrypted(envelope, password.trim());
      await Promise.all([reloadProfiles(), reloadVaccinations()]);
      Alert.alert(
        t("share.importSuccessTitle"),
        t("share.importSuccessBody")
          .replace("{profiles}", String(r.profilesImported))
          .replace("{vaccinations}", String(r.vaccinationsImported))
          .replace(
            "{attachments}",
            String(r.attachmentsImported + r.attachmentsSkipped),
          ),
        [
          {
            text: "OK",
            onPress: () => router.dismissAll(),
          },
        ],
      );
    } catch (e) {
      const msg = String(e);
      if (msg.includes("Fel lösenord")) {
        Alert.alert("Fel", t("share.importErrorWrongPassword"));
      } else if (msg.includes("Ogiltigt filformat") || msg.includes("filversion")) {
        Alert.alert("Fel", t("share.importErrorInvalidFile"));
      } else {
        Alert.alert("Fel", msg);
      }
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Text variant="display">{t("share.importTitle")}</Text>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        {t("share.importBody")}
      </Text>

      <Card style={styles.card}>
        <View style={styles.fileRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <FileText size={20} color={colors.primaryDeep} />
          </View>
          <View style={{ flex: 1 }}>
            {filename ? (
              <>
                <Text variant="bodyBold" numberOfLines={1}>
                  {filename}
                </Text>
                <Text variant="caption" tone="muted">
                  Tryck "Välj fil" igen för att byta
                </Text>
              </>
            ) : (
              <Text tone="muted">Ingen fil vald</Text>
            )}
          </View>
        </View>
        <Button
          onPress={handlePick}
          variant="secondary"
          loading={pickBusy}
          fullWidth
          style={{ marginTop: spacing.md }}
        >
          {t("share.importPickFile")}
        </Button>
      </Card>

      {envelope && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Input
            label={t("share.importPasswordLabel")}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            onPress={handleImport}
            loading={importBusy}
            disabled={!password.trim()}
            fullWidth
          >
            {t("share.importRun")}
          </Button>
        </View>
      )}

      <Button
        onPress={() => router.back()}
        variant="ghost"
        fullWidth
        style={{ marginTop: spacing.lg }}
      >
        {t("profile.cancel")}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  fileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
