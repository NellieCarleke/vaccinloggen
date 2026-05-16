import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  StyleSheet,
  View,
} from "react-native";
import * as LocalAuth from "expo-local-authentication";
import { useTheme } from "../theme/useTheme";
import { spacing } from "../theme/tokens";
import { Button } from "./Button";
import { Text } from "./Text";
import { t } from "../i18n/sv";

// Gate the app behind a biometric / device-passcode prompt.
// Re-locks when the app is backgrounded and the previous unlock is older than
// LOCK_GRACE_MS (so quick app switches don't trigger constant re-prompts).

const LOCK_GRACE_MS = 30_000;

interface Props {
  children: ReactNode;
}

export function LockGate({ children }: Props) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState<boolean | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const lastUnlockedAtRef = useRef<number | null>(null);
  const promptingRef = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (promptingRef.current) return;
    promptingRef.current = true;
    setError(null);
    try {
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      const available = hasHardware && enrolled;
      setBiometricsAvailable(available);

      if (!available) {
        // Simulator or device without biometrics — let the user pass through.
        setUnlocked(true);
        lastUnlockedAtRef.current = Date.now();
        return;
      }

      const result = await LocalAuth.authenticateAsync({
        promptMessage: t("lock.unlockReason"),
        cancelLabel: t("common.cancel"),
        disableDeviceFallback: false,
      });

      if (result.success) {
        setUnlocked(true);
        lastUnlockedAtRef.current = Date.now();
      } else {
        setError(t("lock.subtitle"));
      }
    } finally {
      promptingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void tryUnlock();
  }, [tryUnlock]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        const last = lastUnlockedAtRef.current;
        if (last == null || Date.now() - last > LOCK_GRACE_MS) {
          setUnlocked(false);
          void tryUnlock();
        }
      }
    });
    return () => sub.remove();
  }, [tryUnlock]);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text variant="display" align="center">
          {t("lock.title")}
        </Text>
        <Text
          variant="body"
          tone="secondary"
          align="center"
          style={styles.subtitle}
        >
          {error ?? t("lock.subtitle")}
        </Text>
        <Button
          onPress={tryUnlock}
          style={styles.button}
          fullWidth
          testID="lock-unlock"
        >
          {t("lock.unlockButton")}
        </Button>
        {biometricsAvailable === false && (
          <Text variant="caption" tone="muted" align="center" style={styles.note}>
            {t("lock.biometricUnavailable")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.lg,
    width: "100%",
    maxWidth: 360,
    alignItems: "stretch",
  },
  subtitle: { marginTop: spacing.sm },
  button: { marginTop: spacing.xl },
  note: { marginTop: spacing.md },
});
