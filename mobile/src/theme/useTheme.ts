import { useColorScheme } from "react-native";
import { colors, type ColorScheme } from "./tokens";

export function useTheme() {
  const scheme = (useColorScheme() ?? "light") as ColorScheme;
  return {
    scheme,
    colors: colors[scheme],
    isDark: scheme === "dark",
  };
}
