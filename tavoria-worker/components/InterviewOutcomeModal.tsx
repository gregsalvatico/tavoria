import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";

export type InterviewOutcome = "hire" | "decline";

export default function InterviewOutcomeModal({
  visible,
  loading,
  onClose,
  onSelect,
}: {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSelect: (outcome: InterviewOutcome) => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Feather name="clipboard" size={25} color="#185FA5" />
          </View>
          <Text style={styles.title}>{t("candidate_actions.outcome_title")}</Text>
          <Text style={styles.body}>{t("candidate_actions.outcome_body")}</Text>

          <Pressable
            style={[styles.action, styles.hireAction]}
            disabled={loading}
            onPress={() => onSelect("hire")}
          >
            {loading ? <ActivityIndicator color="white" /> : <Feather name="check-circle" size={19} color="white" />}
            <View style={{ flex: 1 }}>
              <Text style={styles.hireTitle}>{t("candidate_actions.outcome_hire")}</Text>
              <Text style={styles.hireBody}>{t("candidate_actions.outcome_hire_sub")}</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.action, styles.declineAction]}
            disabled={loading}
            onPress={() => onSelect("decline")}
          >
            <Feather name="x-circle" size={19} color="#993556" />
            <View style={{ flex: 1 }}>
              <Text style={styles.declineTitle}>{t("candidate_actions.outcome_decline")}</Text>
              <Text style={styles.declineBody}>{t("candidate_actions.outcome_decline_sub")}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.cancel} disabled={loading} onPress={onClose}>
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(14,26,36,0.58)", flex: 1, justifyContent: "center", padding: 20 },
  card: { alignSelf: "center", backgroundColor: "white", borderRadius: 22, maxWidth: 430, padding: 22, width: "100%" },
  icon: { alignItems: "center", backgroundColor: "#E6F1FB", borderRadius: 999, height: 50, justifyContent: "center", marginBottom: 15, width: 50 },
  title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 27, lineHeight: 31 },
  body: { color: "#5D6670", fontSize: 14, lineHeight: 20, marginBottom: 18, marginTop: 7 },
  action: { alignItems: "center", borderRadius: 15, flexDirection: "row", gap: 11, marginTop: 9, minHeight: 68, paddingHorizontal: 15, paddingVertical: 11 },
  hireAction: { backgroundColor: "#3B6D11" },
  declineAction: { backgroundColor: "#FCEBEB", borderColor: "rgba(153,53,86,0.25)", borderWidth: 1 },
  hireTitle: { color: "white", fontSize: 14, fontWeight: "800" },
  hireBody: { color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: 15, marginTop: 2 },
  declineTitle: { color: "#993556", fontSize: 14, fontWeight: "800" },
  declineBody: { color: "#7D5261", fontSize: 11, lineHeight: 15, marginTop: 2 },
  cancel: { alignItems: "center", justifyContent: "center", marginTop: 8, minHeight: 46 },
  cancelText: { color: "#5D6670", fontSize: 14, fontWeight: "600" },
});
