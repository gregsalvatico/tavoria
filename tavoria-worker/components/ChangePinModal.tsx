import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { t } from "../lib/i18n";
import { changeUsernamePin } from "../lib/usernameAuth";
import { TAVORIA } from "../lib/designTokens";
import ActionButton from "./ActionButton";
import TavoriaModal from "./TavoriaModal";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ChangePinModal({ visible, onClose }: Props) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotificationSent, setEmailNotificationSent] = useState<boolean | null>(null);

  const pinsMatch = newPin === confirmPin;
  const canSubmit = /^\d{4}$/.test(currentPin) && /^\d{4}$/.test(newPin) && pinsMatch && currentPin !== newPin;

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    setEmailNotificationSent(null);
    try {
      const result = await changeUsernamePin({ currentPin, newPin });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setEmailNotificationSent(result.emailNotificationSent);
    } catch (caught: any) {
      setError(caught?.message ?? t("change_pin.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TavoriaModal
      visible={visible}
      onClose={onClose}
      title={t("change_pin.drawer")}
      subtitle={t("change_pin.sub")}
    >
      <PinField label={t("change_pin.current")} value={currentPin} onChangeText={setCurrentPin} />
      <PinField label={t("change_pin.new")} value={newPin} onChangeText={setNewPin} />
      <PinField label={t("change_pin.confirm")} value={confirmPin} onChangeText={setConfirmPin} />
      {emailNotificationSent !== null ? (
        <View style={styles.success} accessibilityLiveRegion="polite">
          <Feather name="check-circle" size={18} color="#18794E" />
          <View style={styles.successCopy}>
            <Text style={styles.successTitle}>{t("change_pin.success_title")}</Text>
            <Text style={styles.successText}>
              {emailNotificationSent ? t("change_pin.success_email") : t("change_pin.success_no_email")}
            </Text>
          </View>
        </View>
      ) : null}
      {confirmPin.length === 4 && !pinsMatch ? <Text style={styles.error}>{t("change_pin.no_match")}</Text> : null}
      {currentPin.length === 4 && newPin.length === 4 && currentPin === newPin ? <Text style={styles.error}>{t("change_pin.same_pin")}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton
        label={t("change_pin.save")}
        icon="check"
        loading={saving}
        disabled={!canSubmit}
        onPress={() => void submit()}
        style={styles.submit}
      />
      <View style={styles.note}>
        <Feather name="mail" size={15} color={TAVORIA.color.orange} />
        <Text style={styles.noteText}>{t("change_pin.email_note")}</Text>
      </View>
    </TavoriaModal>
  );
}

function PinField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(next) => onChangeText(next.replace(/\D/g, "").slice(0, 4))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="••••"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 15 },
  label: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: 14, borderWidth: 1, color: TAVORIA.color.navy, fontFamily: "DMMono_500Medium", fontSize: 20, height: 54, letterSpacing: 7, paddingHorizontal: 16 },
  error: { color: TAVORIA.color.error, fontSize: 12, lineHeight: 17, marginBottom: 12, marginTop: -5 },
  success: { alignItems: "flex-start", backgroundColor: "#EAF7F0", borderColor: "rgba(24,121,78,0.2)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 16, padding: 13 },
  successCopy: { flex: 1 },
  successTitle: { color: "#135C3C", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  successText: { color: "#256747", fontSize: 12, lineHeight: 17, marginTop: 2 },
  submit: { alignSelf: "stretch", marginTop: 4 },
  note: { alignItems: "flex-start", flexDirection: "row", gap: 8, marginTop: 16, paddingHorizontal: 4 },
  noteText: { color: TAVORIA.color.muted, flex: 1, fontSize: 12, lineHeight: 17 },
});
