import { Alert, Linking } from "react-native";
import { t } from "./i18n";

/** Opens an external app only when the device supports its URL scheme. */
export async function openExternalLink(url: string | null | undefined, target: string) {
  if (!url) {
    Alert.alert(t("external_link.unavailable_title"), t("external_link.unavailable_body", { target }));
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t("external_link.unavailable_title"), t("external_link.unavailable_body", { target }));
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(t("external_link.unavailable_title"), t("external_link.unavailable_body", { target }));
    return false;
  }
}
