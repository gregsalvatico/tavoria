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
  paddingHorizontal: 20,
  width: "auto" as const,
};
