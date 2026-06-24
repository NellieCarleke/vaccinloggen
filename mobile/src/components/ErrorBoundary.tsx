import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "./Button";
import { Text } from "./Text";
import { spacing } from "../theme/tokens";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Vaccinloggen kraschade:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text variant="h2" align="center">
          Något gick fel
        </Text>
        <Text tone="secondary" align="center">
          Appen stötte på ett oväntat fel. Dina data är säkra — försök igen
          eller starta om appen.
        </Text>
        {__DEV__ && (
          <Text variant="caption" tone="muted" align="center">
            {error.message}
          </Text>
        )}
        <Button onPress={this.reset} fullWidth>
          Försök igen
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.md,
  },
});
