import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "../theme/useTheme";
import { typography, type TypographyVariant } from "../theme/tokens";

type Tone = "primary" | "secondary" | "muted" | "inverse" | "accent" | "error";

interface Props extends TextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: TextStyle["textAlign"];
}

export function Text({
  variant = "body",
  tone = "primary",
  align,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const colorByTone: Record<Tone, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    inverse: colors.textInverse,
    accent: colors.primary,
    error: colors.error,
  };

  return (
    <RNText
      style={[
        typography[variant],
        { color: colorByTone[tone], textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
