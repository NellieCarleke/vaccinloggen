import { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";
import { radii, shadows, spacing } from "../theme/tokens";

interface Props {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle;
}

export function Card({
  children,
  onPress,
  padded = true,
  elevated = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const baseStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? spacing.base : 0,
    ...(elevated ? shadows.md : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          { opacity: pressed ? 0.9 : 1 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
