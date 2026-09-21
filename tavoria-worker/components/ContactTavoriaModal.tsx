import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import { openExternalLink } from "../lib/externalLinks";
import TavoriaModal from "./TavoriaModal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ContactTavoriaModal({ visible, onClose }: Props) {
  const open = (url: string, target: string) => {
    onClose();
    void openExternalLink(url, target);
  };

  return (
    <TavoriaModal visible={visible} onClose={onClose} title={t("team_contact.title")} subtitle={t("team_contact.subtitle")}>
      <ContactOption
        icon="mail"
        title={t("team_contact.email")}
        detail={t("team_contact.email_detail")}
        onPress={() => open("mailto:hello@tavoriapp.com", t("external_link.email"))}
      />
      <ContactOption
        icon="instagram"
        title={t("team_contact.instagram")}
        detail={t("team_contact.instagram_detail")}
        onPress={() => open("https://www.instagram.com/tavoriapp/", t("team_contact.instagram"))}
      />

      <Pressable
        onPress={onClose}
        style={({ hovered, pressed }) => [
          styles.cancel,
          hovered && styles.cancelHovered,
          pressed && styles.cancelPressed,
        ]}
      >
        <Text style={styles.cancelText}>{t("team_contact.cancel")}</Text>
      </Pressable>
    </TavoriaModal>
  );
}

function ContactOption({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ hovered, pressed }) => [
        styles.option,
        hovered && styles.optionHovered,
        pressed && styles.optionPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.optionIcon}>
        <Feather name={icon} size={19} color="#0E1A24" />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDetail}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#6B7280" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { alignItems: "center", backgroundColor: "#F7F4EE", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 13 },
  optionHovered: { backgroundColor: "#F1EFE8" },
  optionPressed: { opacity: 0.72 },
  optionIcon: { alignItems: "center", backgroundColor: "#FFF1E8", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  optionText: { flex: 1 },
  optionTitle: { color: "#0E1A24", fontSize: 15, fontWeight: "700" },
  optionDetail: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  cancel: { alignItems: "center", borderRadius: 10, marginTop: 8, paddingVertical: 10 },
  cancelHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  cancelPressed: { opacity: 0.72 },
  cancelText: { color: "#6B7280", fontSize: 14, fontWeight: "700" },
});
