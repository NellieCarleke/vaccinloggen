import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../theme/tokens";
import { Text } from "./Text";

interface Props {
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text variant="h2" align="center">
        {title}
      </Text>
      {body && (
        <Text variant="body" tone="secondary" align="center" style={styles.body}>
          {body}
        </Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.lg,
  },
  body: { marginTop: spacing.sm, maxWidth: 320 },
  action: { marginTop: spacing.lg },
});
