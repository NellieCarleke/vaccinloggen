import { useMemo, useState } from "react";
import { Alert, Clipboard, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Copy, FileText, RefreshCw, Share2 } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { Screen } from "@/src/components/Screen";
import { Text } from "@/src/components/Text";
import { exportProfilePdf } from "@/src/export/pdf";
import { buildAndShareEncryptedExport } from "@/src/export/share";
import { generatePassphrase } from "@/src/export/encrypt";
import { useProfiles } from "@/src/stores/profilesStore";
import { useVaccinations } from "@/src/stores/vaccinationsStore";
import { t } from "@/src/i18n/sv";
import { radii, spacing } from "@/src/theme/tokens";
import { useTheme } from "@/src/theme/useTheme";

export default function ShareProfile() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfiles((s) => s.profiles.find((p) => p.id === id));
  const allVaccinations = useVaccinations((s) => s.vaccinations);
  const [passphrase, setPassphrase] = useState(() => generatePassphrase());
  const [pdfBusy, setPdfBusy] = useState(false);
  const [encBusy, setEncBusy] = useState(false);

  const ownVaccinations = useMemo(
    () => (profile ? allVaccinations.filter((v) => v.profileId === profile.id) : []),
    [allVaccinations, profile],
  );

  if (!profile) {
    return (
      <Screen>
        <Text tone="muted">Profilen hittades inte.</Text>
      </Screen>
    );
  }

  async function handlePdf() {
    setPdfBusy(true);
    try {
      await exportProfilePdf({ profile: profile!, vaccinations: ownVaccinations });
    } catch (e) {
      Alert.alert("Kunde inte skapa PDF", String(e));
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleEncrypted() {
    setEncBusy(true);
    try {
      const result = await buildAndShareEncryptedExport({
        profiles: [profile!],
        vaccinations: ownVaccinations,
        password: passphrase,
        exportedBy: profile!.name,
      });
      const lines = [t("share.encryptedSuccess")];
      if (result.attachmentsEmbedded > 0) {
        lines.push(
          t("share.encryptedAttachmentsEmbedded").replace(
            "{n}",
            String(result.attachmentsEmbedded),
          ),
        );
      }
      if (result.attachmentsSkipped > 0) {
        lines.push(
          t("share.encryptedAttachmentsSkipped").replace(
            "{n}",
            String(result.attachmentsSkipped),
          ),
        );
      }
      Alert.alert("Klart", lines.join("\n"));
    } catch (e) {
      Alert.alert("Fel", String(e));
    } finally {
      setEncBusy(false);
    }
  }

  function copyPass() {
    // RN's deprecated Clipboard works in SDK 54 for now; fine for MVP
    Clipboard.setString(passphrase);
    Alert.alert("Kopierat", "Lösenordet ligger nu i urklipp.");
  }

  return (
    <Screen scroll>
      <Text variant="display">{t("share.title")}</Text>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        {profile.name}
      </Text>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
            <FileText size={22} color={colors.primaryDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{t("share.pdfTitle")}</Text>
            <Text variant="caption" tone="muted">
              {t("share.pdfBody")}
            </Text>
          </View>
        </View>
        <Button onPress={handlePdf} loading={pdfBusy} fullWidth style={styles.cardBtn}>
          {t("share.pdfTitle")}
        </Button>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentMuted }]}>
            <Share2 size={22} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{t("share.encryptedTitle")}</Text>
            <Text variant="caption" tone="muted">
              {t("share.encryptedBody")}
            </Text>
          </View>
        </View>

        <View style={styles.passWrap}>
          <Text variant="captionBold" tone="secondary" style={styles.passLabel}>
            {t("share.encryptedPasswordLabel")}
          </Text>
          <View
            style={[
              styles.passBox,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}
          >
            <Text variant="bodyBold" style={{ flex: 1 }} selectable>
              {passphrase}
            </Text>
            <Pressable onPress={copyPass} hitSlop={8} style={styles.passIconBtn}>
              <Copy size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => setPassphrase(generatePassphrase())}
              hitSlop={8}
              style={styles.passIconBtn}
            >
              <RefreshCw size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text variant="caption" tone="muted" style={styles.passHint}>
            {t("share.encryptedPasswordHint")}
          </Text>
        </View>

        <Button
          onPress={handleEncrypted}
          loading={encBusy}
          fullWidth
          style={styles.cardBtn}
        >
          {t("share.encryptedShareNow")}
        </Button>
      </Card>

      <Button
        onPress={() => router.back()}
        variant="ghost"
        fullWidth
        style={{ marginTop: spacing.md }}
      >
        {t("profile.cancel")}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBtn: { marginTop: spacing.sm },
  passWrap: { gap: spacing.xs },
  passLabel: { textTransform: "uppercase", letterSpacing: 0.6 },
  passBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 44,
  },
  passIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  passHint: { marginTop: spacing.xs },
});
