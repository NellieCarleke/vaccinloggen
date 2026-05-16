import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/useTheme";
import { radii, spacing } from "../theme/tokens";
import { Text } from "./Text";
import { formatDateLong } from "../utils/dates";

interface Props {
  label: string;
  value: Date | null;
  onChange: (next: Date) => void;
  placeholder?: string;
  error?: string | null;
  maximumDate?: Date;
  minimumDate?: Date;
  /**
   * iOS picker style. "spinner" (default) shows wheel pickers for day/month/year
   * and is the right choice for birth dates — the inline calendar gets stuck in
   * year-wheel mode once you tap the header.
   */
  display?: "spinner" | "inline" | "compact";
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = "Välj datum",
  error,
  maximumDate,
  minimumDate,
  display = "spinner",
}: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(Platform.OS === "ios");

  function onDateChange(_e: DateTimePickerEvent, d?: Date) {
    if (Platform.OS === "android") setShow(false);
    if (d) onChange(d);
  }

  return (
    <View style={styles.wrapper}>
      <Text variant="captionBold" tone="secondary" style={styles.label}>
        {label}
      </Text>
      {Platform.OS === "android" ? (
        <Pressable
          onPress={() => setShow(true)}
          style={[
            styles.button,
            {
              borderColor: error ? colors.error : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text tone={value ? "primary" : "muted"}>
            {value ? formatDateLong(value) : placeholder}
          </Text>
        </Pressable>
      ) : null}
      {(show || Platform.OS === "ios") && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? display : "default"}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={onDateChange}
          locale="sv-SE"
        />
      )}
      {error && (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { textTransform: "uppercase", letterSpacing: 0.6 },
  button: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
});
