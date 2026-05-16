import { Image, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { radii } from "../theme/tokens";
import { Text } from "./Text";

interface Props {
  name: string;
  imageUri?: string | null;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, imageUri, size = 48 }: Props) {
  const { colors } = useTheme();
  const sizing = { width: size, height: size, borderRadius: size / 2 };

  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[styles.image, sizing]} />;
  }

  const fontSize = Math.round(size * 0.4);
  return (
    <View
      style={[
        styles.placeholder,
        sizing,
        { backgroundColor: colors.primaryMuted },
      ]}
    >
      <Text
        style={{
          color: colors.primaryDeep,
          fontSize,
          lineHeight: Math.round(fontSize * 1.15),
          fontWeight: "700",
          includeFontPadding: false,
          textAlign: "center",
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: "cover" },
  placeholder: { alignItems: "center", justifyContent: "center" },
});
