import { type ColorSchemeName, useColorScheme } from "react-native";

/**
 * "Ivory & Emerald" — the same palette the web client uses, translated to hex.
 * Emerald carries every primary action; gold marks prices and ratings; the
 * surfaces stay paper-white so listings photography leads.
 */
export type Theme = {
  dark: boolean;
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceRaised: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  gold: string;
  destructive: string;
  destructiveSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  overlay: string;
  chart: string[];
};

const light: Theme = {
  dark: false,
  background: "#FBFDFC",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F8F6",
  surfaceRaised: "#FFFFFF",
  foreground: "#0B2A23",
  foregroundMuted: "#64777180",
  border: "#E2E9E5",
  borderStrong: "#CBD6D1",
  primary: "#0E9F6E",
  primarySoft: "#E4F5EE",
  onPrimary: "#FFFFFF",
  accent: "#F2F7F4",
  gold: "#C08A1E",
  destructive: "#D4483A",
  destructiveSoft: "#FBEBE9",
  success: "#1E9E64",
  successSoft: "#E3F5EC",
  warning: "#B07C14",
  warningSoft: "#FBF1DC",
  info: "#2C6BCF",
  overlay: "rgba(8, 26, 22, 0.45)",
  chart: ["#0E9F6E", "#C08A1E", "#2C6BCF", "#D4483A", "#7B4BC4"],
};

const dark: Theme = {
  dark: true,
  background: "#0A1412",
  surface: "#12211E",
  surfaceSoft: "#172724",
  surfaceRaised: "#1B2E2A",
  foreground: "#EDF5F2",
  foregroundMuted: "#9DB0AA",
  border: "#263833",
  borderStrong: "#31473F",
  primary: "#31BC8B",
  primarySoft: "#14342A",
  onPrimary: "#062018",
  accent: "#1B322C",
  gold: "#E0B457",
  destructive: "#E4675A",
  destructiveSoft: "#3A1E1B",
  success: "#3FBE86",
  successSoft: "#14342A",
  warning: "#E0B457",
  warningSoft: "#3A2F14",
  info: "#6C9BF0",
  overlay: "rgba(0, 0, 0, 0.6)",
  chart: ["#31BC8B", "#E0B457", "#6C9BF0", "#E4675A", "#A585E8"],
};

export const lightTheme = light;
export const darkTheme = dark;

export function themeFor(scheme: ColorSchemeName): Theme {
  return scheme === "dark" ? dark : light;
}

export function useTheme(): Theme {
  return themeFor(useColorScheme());
}

/** Shared spacing / radius scale so screens stay on one rhythm. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;
