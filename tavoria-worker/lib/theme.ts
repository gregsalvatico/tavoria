// Phase 1 of the Tavoria app redesign. Centralises the brand palette and
// font-family names. Screens still use hardcoded hex literals after Phase 1
// — the global find-and-replace in Phase 1 brings every literal to the new
// palette. Phase 2+ migrates per-screen styles to import from this file.

export const colors = {
  paper: "#F7F4EE", // background
  ink: "#0E1A24", // primary text + dark surfaces
  tangerine: "#F0531C", // brand accent + CTA
  mute: "#5C6670", // secondary text
  mute2: "#46505A", // tertiary text / borders
  surface: "#FFFFFF", // cards on paper
  hairline: "rgba(14,26,36,0.08)",
  hairlineStrong: "rgba(14,26,36,0.12)",
  // Status colours kept from the existing palette
  success: "#0F6E56",
  warn: "#854F0B",
  danger: "#B91C1C",
  // Worker-side blue + venue-side soft tones kept for tile differentiation
  workerBlue: "#185FA5",
  workerBlueSoft: "#E7F0F9",
  venueOrangeSoft: "#FFEFE6",
} as const;

export const fonts = {
  sans: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemibold: "HankenGrotesk_600SemiBold",
  sansBold: "HankenGrotesk_700Bold",
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  mono: "DMMono_400Regular",
  monoMedium: "DMMono_500Medium",
} as const;
