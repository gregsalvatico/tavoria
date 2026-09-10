import { Platform, useWindowDimensions } from "react-native";

/** True for the wide web layout used by the desktop shell. */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= 1024;
}

/** Applied after mobile button styles so desktop actions fit content with comfortable side padding. */
export const desktopButtonStyle = {
  alignSelf: "center" as const,
  flex: 0,
  flexShrink: 0,
  maxHeight: 48,
  minHeight: 48,
  minWidth: 220,
  paddingHorizontal: 16,
  paddingVertical: 14,
  width: "auto" as const,
};
