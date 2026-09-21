import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TAVORIA } from "../lib/designTokens";
import { t } from "../lib/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/** Shared centered dialog used by account utilities and other app-level actions. */
export default function TavoriaModal({ visible, onClose, title, subtitle, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ hovered, pressed }) => [
                styles.close,
                hovered && styles.closeHovered,
                pressed && styles.closePressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Feather name="x" size={19} color="#46505A" />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "rgba(14,26,36,0.52)", flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: TAVORIA.color.paper, borderRadius: 20, maxHeight: "92%", maxWidth: 480, padding: 20, width: "100%" },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  headerCopy: { flex: 1 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 26, lineHeight: 30 },
  subtitle: { color: TAVORIA.color.muted, fontSize: 13, lineHeight: 18, marginTop: 5 },
  close: { alignItems: "center", backgroundColor: "#E9E7E1", borderRadius: 999, height: 34, justifyContent: "center", width: 34 },
  closeHovered: { backgroundColor: "#DDDAD2" },
  closePressed: { opacity: 0.72 },
  content: { paddingTop: 18 },
});
