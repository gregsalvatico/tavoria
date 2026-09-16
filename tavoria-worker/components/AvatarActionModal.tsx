import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";
import ResponsiveModal from "./ResponsiveModal";

type Props = {
  visible: boolean;
  canReplace?: boolean;
  onClose: () => void;
  onPreview: () => void;
  onReplace?: () => void;
};

export default function AvatarActionModal({ visible, canReplace = false, onClose, onPreview, onReplace }: Props) {
  const isDesktop = useIsDesktop();

  return (
    <ResponsiveModal visible={visible} onClose={onClose} panelStyle={isDesktop ? styles.panel : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("talent.profilePhoto")}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t("talent.close")} onPress={onClose} style={styles.close}>
          <Feather name="x" size={20} color={TAVORIA.color.navy} />
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Action icon="eye" label={t("talent.preview")} onPress={onPreview} />
        {canReplace && onReplace ? <Action icon="edit-2" label={t("talent.replace")} onPress={onReplace} /> : null}
      </View>
    </ResponsiveModal>
  );
}

function Action({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed }) => [styles.action, hovered && styles.actionHovered, pressed && styles.actionPressed]}
    >
      <View style={styles.icon}><Feather name={icon} size={18} color={TAVORIA.color.navy} /></View>
      <Text style={styles.actionText}>{label}</Text>
      <Feather name="chevron-right" size={17} color={TAVORIA.color.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { maxWidth: 420 },
  header: { alignItems: "center", borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 24 },
  close: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  actions: { gap: 6, padding: 14 },
  action: { alignItems: "center", borderRadius: TAVORIA.radius.small, flexDirection: "row", gap: 11, minHeight: 52, paddingHorizontal: 10 },
  actionHovered: { backgroundColor: TAVORIA.color.paperDeep },
  actionPressed: { opacity: 0.72 },
  icon: { alignItems: "center", backgroundColor: TAVORIA.color.paperDeep, borderRadius: 9, height: 34, justifyContent: "center", width: 34 },
  actionText: { color: TAVORIA.color.navy, flex: 1, fontSize: 15, fontWeight: "700" },
});
