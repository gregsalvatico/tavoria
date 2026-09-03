import { Platform, useWindowDimensions } from "react-native";

/** True for the wide web layout used by the desktop shell. */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= 1024;
}

/** Applied after a full-width mobile button style to let desktop CTAs fit content. */
export const desktopButtonStyle = { width: "auto" as const };
