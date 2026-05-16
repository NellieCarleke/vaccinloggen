import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/useTheme";
import { spacing } from "../theme/tokens";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scroll = false, padded = true, style }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  const contentStyle = [
    padded && {
      paddingHorizontal: spacing.base,
      paddingTop: spacing.md,
      paddingBottom: insets.bottom + spacing.lg,
    },
    style,
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <Container
        style={styles.flex}
        contentContainerStyle={scroll ? contentStyle : undefined}
      >
        {scroll ? children : <View style={contentStyle}>{children}</View>}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
