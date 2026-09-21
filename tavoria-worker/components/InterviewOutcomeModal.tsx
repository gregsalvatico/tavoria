import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import TavoriaModal from "./TavoriaModal";

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
    <TavoriaModal
      visible={visible}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={t("candidate_actions.outcome_title")}
      subtitle={t("candidate_actions.outcome_body")}
    >
      <View style={styles.icon}>
        <Feather name="clipboard" size={25} color="#185FA5" />
      </View>

      <Pressable
        style={[styles.action, styles.hireAction]}
        disabled={loading}
        onPress={() => onSelect("hire")}
      >
        <Feather name="check-circle" size={19} color="white" />
        <View style={{ flex: 1 }}>
          <Text style={styles.hireTitle}>{t("candidate_actions.outcome_hire")}</Text>
          <Text style={styles.hireBody}>{t("candidate_actions.outcome_hire_sub")}</Text>
        </View>
        {loading ? <ActivityIndicator color="white" size="small" /> : null}
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
    </TavoriaModal>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: "center", backgroundColor: "#E6F1FB", borderRadius: 999, height: 50, justifyContent: "center", marginBottom: 15, width: 50 },
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
