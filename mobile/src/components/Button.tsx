import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import { radii, spacing, typography } from "../theme/tokens";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth,
  style,
  testID,
}: Props) {
  const { colors } = useTheme();
  const bg = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    ghost: "transparent",
    danger: colors.error,
  }[variant];
  const fg = {
    primary: colors.textInverse,
    secondary: colors.textPrimary,
    ghost: colors.primary,
    danger: colors.textInverse,
  }[variant];
  const padV = { sm: spacing.sm, md: spacing.md, lg: spacing.base }[size];
  const padH = { sm: spacing.md, md: spacing.base, lg: spacing.lg }[size];
  const fontSize = { sm: 14, md: 16, lg: 17 }[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: variant === "ghost" ? colors.border : bg,
          paddingVertical: padV,
          paddingHorizontal: padH,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          style={{
            ...typography.bodyBold,
            fontSize,
            color: fg,
            textAlign: "center",
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
