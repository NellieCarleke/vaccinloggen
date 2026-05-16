import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../theme/tokens";
import { Text } from "./Text";

interface Props {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function Header({ title, subtitle, trailing }: Props) {
  return <HeaderImpl title={title} subtitle={subtitle} trailing={trailing} />;
}

function HeaderImpl({ title, subtitle, trailing }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.text}>
        <Text variant="display">{title}</Text>
        {subtitle && (
          <Text variant="body" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing && <View>{trailing}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  text: { flex: 1 },
  subtitle: { marginTop: spacing.xs },
});
