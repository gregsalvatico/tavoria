import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onExplore: () => void;
};

export default function ProInvitationModal({ visible, onClose, onExplore }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.icon}>
            <Feather name="star" size={20} color="#F0531C" />
          </View>
          <Text style={styles.title}>Invite candidates with Pro</Text>
          <Text style={styles.body}>
            Tavoria Pro will let you request an interview before a worker applies to one of your shifts.
          </Text>
          <Text style={styles.note}>Pro is coming soon. You can still review applicants for free today.</Text>
          <Pressable style={styles.primary} onPress={onExplore}>
            <Text style={styles.primaryText}>Explore Tavoria Pro</Text>
            <Feather name="arrow-right" size={18} color="white" />
          </Pressable>
          <Pressable style={styles.secondary} onPress={onClose}>
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(14,26,36,0.5)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#F7F4EE",
    borderRadius: 20,
    maxWidth: 440,
    padding: 22,
    width: "100%",
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#FFE0CE",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    marginBottom: 14,
    width: 42,
  },
  title: { color: "#0E1A24", fontSize: 21, fontWeight: "800", letterSpacing: -0.35 },
  body: { color: "#46505A", fontSize: 14, lineHeight: 20, marginTop: 8 },
  note: { color: "#6B7280", fontSize: 12, lineHeight: 17, marginTop: 10 },
  primary: {
    alignItems: "center",
    backgroundColor: "#F0531C",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "800" },
  secondary: { alignItems: "center", marginTop: 14, minHeight: 30, justifyContent: "center" },
  secondaryText: { color: "#46505A", fontSize: 14, fontWeight: "700" },
});
