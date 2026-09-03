import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";
import { changeUsernamePin } from "../lib/usernameAuth";
import { desktopButtonStyle, useIsDesktop } from "../lib/responsive";

export default function ChangePin() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12} accessibilityLabel={t("common.back")}>
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
          <Text style={styles.wordmark}><Text style={{ color: "#F0531C" }}>T</Text>avoria.</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.content}>
          <Text style={styles.kicker}>{t("change_pin.kicker")}</Text>
          <Text style={styles.title}>{t("change_pin.title")}</Text>
          <Text style={styles.intro}>{t("change_pin.sub")}</Text>

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

          <Pressable style={[styles.submit, isDesktop && desktopButtonStyle, !canSubmit && styles.submitDisabled]} onPress={() => void submit()} disabled={!canSubmit || saving}>
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>{t("change_pin.save")}</Text>}
          </Pressable>
          <View style={styles.note}>
            <Feather name="mail" size={15} color="#F0531C" />
            <Text style={styles.noteText}>{t("change_pin.email_note")}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  safe: { backgroundColor: "#F7F4EE", flex: 1 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 58, paddingHorizontal: 16 },
  back: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  wordmark: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 27 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 34 },
  kicker: { color: "#F0531C", fontFamily: "DMMono_500Medium", fontSize: 11, letterSpacing: 1.3 },
  title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 36, lineHeight: 40, marginTop: 6 },
  intro: { color: "#5D6670", fontSize: 14, lineHeight: 20, marginBottom: 28, marginTop: 10 },
  field: { marginBottom: 17 },
  label: { color: "#0E1A24", fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { backgroundColor: "white", borderColor: "rgba(14,26,36,0.14)", borderRadius: 14, borderWidth: 1, color: "#0E1A24", fontFamily: "DMMono_500Medium", fontSize: 20, height: 54, letterSpacing: 7, paddingHorizontal: 16 },
  error: { color: "#B91C1C", fontSize: 12, lineHeight: 17, marginBottom: 12, marginTop: -7 },
  success: { alignItems: "flex-start", backgroundColor: "#EAF7F0", borderColor: "rgba(24,121,78,0.2)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 18, padding: 13 },
  successCopy: { flex: 1 },
  successTitle: { color: "#135C3C", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  successText: { color: "#256747", fontSize: 12, lineHeight: 17, marginTop: 2 },
  submit: { alignItems: "center", alignSelf: "center", backgroundColor: "#F0531C", borderRadius: 999, justifyContent: "center", marginTop: 8, minHeight: 54, width: "100%" },
  submitDisabled: { opacity: 0.42 },
  submitText: { color: "white", fontSize: 15, fontWeight: "800" },
  note: { alignItems: "flex-start", flexDirection: "row", gap: 8, marginTop: 18, paddingHorizontal: 4 },
  noteText: { color: "#6B7280", flex: 1, fontSize: 12, lineHeight: 17 },
});
