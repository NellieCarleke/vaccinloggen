import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import { radii, spacing, typography } from "../theme/tokens";
import { Text } from "./Text";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
}

export function Input({ label, error, helper, style, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text variant="captionBold" tone="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          typography.body,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor,
          },
          rest.multiline && { textAlignVertical: "top", paddingTop: spacing.md },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="error" style={styles.helper}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" tone="muted" style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  helper: { marginTop: spacing.xxs },
});
