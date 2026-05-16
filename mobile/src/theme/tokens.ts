// Designtokens för Vaccinloggen.
// En enda källa till sanning för färger, spacing, typografi, radii, shadows.
// Komponenter läser värden härifrån - aldrig hårdkodade färger eller spacing.

export type ColorScheme = "light" | "dark";

const palette = {
  // Primary: dämpad teal — lugn vårdkänsla, sticker ut från 1177:s blå
  teal50: "#E6F3F2",
  teal100: "#B8DCD9",
  teal300: "#5BA9A4",
  teal500: "#0E7C7B",
  teal700: "#0A5957",
  teal900: "#073B3A",

  // Accent: gulkortsgul — hommage till pappersvaccinationskortet
  yellow100: "#FCEFC2",
  yellow300: "#F8DD81",
  yellow500: "#F4D35E",
  yellow700: "#C9A636",

  // Neutrals
  warmWhite: "#FAFAF7",
  pureWhite: "#FFFFFF",
  gray50: "#F5F5F2",
  gray100: "#E8E8E2",
  gray300: "#C2C2BA",
  gray500: "#8A8A82",
  gray700: "#4A4A45",
  gray900: "#1A1A18",
  inkDark: "#0F1B1A",

  // Semantic
  successGreen: "#2D7A4F",
  successGreen100: "#D8EDDF",
  warningAmber: "#C77700",
  warningAmber100: "#F8E8C4",
  errorRed: "#B43E3E",
  errorRed100: "#F4D8D8",
} as const;

interface Colors {
  primary: string;
  primaryMuted: string;
  primaryDeep: string;
  accent: string;
  accentMuted: string;

  background: string;
  surface: string;
  surfaceMuted: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  border: string;
  borderStrong: string;

  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;

  shadow: string;
}

const lightColors: Colors = {
  primary: palette.teal500,
  primaryMuted: palette.teal100,
  primaryDeep: palette.teal700,
  accent: palette.yellow500,
  accentMuted: palette.yellow100,

  background: palette.warmWhite,
  surface: palette.pureWhite,
  surfaceMuted: palette.gray50,

  textPrimary: palette.inkDark,
  textSecondary: palette.gray700,
  textMuted: palette.gray500,
  textInverse: palette.pureWhite,

  border: palette.gray100,
  borderStrong: palette.gray300,

  success: palette.successGreen,
  successMuted: palette.successGreen100,
  warning: palette.warningAmber,
  warningMuted: palette.warningAmber100,
  error: palette.errorRed,
  errorMuted: palette.errorRed100,

  shadow: "rgba(15, 27, 26, 0.08)",
};

const darkColors: Colors = {
  primary: palette.teal300,
  primaryMuted: palette.teal900,
  primaryDeep: palette.teal100,
  accent: palette.yellow300,
  accentMuted: "#3A2F0E",

  background: "#0B1413",
  surface: "#152120",
  surfaceMuted: "#1F2D2C",

  textPrimary: "#F0F0EC",
  textSecondary: "#B8B8B0",
  textMuted: palette.gray500,
  textInverse: palette.inkDark,

  border: "#2A3736",
  borderStrong: "#3A4847",

  success: "#5FB37F",
  successMuted: "#1F3927",
  warning: "#E6A12F",
  warningMuted: "#3A2A0E",
  error: "#E07070",
  errorMuted: "#3A1E1E",

  shadow: "rgba(0, 0, 0, 0.3)",
};

export const colors: Record<ColorScheme, Colors> = {
  light: lightColors,
  dark: darkColors,
};

// Spacing rytm — multipler av 4px
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  h1: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  captionBold: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radii;
export type TypographyVariant = keyof typeof typography;
